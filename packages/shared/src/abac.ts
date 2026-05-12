import z from 'zod'
import { authService } from '../../../apps/frontend/src/services/auth'

const CriterionOperatorSchema = z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'notBetween'])
export type CriterionOperator = z.infer<typeof CriterionOperatorSchema>

const CriterionValueSchema = z.union([
	z.object({
		operator: z.enum(['gt', 'gte', 'lt', 'lte']),
		value: z.number(),
	}),
	z.object({
		operator: z.enum(['in', 'nin']),
		value: z.array(z.any()),
	}),
	z.object({
		operator: z.enum(['between', 'notBetween']),
		value: z.tuple([z.number(), z.number()]),
	}),
	z.object({
		operator: z.enum(['eq', 'neq']),
		value: z.any(),
	})
])

const CriterionValuePathSchema = z.object({
	operator: CriterionOperatorSchema,
	valuePath: z.string().includes('.')
})

export const CriterionSchema = z.object({
	path: z.string().includes('.'),
}).and(z.union([CriterionValuePathSchema, CriterionValueSchema]))

export const CapabilitySchema = z.object({
	operator: z.enum(['or', 'and']).optional(),
	references: z.array(z.string()),
})

export const PermissionSchema = z.object({
	operator: z.enum(['or', 'and']).optional(),
	references: z.array(z.string()),
})

export const AbacRulesSchema = z.object({
	criteria: z.record(z.string(), CriterionSchema),
	capabilities: z.record(z.string(), CapabilitySchema),
	permissions: z.record(z.string(), PermissionSchema),
})

export const PermissionRequestSchema = z.object({
	action: z.string(),
	resource: z.record(z.string(), z.unknown()).optional(),
	subject: z.record(z.string(), z.unknown()).optional(),
	env: z.record(z.string(), z.unknown()).optional()
})

export type Criterion = z.infer<typeof CriterionSchema>
// export type Criterion = Omit<BaseCriterion, 'path'> & {
// 	path: `${string}.${string}`
// }

export type Capability = z.infer<typeof CapabilitySchema>
export type Permission = z.infer<typeof PermissionSchema>
export type BaseAbacRules = z.infer<typeof AbacRulesSchema>

export type AbacRules<

	TCriteria extends Record<string, Criterion>,
	
	TCapability extends Record<string, Omit<Capability, 'references'> & {
		// Restrict to 'criteria.[CriteriaKey]' 
		references: Extract<keyof TCriteria, string>[] }>,

	TPermission extends Record<string, Omit<Permission, 'references'> & { 
		// Restrict to 'criteria.[CriteriaKey]' OR 'capabilities.[CapabilityKey]'
		references: (`criteria.${Extract<keyof TCriteria, string>}` | `capabilities.${Extract<keyof TCapability, string>}`)[] 
	}>> = {

		criteria: TCriteria,
		capabilities: TCapability,
		permissions: TPermission,
}

function defineAbacRules<

	TCriteria extends Record<string, Criterion>,

	TCapability extends Record<string, Omit<Capability, 'references'> & { 
		// Restrict to 'criteria.[CriteriaKey]'
		references: Extract<keyof TCriteria, string>[] }>,

	TPermission extends Record<string, Omit<Permission, 'references'> & { 
		// Restrict to 'criteria.[CriteriaKey]' OR 'capabilities.[CapabilityKey]'
		references: (`criteria.${Extract<keyof TCriteria, string>}` | `capabilities.${Extract<keyof TCapability, string>}`)[] 
	}>>

		(rules: AbacRules<TCriteria, TCapability, TPermission>) { 
			const parsed = AbacRulesSchema.parse(rules)
			return parsed as typeof rules 
		}

export type PermissionRequest = z.infer<typeof PermissionRequestSchema>

// Define the rules:

const abacRules =  defineAbacRules({
	criteria: {
		'isAdmin': { path: 'subject.role', operator: 'eq', value: 'Admin' },
		'isModerator': { path: 'subject.role', operator: 'eq', value: 'Moderator' },
		'isOwner': { path: 'resource.owner._id', operator: 'eq', valuePath: 'subject._id' },
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
	}
})

export const checkPermission = (request: PermissionRequest) => {
	const { action } = request
	
	const policy = abacRules?.permissions[action]
	if (!policy) throw new Error(`Policy for ${action} not found`)

	const method = (policy.operator === 'or') ? 'some' : 'every'

	return policy.references[method](reference => {
		const [type, key] = reference.split('.')		// key = either criteria or capabilities

		if (type === 'criteria') {
			const criterion = abacRules.criteria[key]
			return _evaluateCriterion(request, criterion)
		} else {
			const capability = abacRules.capabilities[key]
			const method = (capability.operator === 'or') ? 'some' : 'every'
			
			return capability.references[method](criterionKey => 
				_evaluateCriterion(request, abacRules.criteria[criterionKey]))
		}
	})
}

function _evaluateCriterion(request: PermissionRequest, criterion: Criterion) {
	const attr = _getValueByPath(request, criterion.path)
	const value = ('valuePath' in criterion) ? _getValueByPath(request, criterion.valuePath) : criterion.value

	return _performCheck(attr, criterion.operator, value)
}

function _getValueByPath(request: PermissionRequest, path: string) {
	return path.split('.').reduce((acc, segment) => acc[segment], request)
}

function _performCheck(attr: unknown, operator: CriterionOperator, value: unknown) {
	const attrIsNumber = (typeof attr === 'number')
	const valueIsArray = Array.isArray(value)

	console.log('attr', attr)
	console.log('operator', operator)
	console.log('value', value)
	console.log('--------------------------------')

	if (['gt', 'gte', 'lt', 'lte'].includes(operator) && !attrIsNumber ||
		['between', 'notBetween'].includes(operator) && (!attrIsNumber || !valueIsArray) ||
		['in', 'nin'].includes(operator) && !valueIsArray) {

			throw new Error('attribute and/or value incompatible with operator')
		}

	switch (operator) {
		case 'eq': return attr === value
		case 'neq': return attr !== value

		case 'gt': return attr > value
		case 'gte': return attr >= value
		case 'lt': return attr < value
		case 'lte': return attr <= value

		case 'in': 
			if (!Array.isArray(value))  throw new Error('value incompatible with operator')
			return value.includes(attr) 

		case 'nin': 
			if (!Array.isArray(value))  throw new Error('value incompatible with operator')
			return !value.includes(attr) 

		case 'between': return attr >= value[0] && attr <= value[1]
		case 'notBetween': return attr < value[0] || attr > value[1]

		default: throw new Error('Operator not found')
	}
}