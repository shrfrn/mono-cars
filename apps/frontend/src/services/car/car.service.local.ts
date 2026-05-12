import type { Car, CarBaseInput, CarType, CarPatchInput, CarQueryOptions, CarPublic, CarPatch, CarBase, Comment } from '@cars/shared'
import { CarSchema, CarBaseSchema, CarPatchSchema, CarQueryOptionsSchema, CarPublicSchema } from '@cars/shared'

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
	addComment,
	removeComment,
	like,
	unlike,
}

_createCars()

async function query(options: CarQueryOptions = {}): Promise<CarPublic[]>{
    const queryOptions = CarQueryOptionsSchema.parse(options)
    const { filterBy, sortBy } = queryOptions

    const data = await storageService.query(STORAGE_KEY)
    let cars = CarSchema.array().parse(data)

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

    return CarPublicSchema.array().parse(cars)
}

async function getById(carId: string): Promise<CarPublic | undefined> {
    const data = await storageService.get(STORAGE_KEY, carId)
    return CarPublicSchema.parse(data)
}

async function remove(carId: string): Promise<void> {
    return storageService.remove(STORAGE_KEY, carId)
}

async function save(car: CarPatchInput | CarBaseInput): Promise<CarPublic> {
    let validated: CarPatch | CarBase, data: CarPublic

    if ('_id' in car) {
        validated = CarPatchSchema.parse(car)
        data = await storageService.patch(STORAGE_KEY, validated)
    } else {
        validated = CarBaseSchema.parse(car)
        data = await storageService.post(STORAGE_KEY, validated)
    }
    return CarPublicSchema.parse(data)
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

async function addComment(carId: string, txt: string): Promise<Comment> {
	console.log('addComment', carId, txt)
	return { txt } as Comment
}

async function removeComment(carId: string, commentId: string): Promise<void> {
	console.log('removeComment', carId, commentId)
}

async function like(carId: string): Promise<void> {
	console.log('addComment', carId)
}

async function unlike(carId: string): Promise<void> {
	console.log('removeComment', carId)
}

// Private Functions 

function _createCars() {
    let cars = loadFromStorage<Car[]>(STORAGE_KEY) ?? []
    if (cars.length > 0) return

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
        owner: {
            role: 'Member',
            _id: makeid(),
            fullname: 'Member',
            imgUrl: undefined,
        },
        _id: makeid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        make,
        maxSpeed,
        type,
    }
}