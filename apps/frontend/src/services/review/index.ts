import { reviewService } from "./review.service.remote"

export { reviewService }
    
// Provide reviewService access in the browser console when in development

declare global {
    interface Window {
        reviewService?: typeof reviewService
    }
}
if (import.meta.env.DEV) window.reviewService = reviewService
