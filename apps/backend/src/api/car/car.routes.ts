import express from 'express'
import { CarQueryOptionsSchema, CarParamsSchema, CarPatchSchema, CarBaseInputSchema, CommentSchema, CommentInputSchema, CommentParamsSchema } from '@car/shared'

import { validateRequest } from '#middleware/validate-request.js'
import { requireAuth, requireRole } from '#middleware/require-auth.js'
import { validateParamsMatch } from '#middleware/validate-match.js'

import { getCars, getCarById, postCar, patchCar, removeCar, addComment, removeComment, like, unlike } from './car.controller.js'
import { requirePermission } from '#middleware/require-permission.js'

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
    validateRequest(CarParamsSchema, 'params'), 
	requirePermission('car:delete'), removeCar)
    
// router.delete('/:id', requireAuth, requireRole('Admin'), removeCar)

router.post('/:id/comment', requireAuth, 
	validateRequest(CarParamsSchema, 'params'), 
	validateRequest(CommentInputSchema, 'body'), addComment)
	
router.delete('/:id/comment/:commentId', requireAuth, 
	validateRequest(CommentParamsSchema, 'params'), removeComment)

router.post('/:id/like', requireAuth, 
	validateRequest(CarParamsSchema, 'params'), like)
	
router.delete('/:id/unlike', requireAuth, 
	validateRequest(CarParamsSchema, 'params'), unlike)

export const carRoutes = router