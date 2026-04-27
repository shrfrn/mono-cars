import type { Entity } from './async-storage-service'

import { storageService } from './async-storage-service'
import { makeid, loadFromStorage, saveToStorage } from './util.service'

const STORAGE_KEY = 'user'

export type UserRole = 'user' | 'admin' | 'moderator' | 'guest'
export type User = Entity & {
    name: string,
    age: number,
    role: UserRole,
}

export type UserCreate = Omit<User, 'id'>
export type UserPatch = Required<Pick<User, 'id'>> & Partial<User>

export type UserFilter = {
    txt?: string,
    minAge?: number,
    maxAge?: number,
}

_createUsers()

export const userService = {
    getUsers,
    getUser,
    removeUser,
    addUser,
    updateUser,
}

async function getUsers(filterBy: UserFilter = {}): Promise<User[]> {
    let users = await storageService.query(STORAGE_KEY) as User[]

    if (filterBy.txt) {
        const regex = new RegExp(filterBy.txt)
        users = users.filter(user => regex.test(user.name))
    }

    if (filterBy.minAge) {
        users = users.filter(user => user.age >= filterBy.minAge!)
    }

    if (filterBy.maxAge) {
        users = users.filter(user => user.age <= filterBy.maxAge!)
    }
    return users
}

async function getUser(userId: string): Promise<User | undefined> {
    return storageService.get(STORAGE_KEY, userId)
}

async function removeUser(userId: string): Promise<undefined> {
    await storageService.remove(STORAGE_KEY, userId)
}

async function addUser(user: UserCreate): Promise<User> {
    return storageService.post(STORAGE_KEY, user)
}

async function updateUser(user: UserPatch): Promise<User> {
    return storageService.patch(STORAGE_KEY, user)
}

function _createUsers() {
    let users = loadFromStorage<User[]>(STORAGE_KEY) ?? []
    if (users.length > 0) return

    users = [
        _createUser('Bob', 20, 'admin'),
        _createUser('Joe', 30),
        _createUser('Ron', 32),
        _createUser('Ann', 27),
    ]
    _saveUsers(users)
}

function _createUser(name: string, age: number, role: UserRole = 'user') {
    return {
        name,
        age,
        role,
        id: makeid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

function _saveUsers(users: User[]) {
    saveToStorage(STORAGE_KEY, users)
}