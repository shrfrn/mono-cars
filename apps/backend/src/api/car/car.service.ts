import fs from 'node:fs'

import { CarSchema } from '@cars/shared'
import type { Car, CarBase, CarPatch, CarQueryOptions } from '@cars/shared'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'


const PAGE_SIZE = 3
const DATA_FILE = './data/car.json'

import rawData from '#data/car.json' with { type: 'json' }
import { getAsyncStore } from '#middleware/async-store.js'
import { ForbidenError, EntityNotFoundError, UnauthorizedError, AppError } from '../../errors/app-errors.js'
import { HttpCodes } from '@cars/shared/src/http.js'

const cars: Car[] = CarSchema.array().parse(rawData)

export const carService = {
	remove,
	query,
	getById,
	post,
	patch,
}

async function query(options: CarQueryOptions): Promise<Car[]> {
    const { filterBy, sortBy } = options
    let res = [...cars]

    if (filterBy?.txt) {
        console.log(filterBy)
        const regex = new RegExp(filterBy.txt, 'i')
        res = res.filter(car => regex.test(car.make))
    }

    if (filterBy?.minSpeed) {
        res = res.filter(car => car.maxSpeed >= filterBy.minSpeed!)
    }
    
    if (filterBy?.type) {
        res = res.filter(car => car.type === filterBy.type!)
    }

    if (sortBy?.sortField === 'make') {
        res.sort((car1, car2) => car1.make.localeCompare(car2.make) * sortBy.sortDir)
    } else if (sortBy?.sortField === 'maxSpeed') {
        res.sort((car1, car2) => (car1.maxSpeed - car2.maxSpeed) * sortBy.sortDir)
    }

    return res
}

async function getById(carId: string): Promise<Car> {
    const car = cars.find(car => car._id === carId)
    if (!car) throw new EntityNotFoundError(`Car with _id ${carId}`)
        
    return car
}

async function remove(carId: string): Promise<void> {
    const idx = cars.findIndex(car => car._id === carId)
    _checkOwner(cars[idx])

    cars.splice(idx, 1)
    _save()
}

async function post(carBase: CarBase): Promise<Car> {
    const { authUser: owner } = getAsyncStore()!

    if (!owner) throw new UnauthorizedError()
        
    const car: Car = {
        ...carBase,
        _id: makeId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        owner,
    }

    cars.push(car)
    await _save()
    return car
}

async function patch(carPatch: CarPatch): Promise<Car> {
    const idx = cars.findIndex(car => car._id === carPatch._id)
    if (idx === -1) throw new EntityNotFoundError(`Car with _id ${carPatch._id}`)
    _checkOwner(cars[idx])
    
    const car = {
        ...cars[idx],
        ...carPatch,
        updatedAt: Date.now()
    }

    cars.splice(idx, 1, car)
    await _save()
    return car
}

function _checkOwner(car: Car) {
    const { authUser: owner } = getAsyncStore()!

    if (!owner) throw new UnauthorizedError()
    if (owner._id !== car.owner._id) throw new ForbidenError()
}

function _save(): Promise<void> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(cars, null, 2)

        fs.writeFile(DATA_FILE, data, err => {
            if (err) {
                logger.error('Cannot write to cars file', err)
                throw new AppError('Cannot write to cars file', HttpCodes.InternalServerError)
            }
            resolve()
        })
    })
}
