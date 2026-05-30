import express from 'express'
import { UserQueryOptionsSchema, UserParamsSchema, UserBaseSchema } from '@car/shared'

// import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { validateRequest } from '#middleware/validate-request.js'
// import { log } from '../../middlewares/logger.middleware.js'

import { getUsers, getUserById, postUser, getUserProfile } from './user.controller.js'
import { requireAuth } from '#middleware/require-auth.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', validateRequest(UserQueryOptionsSchema, 'query'), getUsers)
router.get('/:id', validateRequest(UserParamsSchema, 'params'), getUserById)
router.get('/:id/profile', validateRequest(UserParamsSchema, 'params'), getUserProfile)
router.post('/', requireAuth, validateRequest(UserBaseSchema, 'body'), postUser)

export const userRoutes = router