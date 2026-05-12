import express from 'express'
import { ReviewQueryOptionsSchema, ReviewParamsSchema, ReviewPatchSchema, ReviewBaseInputSchema } from '@car/shared'

import { validateRequest } from '#middleware/validate-request.js'
import { requireAuth } from '#middleware/require-auth.js'
import { validateParamsMatch } from '#middleware/validate-match.js'

import { getReviews, getReviewById, postReview, patchReview, removeReview } from './review.controller.js'

const router = express.Router()

router.get('/', 
    validateRequest(ReviewQueryOptionsSchema, 'query'), getReviews)

router.get('/:id', 
    validateRequest(ReviewParamsSchema, 'params'), getReviewById)

router.post('/', requireAuth, 
    validateRequest(ReviewBaseInputSchema, 'body'), postReview)
    
router.patch('/:id', requireAuth, 
    validateRequest(ReviewParamsSchema, 'params'),  
    validateRequest(ReviewPatchSchema, 'body'),
    validateParamsMatch('id', '_id'), patchReview)

router.delete('/:id', requireAuth, 
    validateRequest(ReviewParamsSchema, 'params'), removeReview)
    
export const reviewRoutes = router