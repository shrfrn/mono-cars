import z from 'zod'

import { CommentSchema, ReviewSchema } from '@car/shared'

export const EventTypeSchema = z.enum(['car.comment.add', 'review.add'])
export type EventType = z.infer<typeof EventTypeSchema>

export const EventSchema = z.discriminatedUnion('evType', [
	z.object({ evType: z.literal('car.comment.add'), payload: CommentSchema }),
	z.object({ evType: z.literal('review.add'), payload: ReviewSchema }),
])
export type Event = z.infer<typeof EventSchema>
export type EventPayload<T extends EventType> = Extract<Event, { evType: T }>['payload']
export type EventHandler<T extends EventType> = (task: OutboxTask<T>) => Promise<void>

export type OutboxTask<T extends EventType> = {
	_id: string,
	payload: EventPayload<T>,
}

export const CompletedJobSchema = z.object({
	_id: z.string(),
	completedAt: z.date(),
	taskId: z.string(),
	jobName: z.string(),
})
export type CompletedJob = z.infer<typeof CompletedJobSchema>

