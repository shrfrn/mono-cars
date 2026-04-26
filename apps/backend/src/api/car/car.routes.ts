import express from 'express'
import { CarQueryOptionsSchema, CarParamsSchema, CarBaseSchema, CarPatchSchema } from '@car/shared';

// import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { validateRequest } from '#middleware/validate-request.js'
// import { log } from '../../middlewares/logger.middleware.js'

import { getCars, getCarById, postCar, patchCar, removeCar } from './car.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', validateRequest(CarQueryOptionsSchema, 'query'), getCars)
router.get('/:id', validateRequest(CarParamsSchema, 'params'), getCarById)
router.post('/', validateRequest(CarBaseSchema, 'body'), postCar)
router.patch('/:id', validateRequest(CarPatchSchema, 'body'), patchCar)
router.delete('/:id', validateRequest(CarParamsSchema, 'params'), removeCar)
// router.delete('/:id', requireAuth, requireAdmin, removeCar)

// router.post('/:id/msg', addCarMsg)
// router.delete('/:id/msg/:msgId', removeCarMsg)

export const carRoutes = router