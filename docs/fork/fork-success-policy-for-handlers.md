# Fork: success policy for handlers

## Goal

Refactor dispatch semantics to an all-handlers-must-succeed policy: if any handler fails, treat dispatch as failed, retry the full job set, and rely on idempotency guards to prevent duplicate side effects.

## Scope

- In scope:
  - Event emitter success/failure contract for multi-handler emits
  - Outbox completion/failure transitions tied to handler outcomes
  - Queue retry behavior when at least one handler path fails
  - Tests (unit -> integration -> e2e) validating new policy
- Out of scope:
  - New product features unrelated to queue/outbox reliability
  - Full observability platform integration (Sentry/Datadog)

## Current State

- Completed:
  - Planning doc `plans/plan-002.md` created and updated with test strategy and clarifications.
  - Clarification identified that current behavior can mark outbox `COMPLETE` on partial handler failure.
- Partially done:
  - Policy decision discussion is complete, but code has not yet been refactored to enforce all-handlers-must-succeed.
  - Test framework/harness implementation has not started yet.
- Blocked:
  - No blocker in code access; only pending implementation work.

## Key Context

- Current relevant modules:
  - `apps/backend/src/services/queue/event-bus.ts`
  - `apps/backend/src/services/queue/outbox.ts`
  - `apps/backend/src/services/queue/job-queue.ts`
  - `apps/backend/src/events/queues.config.ts`
- Current emitter behavior:
  - Uses `Promise.allSettled`.
  - Logs rejected handlers.
  - Throws only when all handlers reject.
  - This allows partial success and can lead to lost side effects for failed handler paths.
- Current outbox behavior:
  - Marks outbox task `COMPLETE` for fulfilled emit results.
  - Uses retries and `FAILED` terminal status via `maxAttempts`.
- Existing idempotency guards already in place:
  - BullMQ job dedup with deterministic `jobId`.
  - Worker-side dedup via `completedJobs` collection check.
- Planning artifact:
  - `plans/plan-002.md` includes the pipeline-wide test matrix and clarification notes.

## Next Steps

1. Update emitter contract so any handler rejection causes `emit` rejection (all-handlers-must-succeed).
2. Ensure outbox treats any emit rejection as dispatch failure and retries according to `maxAttempts`.
3. Confirm retry path re-enqueues all derived jobs; keep completion only after successful all-handler dispatch.
4. Verify idempotency guards handle repeated dispatches without duplicate side effects.
5. Implement tests in order already agreed:
  ) unit tests across pipeline modules
  ) integration tests with Testcontainers
  ) e2e queue-cycle scenarios
6. Update `plans/plan-002.md` to reflect the finalized policy and adjusted scenario expectations.

## Verification

- Unit tests prove:
  - `emit` rejects when any handler fails.
  - Outbox marks `PENDING`/`FAILED` (not `COMPLETE`) on any handler failure.
- Integration tests prove:
  - Retry loop occurs when one handler fails and another succeeds.
  - Repeated retries do not duplicate side effects due to idempotency checks.
- E2E test proves:
  - Full cycle reaches `COMPLETE` only when all handlers succeed.
  - Terminal `FAILED` occurs after `maxAttempts` if any required handler keeps failing.

## Open Questions

- Should all handlers be considered required, or do you want optional handlers explicitly modeled in config? A: All required
- Should failure logging stay at warning level for handler failures, or be elevated to error under the new strict policy? A: Warning. Error only after maxAttempts exhausted
- Should `plans/plan-002.md` be updated immediately to remove partial-success expectations before implementation starts? yes

