import z from 'zod'


// If the value is an ObjectId, convert it to a string
// We're using duck typing so there is no dependency on the ObjectId class

export const EntityIdSchema = z.preprocess(val => 
		(val && typeof (val as any).toHexString === 'function') ? (val as any).toHexString() : val, z.string())
		
export const EntitySchema = z.object({
	_id: EntityIdSchema,
	createdAt: z.number().positive(),
	updatedAt: z.number().positive(),
})
export type Entity = z.infer<typeof EntitySchema>

export function createEntitySchemas<T extends z.ZodRawShape>(dataShape: z.ZodObject<T>) {
	const fullSchema = EntitySchema.extend(dataShape.shape)
	const baseSchema = dataShape // Semantic
	const patchSchema = fullSchema.partial().extend({ _id: EntitySchema.shape._id })

	return { fullSchema, baseSchema, patchSchema }
}
