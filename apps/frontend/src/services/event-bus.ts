export function createEventEmitter(defaultHandler: ((evType: string, payload: any) => void) | null = null) {
    const eventHandlers = new Map<string, ((payload: any) => void)[]>()

    return {
        on(evType: string, func: (payload: any) => void) {
            const handlers = eventHandlers.get(evType) || []
            handlers ? handlers.push(func) : eventHandlers.set(evType, [func])
        },
        off(evType: string, func: (payload: any) => void) {
            const handlers = eventHandlers.get(evType) || []
            const idx = handlers.findIndex(handler => handler === func)
            handlers.splice(idx, 1)
        },
        emit(evType: string, payload: any) {
            const handlers = eventHandlers.get(evType)
            
            if (!handlers) {
                if (defaultHandler) defaultHandler(evType, payload)
            } else {
                handlers.forEach(handler => handler!(payload))
            }
        }
    }
}

