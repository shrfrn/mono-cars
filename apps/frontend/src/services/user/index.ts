import { userService as local } from "./user.service.local"
import { userService as remote } from "./user.service.remote"

export const userService = 
    import.meta.env.VITE_ENTITY_SERVICES === 'LOCAL' ? local : remote

    
// Provide userService access in the browser console when in development

declare global {
    interface Window {
        userService?: typeof userService; 
    }
}
if (import.meta.env.DEV) window.userService = userService
