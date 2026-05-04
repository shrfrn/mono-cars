import { MiniUserSchema, type MiniUser, type SignupCredentials } from "@cars/shared"

import { authService as local } from "./auth.service.local"
import { authService as remote } from "./auth.service.remote"

function getLoggedInUser(): MiniUser | null {
    const loggedInUser = sessionStorage.getItem('loggedInUser')
    return loggedInUser ? MiniUserSchema.parse(JSON.parse(loggedInUser)) : null
}

function getEmptyCredentials(): SignupCredentials {
    return {
        username: '',
        password: '',
        fullname: '',
    }
}
const service = 
    import.meta.env.VITE_ENTITY_SERVICES === 'LOCAL' ? local : remote
	
export const authService = { ...service, getEmptyCredentials, getLoggedInUser }
    
// Provide authService access in the browser conole when in development

declare global {
    interface Window {
        authService?: typeof authService; 
    }
}
if (import.meta.env.DEV) window.authService = authService
