# Plan 002 - Queue Cycle Test Strategy

## Scope

Plan tests for the full pipeline:

`registerTask` -> `dispatchLoop` -> `dispatchTaskBatch` -> event emitter (`emit/on/off`) -> queue manager wiring -> workers (`_runHandler` + idempotency + retries).

This plan is focused on backend queue infrastructure in:

- `apps/backend/src/services/queue/outbox.ts`
- `apps/backend/src/services/queue/event-bus.ts`
- `apps/backend/src/services/queue/job-queue.ts`
- `apps/backend/src/events/queues.config.ts`

## Goals

- Prove the happy path works end-to-end from task registration to worker completion.
- Prove failure paths are safe (strict all-handlers-must-succeed behavior, retry/dlq behavior, non-retryable errors).
- Prove idempotency guarantees across outbox and workers.
- Prove lifecycle behavior (start/stop/shutdown) does not leak timers/workers.

## Test Pyramid

1. Unit tests:
  Pure logic in outbox/event bus/job queue helpers.
   Fast feedback for state transitions and error classification.
2. Integration tests:
  Real Mongo + Redis + BullMQ in isolated test env.
   Exercise queue/outbox modules together with deterministic fixtures.
3. End-to-end scenario tests:
  Full runtime wiring via `queues.config` and minimal real handlers.
   Validate observability side effects (status updates, completed jobs, retries).

## Required Test Harness Setup

### 1) Test Runtime Dependencies

- Mongo test database (prefer ephemeral/containerized).
- Redis test instance for BullMQ.
- Dedicated database/queue names per test suite.
- Deterministic cleanup after each test (`taskOutbox`, `completedJobs`, queue drain/obliterate).

### 2) Test Utilities

- `buildTestEmitter()` helper to introspect handler invocations.
- `buildTestOutbox()` helper with very short `dispatchInterval` and small `batchSize`.
- `buildTestQueueManager()` helper with custom queue name prefix.
- `waitFor` polling helper for eventual assertions (queue systems are async by nature).
- Optional logger spy utility for verifying `warn/error` log calls.

### 3) Timing Controls

- Keep `dispatchInterval` small in tests (e.g. 20-50ms).
- Use bounded waits with explicit timeout messages.
- Avoid brittle fixed sleeps; prefer condition polling.

## Step-by-Step Pseudocode Plan

```text
function runQueueCycleTestPlan():
	initialize mongo + redis test env
	create isolated emitter, outbox, queue manager
	register minimal handlers with deterministic side effects

	test registerTask:
		insert valid event in transaction
		commit
		assert outbox doc exists as PENDING

	test dispatchLoop + dispatchTaskBatch success:
		start outbox loop
		wait until outbox doc becomes COMPLETE
		assert expected BullMQ job created
		assert worker processed job and wrote completedJobs record

	test emitter behavior:
		when no listeners -> default handler called, no throw
		when mixed listeners -> fulfilled overall, warn on rejected
		when all listeners reject -> emit throws

	test outbox retries:
		make emit fail repeatedly
		assert attempts increments on claim
		assert status returns to PENDING until maxAttempts
		assert final status FAILED after maxAttempts

	test worker retry boundaries:
		handler throws AppError(4xx) -> UnrecoverableError and no retries
		handler throws 5xx/generic -> BullMQ retries until attempts exhausted

	test idempotency:
		same job id processed twice
		assert second execution returns early from completedJobs check
		assert side effect not duplicated

	test shutdown:
		start loop/workers
		invoke stop/shutdown
		assert no active timer loop and workers/queues close cleanly

	cleanup mongo + redis artifacts
```

## Detailed Scenario Matrix

## A) `registerTask` Scenarios

1. Inserts valid task document
  Given valid `evType + payload + session`
   Expect one `taskOutbox` row with:
  - `status = PENDING`
  - `attempts = 0`
  - `startedAt = null`
  - `errorReason = null`
2. Schema validation failure
  Given invalid payload for event schema
   Expect parse error and no inserted document
3. Transactional integrity
  Given `registerTask` inside a transaction that aborts
   Expect no outbox row after abort

## B) `dispatchTaskBatch` / `dispatchLoop` Scenarios

1. Empty queue no-op
  With no `PENDING`/stuck tasks
   Expect no updates and no throws
