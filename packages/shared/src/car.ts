import z from 'zod'
import { createEntitySchemas } from './entity.js'

// Car Schemas

export const CarTypeSchema = z.enum(['Gasoline', 'Diesel', 'Gas', 'Hybrid', 'Electric'])
export const CarFieldsSchema = z.object({
    make: z.string().min(1),
    maxSpeed: z.coerce.number().positive(),
    type: z.preprocess(val => val, CarTypeSchema),
})

export const { 
    fullSchema: CarSchema, 
    baseSchema: CarBaseSchema, 
    patchSchema: CarPatchSchema } = createEntitySchemas(CarFieldsSchema)

export const CarPublicSchema = CarSchema    // Nothing to hide in CarSchema

export const CarFilterSchema = z.object({
    txt: z.string().optional(),
    minSpeed: z.coerce.number().nonnegative().optional(),
    type: CarTypeSchema.optional(),
}) 

export const CarSortFieldSchema = z.enum(['make', 'maxSpeed']).optional()
export const CarSortSchema = z.object({
    sortField: CarSortFieldSchema,
    sortDir: z.preprocess(val => Number(val) || 1, z.union([z.literal(1), z.literal(-1)])),
})

export const CarQueryOptionsSchema = z.object({
    filterBy: CarFilterSchema.optional(),
    sortBy: CarSortSchema.optional(),
})

export const CarParamsSchema = z.object({
    id: z.string(),
})

// Car Types

export type Car = z.infer<typeof CarSchema>
export type CarType = z.infer<typeof CarTypeSchema>
export type CarPublic = z.infer<typeof CarPublicSchema>

export type CarBase = z.infer<typeof CarBaseSchema>
export type CarBaseInput = z.input<typeof CarBaseSchema>

export type CarPatch = z.infer<typeof CarPatchSchema>
export type CarPatchInput = z.input<typeof CarPatchSchema>

export type CarFilter = z.infer<typeof CarFilterSchema>
export type CarSort = z.infer<typeof CarSortSchema>
export type CarSortField = z.infer<typeof CarSortFieldSchema>

export type CarQueryOptions = z.infer<typeof CarQueryOptionsSchema>
export type CarQueryOptionsInput = z.input<typeof CarQueryOptionsSchema>

export type CarParams = z.infer<typeof CarParamsSchema>