import z from 'zod'

import type { Car, CarBaseInput, CarPatchInput, CarQueryOptions, Comment, Like } from '@cars/shared'
import { CarSchema, CarPatchSchema, CarQueryOptionsSchema, CarBaseInputSchema, CommentSchema } from '@cars/shared'

import { httpService } from '../http.service'

const BASE_URL = 'car/'

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

async function query(options: CarQueryOptions = {}): Promise<Car[]>{
    const queryOptions = CarQueryOptionsSchema.parse(options)

    const data = await httpService.get(BASE_URL, queryOptions)
    const cars = z.array(CarSchema).parse(data)

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
		data = await httpService.patch(BASE_URL + car._id!, validated)
	} else {
		validated = CarBaseInputSchema.parse(car)
		data = await httpService.post(BASE_URL, validated)
	}
    return CarSchema.parse(data)
}

async function addComment(carId: string, txt: string): Promise<Comment> {
    const data = await httpService.post(BASE_URL + carId + '/comment', { txt })
    return CommentSchema.parse(data)
}

async function removeComment(carId: string, commentId: string): Promise<void> {
    await httpService.delete(BASE_URL + carId + '/comment/' + commentId)
}

async function like(carId: string): Promise<Like> {
	return httpService.post(BASE_URL + carId + '/like')
}

async function unlike(carId: string): Promise<void> {
	return httpService.delete(BASE_URL + carId + '/unlike')
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