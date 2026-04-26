import { Request, Response } from 'express'

import logger from '#services/logger.service.js'

import { type Car, type CarQueryOptions, type CarParams, type CarBase, type CarPatch, CarPublicSchema } from '@car/shared'
import { carService } from './car.service.js'

export async function getCars(req: Request<{}, {}, {}, CarQueryOptions>, res: Response) {
	try {
		const cars = await carService.query(req.query)
        const valdated = CarPublicSchema.array().parse(cars)
		res.json(valdated)
	} catch (err) {
		logger.error('Failed to get cars', err)
		res.status(400).send({ err: 'Failed to get cars' })
	}
}

export async function getCarById(req: Request<CarParams, Car>, res: Response) {
	try {
		const carId = req.params.id
		const car = await carService.getById(carId)
        const valdated = CarPublicSchema.parse(car)
        
		res.json(valdated)
	} catch (err) {
		logger.error('Failed to get car', err)
		res.status(400).send({ err: 'Failed to get car' })
	}
}

export async function postCar(req: Request<{}, Car, CarBase, {}>, res: Response) {
    const car = req.body
	try {
		const addedCar = await carService.post(car)
        const valdated = CarPublicSchema.parse(addedCar)
		res.json(valdated)
	} catch (err) {
		logger.error('Failed to add car', err)
		res.status(400).send({ err: 'Failed to add car' })
	}
}

export async function patchCar(req: Request<CarParams, Car, CarPatch>, res: Response) {
    const car = req.body

	try {
		const updatedCar = await carService.patch(car)
        const valdated = CarPublicSchema.parse(updatedCar)
		res.json(valdated)
	} catch (err) {
		logger.error('Failed to update car', err)
		res.status(400).send({ err: 'Failed to update car' })
	}
}

export async function removeCar(req: Request<CarParams>, res: Response) {
	try {
		const carId = req.params.id
		await carService.remove(carId)

		res.status(204).send()
	} catch (err) {
		logger.error('Failed to remove car', err)
		res.status(400).send({ err: 'Failed to remove car' })
	}
}

// export async function addCarMsg(req, res) {
// 	const { loggedinUser } = req

// 	try {
// 		const carId = req.params.id
// 		const msg = {
// 			txt: req.body.txt,
// 			by: loggedinUser,
// 		}
// 		const savedMsg = await carService.addCarMsg(carId, msg)
// 		res.json(savedMsg)
// 	} catch (err) {
// 		logger.error('Failed to add car msg', err)
// 		res.status(400).send({ err: 'Failed to add car msg' })
// 	}
// }

// export async function removeCarMsg(req, res) {
// 	try {
// 		const { id: carId, msgId } = req.params

// 		const removedId = await carService.removeCarMsg(carId, msgId)
// 		res.send(removedId)
// 	} catch (err) {
// 		logger.error('Failed to remove car msg', err)
// 		res.status(400).send({ err: 'Failed to remove car msg' })
// 	}
// }
