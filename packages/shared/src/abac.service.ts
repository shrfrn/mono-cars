import z from 'zod'

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
}).and(z.union([CriterionValuePathSchema, CriterionValueSchema])) // Order of schemas in the union is important!

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

export type Criterion = z.infer<typeof CriterionSchema>
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

export function defineAbacRules<

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

export type BasePermissionRequest = {
	action: string,
	subject?: unknown,
	resource?: unknown,
	env?: Record<string, unknown>,
}

export function createChecker(rules: BaseAbacRules) {
	return function evaluate(request: BasePermissionRequest): boolean {
		const { action } = request
		
		const policy = rules.permissions[action]
		if (!policy) throw new Error(`Policy for ${action} not found`)

		const method = ('operator' in policy && policy.operator === 'or') ? 'some' : 'every'

		return (policy.references as string[])[method](reference => {
			const [type, key] = reference.split('.')

			if (type === 'criteria') return _evaluateCriterion(request, rules.criteria[key])

			const capability = rules.capabilities[key]
			const capMethod = (capability.operator === 'or') ? 'some' : 'every'

			return capability.references[capMethod](criterionKey =>
				_evaluateCriterion(request, rules.criteria[criterionKey]))
		})
	}
}


function _evaluateCriterion(request: BasePermissionRequest, criterion: Criterion) {
	const attr = _getValueByPath(request, criterion.path)
	const value = ('valuePath' in criterion) ? _getValueByPath(request, criterion.valuePath) : criterion.value

	return _performCheck(attr, criterion.operator, value)
}

function _getValueByPath(request: BasePermissionRequest, path: string) {
	return path.split('.').reduce<any>((acc, segment) => acc[segment], request)
}

function _performCheck(attr: unknown, operator: CriterionOperator, value: unknown) {
	const attrIsNumber = (typeof attr === 'number')
	const valueIsArray = Array.isArray(value)

	if (['gt', 'gte', 'lt', 'lte'].includes(operator) && !attrIsNumber ||
		['between', 'notBetween'].includes(operator) && (!attrIsNumber || !valueIsArray) ||
		['in', 'nin'].includes(operator) && !valueIsArray) {

			throw new Error('attribute and/or value incompatible with operator')
		}

	switch (operator) {
		case 'eq': return attr === value
		case 'neq': return attr !== value

		case 'gt': return (attr as number) > (value as number)
		case 'gte': return (attr as number) >= (value as number)
		case 'lt': return (attr as number) < (value as number)
		case 'lte': return (attr as number) <= (value as number)

		case 'in': 
			if (!Array.isArray(value))  throw new Error('value incompatible with operator')
			return value.includes(attr) 

		case 'nin': 
			if (!Array.isArray(value))  throw new Error('value incompatible with operator')
			return !value.includes(attr) 

		case 'between': return attrIsNumber && valueIsArray && (attr >= value[0] && attr <= value[1])
		case 'notBetween': return attrIsNumber && valueIsArray && (attr < value[0] || attr > value[1])

		default: throw new Error('Operator not found')
	}
}