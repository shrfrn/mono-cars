import z from 'zod'

export const EntitySchema = z.object({
	_id: z.string().min(5),
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
