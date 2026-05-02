import type { SignupCredentials, User, UserBase, UserBaseInput, UserFilter, UserPatch, UserPatchInput, UserPublic, UserRoles } from '@cars/shared'
import { UserBaseSchema, UserFilterSchema, UserPatchSchema, UserPublicSchema, UserSchema } from '@cars/shared'

import { storageService } from '../storage.service'
import { makeid, loadFromStorage, saveToStorage } from '../util.service'

const STORAGE_KEY = 'user'

_createUsers()

export const userService = {
    query,
    getById,
	getByUsername,
    remove,
	save,
    addUser,
    updateUser,
}

async function query(userFilter: UserFilter = {}): Promise<UserPublic[]> {
	const filterBy = UserFilterSchema.parse(userFilter)

    const data = await storageService.query(STORAGE_KEY)
    let users = UserSchema.array().parse(data)

    if (filterBy.txt) {
        const regex = new RegExp(filterBy.txt)
        users = users.filter(user => 
			regex.test(user.fullname) || regex.test(user.username))
    }

    if (filterBy.role) {
        users = users.filter(user => user.role === filterBy.role!)
    }
    return UserPublicSchema.array().parse(users)
}

async function getById(userId: string): Promise<UserPublic | undefined> {
    const user = await storageService.get(STORAGE_KEY, userId)
    return user ? UserPublicSchema.parse(user) : undefined
}

// Returns the full user object including password, not just the public one
async function getByUsername(username: string): Promise<User | undefined> {
    const user = await storageService.get(STORAGE_KEY, username)
    return user ? UserSchema.parse(user) : undefined
}

async function remove(userId: string): Promise<undefined> {
    await storageService.remove(STORAGE_KEY, userId)
}

async function save(user: UserPatchInput | UserBaseInput): Promise<UserPublic> {
    let validated: UserPatch | UserBase, data: UserPublic

    if ('_id' in user) {
        validated = UserPatchSchema.parse(user)
        data = await storageService.patch(STORAGE_KEY, validated)
    } else {
        validated = UserBaseSchema.parse(user)
        data = await storageService.post(STORAGE_KEY, validated)
    }
    return UserPublicSchema.parse(data)
}

async function addUser(user: SignupCredentials): Promise<UserPublic> {
    const newUser = await storageService.post(STORAGE_KEY, user)
	return UserPublicSchema.parse(newUser)
}

async function updateUser(user: UserPatch): Promise<UserPublic> {
    const updatedUser = await storageService.patch(STORAGE_KEY, user)
	return UserPublicSchema.parse(updatedUser)
}

// Private functions

function _createUsers() {
    let users = loadFromStorage<User[]>(STORAGE_KEY) ?? []
    if (users.length > 0) return

    users = [
        _createUser('Bob', 'Bob', 'Bob', 'Admin'),
        _createUser('Joe', 'Joe', 'Joe'),
        _createUser('Ron', 'Ron', 'Ron'),
        _createUser('Ann', 'Ann', 'Ann'),
    ]
    _saveUsers(users)
}

function _createUser(username: string, fullname: string, password: string, role: UserRoles = 'Guest'): User {
    return {
        username,
        fullname,
        password,
        role,
        imgUrl: undefined,
        _id: makeid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

function _saveUsers(users: User[]) {
    saveToStorage(STORAGE_KEY, users)
}