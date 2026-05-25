// Generic typed in-process event emitter. Knows nothing about any specific
// event catalog - the caller parameterizes it with their own event map.

export type DefaultHandler = ((evType: string, payload: unknown) => Promise<void>)

export function createEventEmitter<TMap extends Record<string, unknown>>(
	defaultHandler: DefaultHandler | null = null
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

			if (!list) {
				if (defaultHandler) await defaultHandler(ev, payload)
				return
			}

			const prms = list.map(handler => handler(payload))
			return await Promise.all(prms)
		},
	}
}

export type EventEmitter<TMap extends Record<string, unknown>> = 
	ReturnType<typeof createEventEmitter<TMap>>
