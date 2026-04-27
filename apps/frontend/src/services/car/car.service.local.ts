import z from 'zod'

import type { Car, CarBaseInput, CarType, CarPatchInput, CarQueryOptions } from '@cars/shared'
import { CarSchema, CarBaseSchema, CarPatchSchema, CarQueryOptionsSchema } from '@cars/shared'

import { storageService } from '../storage.service'
import { makeid, loadFromStorage, saveToStorage, getRandomElement } from '../util.service'

const STORAGE_KEY = 'car'

export const carService = {
    query,
    getById,
    remove,
    save,

    getEmptyCar,
    getEmptyCarOptions,
}

_createCars()

async function query(options: CarQueryOptions = {}): Promise<Car[]>{
    const queryOptions = CarQueryOptionsSchema.parse(options)
    const { filterBy, sortBy } = queryOptions

    const data = await storageService.query(STORAGE_KEY)
    let cars = z.array(CarSchema).parse(data)

    if (filterBy?.txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        cars = cars.filter(car => regex.test(car.make))
    }

    if (filterBy?.minSpeed) {
        cars = cars.filter(car => car.maxSpeed >= filterBy.minSpeed!)
    }

    if (filterBy?.type) {
        cars = cars.filter(car => car.type >= filterBy.type!)
    }

    if (sortBy?.sortField === 'make') {
        cars.sort((car1, car2) => car1.make.localeCompare(car2.make) * sortBy.sortDir)
    } else if (sortBy?.sortField === 'maxSpeed') {
        cars.sort((car1, car2) => (car1.maxSpeed - car2.maxSpeed) * sortBy.sortDir)
    }

    return cars
}

async function getById(carId: string): Promise<Car | undefined> {
    const data = await storageService.get(STORAGE_KEY, carId)
    return CarSchema.parse(data)
}

async function remove(carId: string): Promise<void> {
    return storageService.remove(STORAGE_KEY, carId)
}

async function save(car: CarPatchInput | CarBaseInput): Promise<Car> {
    let validated, data

    if ('_id' in car) {
        validated = CarPatchSchema.parse(car)
        data = await storageService.patch(STORAGE_KEY, validated)
    } else {
        validated = CarBaseSchema.parse(car)
        data = await storageService.post(STORAGE_KEY, validated)
    }
    return CarSchema.parse(data)
}

function getEmptyCar(): CarBaseInput {
    return {
        make: '',
        maxSpeed: 0,
        type: 'Electric'
    }
}

function getEmptyCarOptions(): CarQueryOptions {
    return {
        filterBy: {
            txt: '',
            minSpeed: 0,
            type: undefined,
        },
        sortBy: {
            sortField: undefined,
            sortDir: 1,
        }
    }
}

// Private Functions 

function _createCars() {
    let cars = loadFromStorage(STORAGE_KEY) as Car[]
    if (cars && cars.length > 0) return

    cars = [
        _createCar('Toyoyo', 140),
        _createCar('Simba', 100),
        _createCar('Volgo', 200),
        _createCar('VolksBaben', 130),
    ]
    saveToStorage(STORAGE_KEY, cars)
}

function _createCar(make: string, maxSpeed: number): Car {
    const carTypes = ['Gasoline', 'Diesel', 'Gas', 'Hybrid', 'Electric']
    const type = getRandomElement(carTypes) as CarType

    return {
        _id: makeid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        make,
        maxSpeed,
        type,
    }
}