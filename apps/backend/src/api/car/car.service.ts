import fs from 'node:fs'

import { CarSchema } from '@cars/shared'
import type { Car, CarBase, CarPatch, CarQueryOptions } from '@cars/shared'

import logger from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'


const PAGE_SIZE = 3
const DATA_FILE = './data/car.json'

import rawData from '#data/car.json' with { type: 'json' }
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

	try {
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
	} catch (err) {
		logger.error('cannot find cars', err)
		throw err
	}
}

async function getById(carId: string): Promise<Car> {
	try {
        const car = cars.find(car => car._id === carId)
        if (!car) throw new Error(`Car with _id ${carId} not found`)
        return car
	} catch (err) {
		logger.error(`while finding car ${carId}`, err)
		throw err
	}
}

async function remove(carId: string): Promise<void> {
	try {
        const idx = cars.findIndex(car => car._id === carId)
        cars.splice(idx, 1)
        _save()
	} catch (err) {
		logger.error(`cannot remove car ${carId}`, err)
		throw err
	}
}

async function post(carBase: CarBase): Promise<Car> {
	try {
        const car: Car = {
            ...carBase,
            _id: makeId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        cars.push(car)
        await _save()
        return car
	} catch (err) {
		logger.error('cannot insert car', err)
		throw err
	}
}

async function patch(carPatch: CarPatch): Promise<Car> {
	try {
        const idx = cars.findIndex(car => car._id === carPatch._id)
        if (!idx) throw new Error(`Car with _id ${carPatch._id} not found`)

        const car = {
            ...cars[idx],
            ...carPatch,
            updatedAt: Date.now()
        }

        cars.splice(idx, 1, car)
        await _save()
        return car
	} catch (err) {
		logger.error(`cannot update car ${carPatch._id}`, err)
		throw err
	}
}

function _save(): Promise<void> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(cars, null, 2)

        fs.writeFile(DATA_FILE, data, err => {
            if (err) {
                logger.error('Cannot write to cars file', err)
                return reject(err)
            }
            resolve()
        })
    })
}
