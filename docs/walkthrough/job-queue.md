# job-queue

> Generic BullMQ queue manager that listens on the event bus and runs typed job handlers with Mongo-backed idempotency.

## What

`createQueueManager` in `apps/backend/src/services/queue/job-queue.ts` wires BullMQ queues and workers to the in-process event emitter. When the outbox dispatches an event, the manager enqueues one BullMQ job per configured `jobType`, then workers run the matching handler inside a Mongo transaction.

## Where

- **Instantiated** in `apps/backend/src/events/queues.config.ts` as `jobManager`, with queue topology (`user`, `notification`), event-to-job fan-out, and handlers.
- **Started indirectly** when `server.ts` calls `startQueues()` → `outbox.start()`. The queue manager registers listeners at import time; jobs appear once the outbox emits events.
- **Stopped** on shutdown in `server.ts` via `jobManager.stop()`.

Producers (e.g. `car.service.ts`) do not call the queue manager directly — they call `outbox.registerTask()` inside a transaction.

## How

1. **`createQueueManager({ emitter, connection, queues })`** — for each queue definition:
   - Create a BullMQ `Queue` (default: 5 attempts, exponential backoff).
   - Build a `jobName → handler` map from `events[].jobTypes`.
   - Spawn `workerCount` BullMQ `Worker`s (default 1).
   - Subscribe the emitter: on each `evType`, enqueue jobs for every `jobType` on that queue.

2. **`_wireEmitter`** — listener per `(evType, jobType)`:
   - `jobId = \`${jobType.name}:${task._id}\`` (dedupes retries for the same outbox task).
   - `queue.add(jobType.name, task, { jobId })` — job data is the `OutboxTask` `{ _id, payload }`.

3. **Worker loop** — on job pickup:
   - Resolve handler from `job.name`; missing handler → fail job.
   - **`_runHandler`** — idempotency check in `completedJobs` by BullMQ `job.id`; skip if already done.
   - Run handler inside `withTransactionalSession`; on success, insert into `completedJobs` in the same transaction.
   - `AppError` with HTTP code &lt; 500 → `UnrecoverableError` (no BullMQ retry); other errors retry per job options.

4. **`stop()`** — close all workers and queue instances (graceful shutdown).

## Trace

`POST /cars/:id/comments` → `addComment()` → `outbox.registerTask('car.comment.add', comment, session)` (same txn as car update) → outbox dispatch loop claims row → `emitter.emit('car.comment.add', task)` → `_wireEmitter` on `user` queue → BullMQ jobs `user.activity.add:<taskId>`, `user.score.update:<taskId>` → worker runs handler(s) → `completedJobs` insert → HTTP response already returned
