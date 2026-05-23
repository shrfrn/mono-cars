import type { EventType, EventPayload, EventHandler } from './event.types.js'

type TypedEventMap = Omit<Map<EventType, unknown>, 'get' | 'set'> & {
	get<T extends EventType>(key: T): EventHandler<T>[] | undefined,
	set<T extends EventType>(key: T, func: EventHandler<T>[]): TypedEventMap,
}

export function createEventEmitter(defaultHandler: ((evType: string, payload: any) => Promise<void>) | null = null) {
	const eventHandlers = new Map() as TypedEventMap

	return {
		on<T extends EventType>(evType: T, func: (payload: EventPayload<T>) => Promise<void>) {
			const handlers = eventHandlers.get(evType)
			handlers ? handlers.push(func) : eventHandlers.set(evType, [func])
		},
		off<T extends EventType>(evType: T, func: (payload: EventPayload<T>) => Promise<void>) {
			const handlers = eventHandlers.get(evType) || []
			const idx = handlers.findIndex(handler => handler === func)
			handlers.splice(idx, 1)
		},
		async emit<T extends EventType>(evType: T, payload: EventPayload<T>) {
			const handlers = eventHandlers.get(evType)

			if (!handlers) {
				if (defaultHandler) defaultHandler(evType, payload)
			} else {
				const prms = handlers.map(handler => handler!(payload))
				return await Promise.all(prms)
			}
		},
	}
}
