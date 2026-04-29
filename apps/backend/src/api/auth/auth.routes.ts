import express from 'express'

import { LoginCredentialsSchema, SignupCredentialsSchema } from '@car/shared'
import { validateRequest } from '#middleware/validate-request.js'

import { signup, login, logout } from './auth.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.post('/login', validateRequest(LoginCredentialsSchema, 'body'), login)
router.post('/signup', validateRequest(SignupCredentialsSchema, 'body'), signup)
router.post('/logout', logout)

export const authRoutes = router