2. Claim semantics
  Seed `PENDING` tasks
   After one batch, expect claimed tasks:
  - `status = PROCESSING` during run
  - `attempts` incremented by 1 at claim time
3. Success path completion
  Emit resolves
   Expect task status transitions to `COMPLETE`
4. Failure path before max attempts
  Emit rejects
   Expect task goes back to `PENDING`
   Expect `errorReason` captured
5. Failure path reaches max attempts
  Repeat rejects until threshold
   Expect final status `FAILED`
6. Stuck task pickup
  Seed `PROCESSING` with old `startedAt`
   Expect task included in fetch and retried
7. Batch-level error wrapping
  Force Mongo failure in each phase (`fetch/claim/complete/fail-write`) via stubs/mocks
   Expect `OutboxDispatchError` with correct `phase`, `taskIds`, `transient` flag
8. Loop resilience
  Force one dispatch cycle failure
   Expect loop logs error and schedules next run

## C) Event Emitter Scenarios

1. `on` + `emit` basic
  Register one handler
   Emit event
   Expect handler called with payload
2. `off` removes listener
  Register + remove handler
   Emit
   Expect handler not called
3. No handlers -> default handler
  Emit unhandled event
   Expect default handler called (no throw)
4. Partial failures
  Two handlers: one resolves, one rejects
   Expect `emit` rejects
   Expect warning logged for rejected handler
   Expect outbox task remains non-`COMPLETE` (`PENDING` retry or terminal `FAILED`)
5. Total failures
  All handlers reject
   Expect `emit` throws first rejection reason

## D) Queue Manager + Worker Scenarios

1. Event-to-job wiring
  Emit event from outbox
   Expect `queue.add` called for every configured `jobType`
   Verify job IDs follow `${jobType.name}-${task._id}`
2. Missing worker handler
  Push job with unknown `job.name`
   Expect error log and job failure
3. Handler success transaction
  Handler succeeds
   Expect completed job record inserted in `completedJobs`
4. Idempotency on repeated delivery
  Pre-insert completed record by same job id
   Run worker for duplicate job
   Expect early return and no duplicated side effects
5. Non-retryable app error
  Handler throws `AppError` with 4xx code
   Expect `UnrecoverableError` and no further retries
6. Retryable error
  Handler throws generic error / 5xx app error
   Expect BullMQ retries up to configured attempts
7. Worker failed event logging
  Force failure
   Expect `worker.on('failed')` logging includes queue/job/task metadata

## E) Cross-Module End-to-End Scenarios

1. Full happy flow
  Call `registerTask` in committed transaction
   Start outbox
   Wait for:
  - outbox row `COMPLETE`
  - queue job processed
  - completedJobs row exists
2. Emitter partial failure with strict dispatch rule
  Multiple handlers where one succeeds and one rejects
   Expect `emit` rejects
   Expect outbox task does not mark `COMPLETE`
   Expect outbox retries then final `FAILED` at max attempts if failures persist
3. All handlers fail then outbox retries
  All handlers reject for N attempts
   Expect outbox retries then final `FAILED` at max attempts
4. Restart recovery for stuck processing tasks
  Leave tasks in `PROCESSING` stale state
   Restart/start outbox
   Expect stale tasks reclaimed and processed

## Observability Assertions

- Validate core logs are emitted for:
  - Outbox dispatch error with phase metadata
  - Event handler rejection warning
  - Worker failure and job handler error metadata
- Keep log assertions resilient (match key substrings/fields, not full messages).

## Execution Order (Implementation Plan)

1. Add test framework + scripts for backend (`test`, `test:watch`, `test:integration`).
2. Build shared integration harness (Mongo/Redis lifecycle + cleanup).
3. Write unit tests:
  `event-bus`
   outbox update/error helpers
   job error classification
4. Write integration tests per module:
  `outbox.integration.test.ts`
   `job-queue.integration.test.ts`
   `event-bus.integration.test.ts`
5. Write one full e2e queue cycle test file:
  `queue-cycle.e2e.test.ts`
6. Stabilize flake points (timeouts, cleanup order, queue draining).
7. Add CI job for backend test suite with Redis + Mongo services.

## Risks and Mitigations

- Async flakiness:
  - Mitigate with deterministic polling and strict cleanup.
