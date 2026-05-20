import z from 'zod'
import { createChecker, defineAbacRules } from './abac.service.js'
import { MiniUserSchema, CarSchema, CommentSchema, ReviewSchema, type Comment } from '@cars/shared'

// Define the rules:

const abacRules =  defineAbacRules({
	criteria: {
		'isAdmin': { path: 'subject.role', operator: 'eq', value: 'Admin' },
		'isModerator': { path: 'subject.role', operator: 'eq', value: 'Moderator' },
		'isOwner': { path: 'resource.owner._id', operator: 'eq', valuePath: 'subject._id' },
		'isCommentAuthor': { path: 'resource.author._id', operator: 'eq', valuePath: 'subject._id' },
		'isReviewAuthor': { path: 'resource.byUser._id', operator: 'eq', valuePath: 'subject._id' },
		'isMfa': { path: 'subject.mfaVerified', operator: 'eq', value: true },
		'isOfficeHours': { path: 'env.hour', operator: 'between', value: [9, 17] },
		'isWeekend': { path: 'env.dow', operator: 'in', value: ['sat', 'sun'] },
	},
	capabilities: {
		'canWrite': {
			operator: 'or',
			references: ['isAdmin', 'isModerator', 'isOwner'],
		},
	},
	permissions: {
		'car:update': {
			operator: 'or',
			references: ['criteria.isAdmin', 'criteria.isModerator', 'criteria.isOwner'],
		},
		'car:delete': {
			references: ['capabilities.canWrite'],
		},
		'car:deleteComment': {
			operator: 'or',
			references: ['criteria.isAdmin', 'criteria.isModerator', 'criteria.isCommentAuthor'],
		},
		'review:delete': {
			operator: 'or',
			references: ['criteria.isAdmin', 'criteria.isModerator', 'criteria.isReviewAuthor'],
		},
	}
})


const EnvSchema = z.record(z.string(), z.unknown()).optional()
export const PermissionRequestSchema = z.discriminatedUnion('action', [
	z.object({ action: z.literal('car:update'),        subject: MiniUserSchema, resource: CarSchema,     env: EnvSchema }),
	z.object({ action: z.literal('car:delete'),        subject: MiniUserSchema, resource: CarSchema,     env: EnvSchema }),
	z.object({ action: z.literal('car:deleteComment'), subject: MiniUserSchema, resource: CommentSchema, env: EnvSchema }),
	z.object({ action: z.literal('review:delete'),     subject: MiniUserSchema, resource: ReviewSchema,  env: EnvSchema }),
])

export type PermissionRequest = z.infer<typeof PermissionRequestSchema>

// _PermissionKey = union type of all AbacRules.permissions key literals
// (i.e. 'car:delete', 'car:update', etc...)
type _PermissionKey = keyof typeof abacRules.permissions

// Check that every PermissionKey has a PermissionRequest variant definition
// _Missing = union type of all (AbacRules.permissions key literals - PermissionRequest.action key literals)
type _Missing = Exclude<_PermissionKey, PermissionRequest['action']>

// _Exhaustive is a conditional type: 
// if _Missing is an empty union (no keys missing) it evaluates to true
// if _Missing isn't empty (some keys on AbacRules are missing from PermissionRequest) it becomes a string litral which convays an error msg
type _Exhaustive = [_Missing] extends [never] 
? true 
: `Missing variant for: ${_Missing & string}`

// A declarative assertion which fails to compile if some keys are missing
true satisfies _Exhaustive

export type PermissionKey = PermissionRequest['action']

const evaluate = createChecker(abacRules)
export const checkPermission = (request: PermissionRequest) => evaluate(request)


// Per-action resource resolution.
// Defaults: collection inferred from the action prefix, resource = the parent doc.
// Add an entry only when the action diverges from these defaults
// (e.g. resource is embedded inside the parent, or lives in a non-prefix collection).

export type ResourceResolver = {
	collection?: string,
	resolve?: (parent: any, params: any) => unknown,
}

export const resourceResolvers: Partial<Record<PermissionKey, ResourceResolver>> = {
	'car:deleteComment': { resolve: (car, params) => car.comments?.find((c: Comment) => c.id === params.commentId) },
}
