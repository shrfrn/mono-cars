import z from 'zod'
import { createEntitySchemas } from './entity.js'

// User Schemas

export const UserRolesSchema = z.enum(['Guest', 'Member', 'Moderator', 'Admin'])
export const UserFieldsSchema = z.object({
    username: z.string().min(1),
    fullname: z.string().min(1),
    password: z.string().min(1),
    imgUrl: z.url().optional(),
    role: UserRolesSchema,
})

export const { 
    fullSchema: UserSchema, 
    baseSchema: UserBaseSchema, 
    patchSchema: UserPatchSchema } = createEntitySchemas(UserFieldsSchema)

export const UserPublicSchema = UserSchema.omit({
    password: true,
})

export const MiniUserSchema = UserSchema.pick({
    _id: true,
    fullname: true,
    imgUrl: true,
    role: true,
})

export const SignupCredentialsSchema = UserSchema.pick({
    username: true,
    fullname: true,
    password: true,
})

export const LoginCredentialsSchema = UserSchema.pick({
    username: true,
    password: true,
})

export const UserFilterSchema = z.object({
    txt: z.string().optional(),
    role: UserRolesSchema.optional(),
}) 

export const UserSortFieldSchema = z.enum(['username', 'fullname']).optional()
export const UserSortSchema = z.object({
    sortField: UserSortFieldSchema,
    sortDir: z.preprocess(val => Number(val) || 1, z.union([z.literal(1), z.literal(-1)])),
})

export const UserQueryOptionsSchema = z.object({
    filterBy: UserFilterSchema.optional(),
    sortBy: UserSortSchema.optional(),
})

export const UserParamsSchema = z.object({
    id: z.string(),
})

// User Types

export type UserRoles = z.infer<typeof UserRolesSchema>

export type User = z.infer<typeof UserSchema>
export type UserType = z.infer<typeof UserRolesSchema>
export type UserPublic = z.infer<typeof UserPublicSchema>
export type MiniUser = z.infer<typeof MiniUserSchema>

export type SignupCredentials = z.infer<typeof SignupCredentialsSchema>
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>

export type UserBase = z.infer<typeof UserBaseSchema>
export type UserBaseInput = z.input<typeof UserBaseSchema>

export type UserPatch = z.infer<typeof UserPatchSchema>
export type UserPatchInput = z.input<typeof UserPatchSchema>

export type UserFilter = z.infer<typeof UserFilterSchema>
export type UserSort = z.infer<typeof UserSortSchema>
export type UserSortField = z.infer<typeof UserSortFieldSchema>

export type UserQueryOptions = z.infer<typeof UserQueryOptionsSchema>
export type UserQueryOptionsInput = z.input<typeof UserQueryOptionsSchema>

export type UserParams = z.infer<typeof UserParamsSchema>