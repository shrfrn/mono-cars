import express from 'express'
import { UserQueryOptionsSchema, UserParamsSchema, UserBaseSchema } from '@car/shared'

// import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { validateRequest } from '#middleware/validate-request.js'
// import { log } from '../../middlewares/logger.middleware.js'

import { getUsers, getUserById, postUser } from './user.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', validateRequest(UserQueryOptionsSchema, 'query'), getUsers)
router.get('/:id', validateRequest(UserParamsSchema, 'params'), getUserById)
router.post('/', validateRequest(UserBaseSchema, 'body'), postUser)

export const userRoutes = router