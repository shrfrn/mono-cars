import fs from 'node:fs'

import { UserSchema } from '@cars/shared'
import type { User, UserBase, UserQueryOptions } from '@cars/shared'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'


const PAGE_SIZE = 3
const DATA_FILE = './data/user.json'

import rawData from '#data/user.json' with { type: 'json' }
import { AppError, EntityNotFoundError } from '../../errors/app-errors.js'
import { HttpCodes } from '@cars/shared/src/http.js'

const users: User[] = UserSchema.array().parse(rawData)

export const userService = {
	query,
	getById,
    getByUsername,
	post,
}

async function query(options: UserQueryOptions): Promise<User[]> {
    const { filterBy, sortBy } = options
    let res = [...users]

    if (filterBy?.txt) {
        console.log(filterBy)
        const regex = new RegExp(filterBy.txt, 'i')
        res = res.filter(user => regex.test(user.username) || regex.test(user.fullname))
    }

    if (filterBy?.role) {
        res = res.filter(user => user.role === filterBy.role!)
    }

    if (sortBy?.sortField) {
        const { sortField } = sortBy 
        res.sort((user1, user2) => user1[sortField].localeCompare(user2[sortField]) * sortBy.sortDir)
    }

    return res
}

async function getById(userId: string): Promise<User> {
    const user = users.find(user => user._id === userId)
    if (!user) throw new EntityNotFoundError(`User with _id ${userId}`)
    return user
}

async function getByUsername(username: string): Promise<User | undefined> {
    const user = users.find(user => user.username === username)
    return user
}

async function post(userBase: UserBase): Promise<User> {
    const user: User = {
        ...userBase,
        _id: makeId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
    users.push(user)
    await _save()
    return user
}

function _save(): Promise<void> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(users, null, 2)

        fs.writeFile(DATA_FILE, data, err => {
            if (err) {
                logger.error('Cannot write to users file', err)
                throw new AppError('Cannot write to cars file', HttpCodes.InternalServerError)
            }
            resolve()
        })
    })
}