- Shared state leaks:
  - Use per-test namespace and full collection drain.
- Slow test runtime:
  - Keep unit tests dominant, integration targeted.
- Difficult failure reproducibility:
  - Add explicit helper knobs to force failures per phase.

## Deliverables

- Test harness utilities for queue/outbox systems.
- Unit + integration + e2e coverage for full dispatch cycle.
- CI-ready backend test command with stable infrastructure dependencies.

## Questions

Please answer inline below each question.

1. Which test runner do you want for backend now: `vitest`, `jest`, or Node built-in test runner?

Answer: `vitest`

1. For integration tests, should I use Docker-based Mongo/Redis (Testcontainers) or rely on locally running services in your environment?

Answer: Testcontainers

1. Do you want the first implementation pass to prioritize only the critical happy/failure e2e flows, or deliver the full matrix from this plan in one pass?

Answer: start with unit tests for across the pipeline, then integration tests and finally e2e

1. Should log assertions be mandatory in CI, or should we keep them minimal to avoid brittle tests?

Answer: I don't understand the question. what is CI?

Resolution: Keep log assertions minimal and focused on critical signals only (do not make verbose log text matching mandatory).

## Clarifications (1):

Partial failures

Two handlers for emitted event: one resolves, one rejects. the test:
 Expect emit resolves overall
 Expect warning logged for rejected handler

What should the behavior actually be when one emit resolves and the another rejects?  
What could be the cause for such a thing?

---

integration harness - what is the planned harness?

---

explain 7. Add CI job for backend test suite with Redis + Mongo services.

---

Explain CI-ready backend test command with stable infrastructure dependencies.

## Clarification Responses

### 1) What is CI?

CI means continuous integration. It is the automated pipeline that runs on every push/pull request to verify the code (tests, linting, build).  
For this plan, CI is where backend tests should run automatically and consistently.

### 2) Partial emit failure behavior (one handler resolves, another rejects)

Updated policy behavior in your emitter:

- If any handler fails, `emit` throws.
- Rejected handlers are logged as warnings.

This behavior matches the strict outbox contract where completion is allowed only after all required handlers succeed.

Typical causes for partial failures:

- One queue/worker path is temporarily down (Redis hiccup, worker not running).
- A specific handler has a logic bug while others are healthy.
- One handler depends on an external service that is failing (email/API), while another does not.
- Data shape is valid for one handler’s expectations but invalid for another handler’s deeper assumptions.

### 3) Planned integration harness (Testcontainers + Vitest)

Harness structure:

1. Global setup (`vitest.global-setup.ts`)
  Start `MongoDBContainer` and `RedisContainer`.
   Export dynamic connection URLs via env vars for tests.
2. Per-suite setup utilities
  Create isolated db name and queue prefix per test file.
   Build factory helpers:
  - `createTestEmitter()`
  - `createTestOutbox()`
  - `createTestQueueManager()`
3. Per-test cleanup
  Clear Mongo collections (`taskOutbox`, `completedJobs`, plus test fixtures).
   Drain and obliterate BullMQ queues.
   Remove workers and close queue instances.
4. Global teardown
  Stop Redis and Mongo testcontainers.

Why this harness:

- Fully isolated and deterministic.
- No dependency on locally running Redis/Mongo.
- Works the same locally and in CI.

### 4) Explain “Add CI job for backend test suite with Redis + Mongo services”

Meaning:

- Add a pipeline step (e.g. GitHub Actions job) that runs backend tests automatically.
- Since you chose Testcontainers, you do not need manually declared Redis/Mongo service blocks in most setups.
- The job only needs Docker availability so Testcontainers can spin the dependencies.

### 5) Explain “CI-ready backend test command with stable infrastructure dependencies”

Meaning:

- Provide one canonical command (for example `pnpm --filter backend test`) that:
  - runs all backend tests,
  - uses the same harness everywhere,
  - does not rely on ad-hoc local services.

“Stable infrastructure dependencies” means tests bring up required infra consistently (via Testcontainers) instead of assuming Mongo/Redis already exist.

## Updated Execution Priority

Per your answer, implementation should follow this order:

1. Unit tests across queue pipeline modules.
2. Integration tests with Testcontainers harness.
3. End-to-end queue cycle scenarios.
