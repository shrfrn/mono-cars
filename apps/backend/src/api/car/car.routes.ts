import express from 'express'
import { CarQueryOptionsSchema, CarParamsSchema, CarPatchSchema, CarBaseInputSchema } from '@car/shared'

import { validateRequest } from '#middleware/validate-request.js'
import { requireAuth, requireRole } from '#middleware/require-auth.js'
import { validateParamsMatch } from '#middleware/validate-match.js'

import { getCars, getCarById, postCar, patchCar, removeCar } from './car.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', 
    validateRequest(CarQueryOptionsSchema, 'query'), getCars)

router.get('/:id', 
    validateRequest(CarParamsSchema, 'params'), getCarById)

router.post('/', requireAuth, 
    validateRequest(CarBaseInputSchema, 'body'), postCar)
    
router.patch('/:id', requireAuth, 
    validateRequest(CarParamsSchema, 'params'), 
    validateRequest(CarPatchSchema, 'body'),
    validateParamsMatch('id', '_id'), patchCar)

router.delete('/:id', requireAuth, 
    validateRequest(CarParamsSchema, 'params'), removeCar)
    
// router.delete('/:id', requireAuth, requireRole('Admin'), removeCar)

// router.post('/:id/msg', addCarMsg)
// router.delete('/:id/msg/:msgId', removeCarMsg)

export const carRoutes = router