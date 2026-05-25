// App-level event catalog. Single source of truth for which domain events
// exist and what payload each one carries. The runtime schema is consumed by
// the outbox for validation, and the inferred TMap type is consumed by the
// event bus, outbox and queue manager for compile-time safety.

import z from 'zod'

import { CommentSchema, ReviewSchema } from '@cars/shared'

import type { OutboxTask } from '#services/queue/outbox.js'

export const AppEventSchema = z.discriminatedUnion('evType', [
	z.object({ evType: z.literal('car.comment.add'), payload: CommentSchema }),
	z.object({ evType: z.literal('review.add'),      payload: ReviewSchema   }),
])

export type AppEvent = z.infer<typeof AppEventSchema>
export type AppEventType = AppEvent['evType']

export type AppEventMap = { [E in AppEvent as E['evType']]: OutboxTask<E['payload']> }
