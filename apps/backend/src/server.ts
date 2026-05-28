import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

import { logger } from '#services/logger.service.js'
import { closeDb } from '#services/db.service.js'

import { setupAsyncStore } from '#middleware/async-store.js'

import { authRoutes } from './api/auth/auth.routes.js'
import { carRoutes } from './api/car/car.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'

import { errorHandler } from '#middleware/error-handler.js'

import { jobManager, outbox, redisConnection, startQueues } from '#events/queues.config.js'

const app = express()
const server = http.createServer(app)

app.set('query parser', 'extended')
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.resolve('public')))
} else {
	const corsOptions = {
		origin: [
			'http://127.0.0.1:3000',
			'http://localhost:3000',
			'http://127.0.0.1:5173',
			'http://localhost:5173',
		],
		credentials: true,
	}
	app.use(cors(corsOptions))
}

app.use(setupAsyncStore)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/car', carRoutes)
app.use('/api/review', reviewRoutes)

app.get('{*splat}', (req, res) => {
	res.sendFile(path.resolve('public/index.html'))
})

app.use(errorHandler)

process.on('unhandledRejection', err => {
	logger.error('Unhandled promise rejection', err)
})

process.on('uncaughtException', err => {
	logger.error('Uncaught exception', err)
	process.exit(1)
})

const port = process.env.PORT || 3030
server.listen(port, () => {
	logger.info('Server is running on port: ' + port)
	startQueues()
})

async function shutdown(signal: string) {
	logger.info(`${signal} received — shutting down`)

	outbox.stop()

	try {
		await jobManager.stop()
		await closeDb()
		redisConnection.disconnect()
	} catch (err) {
		logger.error('Error during shutdown', err)
	}

	server.close(() => process.exit(0))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
