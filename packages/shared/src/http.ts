export const HttpCodes = {
	Ok: 200,
	Created: 201,
	NoContent: 204,
	BadRequest: 400,
	Unauthorized: 401,
	Forbidden: 403,
	NotFound: 404,
	UnprocessableEntity: 422,
	InternalServerError: 500,
} as const

// This creates a Union type: 200 | 201 | 204 | 400 | 401 | 403 | 404 | 422 | 500
// Accessed with dot notation - HttpCodes.NotFound

export type HttpCode = (typeof HttpCodes)[keyof typeof HttpCodes]

export type ErrorCode = 

  | 'BAD_REQUEST' 
  | 'ENTITY_NOT_FOUND' 
  | 'VALIDATION_FAILED' 
  | 'NOT_AUTHENTICATED' 
  | 'INSUFFICIENT_PERMISSIONS' 

  | 'INTERNAL_ERROR'

export interface ApiErrorResponse {
	type: 'fail' | 'error'
	code: ErrorCode     // e.g., 'ENTITY_NOT_FOUND'
	message: string     // Human-readable message
	details?: any[]     // Optional: for Zod validation errors
	stack?: string      // Optional: only sent in development
}
