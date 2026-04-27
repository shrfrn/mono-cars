import { carService as local } from "./car.service.local"
import { carService as remote } from "./car.service.remote"

export const carService = 
    import.meta.env.VITE_ENTITY_SERVICES === 'LOCAL' ? local : remote

    
// Provide carService access in the browser conole when in development

declare global {
    interface Window {
        carService?: typeof carService; 
    }
}
if (import.meta.env.DEV) window.carService = carService
