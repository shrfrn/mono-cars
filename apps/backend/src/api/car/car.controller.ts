import { Request, Response } from 'express'

import { CarPublicSchema, CommentPublicSchema } from '@car/shared'
import type { CarQueryOptions, CarParams, CarBase, CarPatch, CarPublic, Comment, CommentParams, CommentInput } from '@car/shared'

import { carService } from './car.service.js'
import { EntityNotFoundError } from '../../errors/app-errors.js'

export async function getCars(req: Request<{}, {}, {}, CarQueryOptions>, res: Response) {
	const cars = await carService.query(res.locals.query)
	const validated = CarPublicSchema.array().parse(cars)
	
	res.json(validated)
}

export async function getCarById(req: Request<CarParams, CarPublic>, res: Response) {
	const carId = res.locals.params.id

	const car = await carService.getById(carId)
	if (!car) throw new EntityNotFoundError()
		
	const validated = CarPublicSchema.parse(car)
	res.json(validated)
}

export async function postCar(req: Request<{}, CarPublic, CarBase, {}>, res: Response) {
    const car = res.locals.body
	const addedCar = await carService.post(car)
	const validated = CarPublicSchema.parse(addedCar)

	res.status(201).json(validated)
}

export async function patchCar(req: Request<CarParams, CarPublic, CarPatch>, res: Response) {
    const car = res.locals.body
	const updatedCar = await carService.patch(car)
	const validated = CarPublicSchema.parse(updatedCar)

	res.json(validated)
}

export async function removeCar(req: Request<CarParams>, res: Response) {
	const carId = res.locals.params.id
	await carService.remove(carId)

	res.status(204).send()
}

export async function addComment(req: Request<CarParams, Comment, CommentInput>, res: Response) {
	const { id: carId } = req.params
	const { txt } = req.body
	
	const comment = await carService.addComment(carId, txt)
	const validated = CommentPublicSchema.parse(comment)

	res.status(201).json(validated)
}

export async function removeComment(req: Request<CommentParams>, res: Response) {
	const { id: carId, commentId } = req.params
	
	await carService.removeComment(carId, commentId)
	res.status(204).send()
}

export async function like(req: Request<CarParams>, res: Response): Promise<void> {
	const { id: carId } = req.params
	
	const like = await carService.like(carId)
	res.status(201).json(like)
}

export async function unlike(req: Request<CarParams>, res: Response) {
	const { id: carId } = req.params
	
	await carService.unlike(carId)
	res.status(204).send()
}