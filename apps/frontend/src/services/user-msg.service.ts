import { createEventEmitter } from "./event-bus"

export const eventBus = createEventEmitter(_defaultHandler)

export function showSuccessMsg(txt: string) {
    eventBus.emit('user-msg', { type: 'success', txt })
}

export function showErrorMsg(txt: string) {
    eventBus.emit('user-msg', { type: 'error', txt })
}

function _defaultHandler(evType: string, payload: any) {
    console.groupCollapsed(`%cUnhandled event ${evType}`, `color: orange; font-weight: bold;`)
    console.log('payload:')
    console.log(payload)
    console.groupEnd()
}