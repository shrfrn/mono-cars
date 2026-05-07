import z from 'zod'

import type { Car, CarBaseInput, CarPatchInput, CarQueryOptions } from '@cars/shared'
import { CarSchema, CarPatchSchema, CarQueryOptionsSchema, CarBaseInputSchema } from '@cars/shared'

import { httpService } from '../http.service'

const BASE_URL = 'car/'

export const carService = {
    query,
    getById,
    remove,
    save,

    getEmptyCar,
    getEmptyCarOptions,
}

async function query(options: CarQueryOptions = {}): Promise<Car[]>{
    const queryOptions = CarQueryOptionsSchema.parse(options)
    // const { filterBy, sortBy } = queryOptions

    const data = await httpService.get(BASE_URL, queryOptions)
    const cars = z.array(CarSchema).parse(data)

    // if (filterBy?.txt) {
    //     const regex = new RegExp(filterBy.txt, 'i')
    //     cars = cars.filter(car => regex.test(car.make))
    // }

    // if (filterBy?.minSpeed) {
    //     cars = cars.filter(car => car.maxSpeed >= filterBy.minSpeed!)
    // }

    // if (filterBy?.type) {
    //     cars = cars.filter(car => car.type >= filterBy.type!)
    // }

    // if (sortBy?.sortField === 'make') {
    //     cars.sort((car1, car2) => car1.make.localeCompare(car2.make) * sortBy.sortDir)
    // } else if (sortBy?.sortField === 'maxSpeed') {
    //     cars.sort((car1, car2) => (car1.maxSpeed - car2.maxSpeed) * sortBy.sortDir)
    // }

    return cars
}

async function getById(carId: string): Promise<Car | undefined> {
    const data = await httpService.get(BASE_URL + carId)
    return CarSchema.parse(data)
}

async function remove(carId: string): Promise<void> {
    return httpService.delete(BASE_URL + carId)
}

async function save(car: CarPatchInput | CarBaseInput): Promise<Car> {
    let validated, data
	
	if ('_id' in car) {
		validated = CarPatchSchema.parse(car)
		data = await httpService.patch(BASE_URL, validated)
	} else {
		validated = CarBaseInputSchema.parse(car)
		data = await httpService.post(BASE_URL, validated)
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