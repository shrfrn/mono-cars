// Generic typed in-process event emitter. Knows nothing about any specific
// event catalog - the caller parameterizes it with their own event map.

import { logger } from '#services/logger.service.js'

export type DefaultHandler = ((evType: string, payload: unknown) => Promise<void>)

async function logUnhandledEvent(evType: string, payload: unknown) {
	logger.warn(`No handlers registered for event: ${evType}`, payload)
}

export function createEventEmitter<TMap extends Record<string, unknown>>(
	defaultHandler: DefaultHandler = logUnhandledEvent,
) {
	type EvKey = keyof TMap & string
	type Handler<K extends EvKey> = (payload: TMap[K]) => Promise<void>

	type TypedMap = Omit<Map<EvKey, unknown>, 'get' | 'set'> & {
		get<K extends EvKey>(key: K): Handler<K>[] | undefined,
		set<K extends EvKey>(key: K, value: Handler<K>[]): TypedMap,
	}

	const handlers = new Map() as TypedMap

	return {
		on<K extends EvKey>(ev: K, fn: Handler<K>) {
			const list = handlers.get(ev)
			list ? list.push(fn) : handlers.set(ev, [fn])
		},

		off<K extends EvKey>(ev: K, fn: Handler<K>) {
			const list = handlers.get(ev) || []
			const idx = list.findIndex(handler => handler === fn)
			if (idx >= 0) list.splice(idx, 1)
		},

		async emit<K extends EvKey>(ev: K, payload: TMap[K]) {
			const list = handlers.get(ev)

			if (!list?.length) {
				await defaultHandler(ev, payload)
				return
			}

			const results = await Promise.allSettled(list.map(handler => handler(payload)))
			const rejections = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]

			rejections.forEach(r =>
				logger.warn(`Event handler failed: ${ev}`, r.reason))

			if (rejections.length === results.length) {
				throw rejections[0].reason
			}
		},
	}
}

export type EventEmitter<TMap extends Record<string, unknown>> =
	ReturnType<typeof createEventEmitter<TMap>>
