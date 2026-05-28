import z from 'zod'
import { Db, MongoClient, Document, ObjectId, Filter, UpdateFilter, ClientSession } from 'mongodb'

import type { Entity } from '@cars/shared'
import { logger } from './logger.service.js'

const config = {
	dbURL: process.env.MONGO_URL || 'mongodb://localhost:27017/car',
	dbName: process.env.MONGO_DB_NAME || 'car',
}

const { db, client } = await _connect()

export async function startSession() {
	return client.startSession()
}

export async function endSession(session: ClientSession) {
	session?.endSession()
}

export async function withTransactionalSession<T>(
	fn: (session: ClientSession) => Promise<T>,
	options?: { timeoutMS?: number },
): Promise<T> {
	const session = await startSession()

	try {
		return await session.withTransaction(() => fn(session), options)
	} finally {
		await endSession(session)
	}
}

export async function pingDb(): Promise<boolean> {
	try {
		await db.command({ ping: 1 })
		return true
	} catch {
		return false
	}
}

export async function closeDb() {
	await client.close()
}

export async function getCollection<T extends Document>(collectionName: string) {
	return db.collection<T>(collectionName)
}

export function byObjectId<T extends Entity>(docOrId: T | string) {
	return typeof docOrId === 'string' ?
		{ _id: new ObjectId(docOrId) } :
		{ _id: new ObjectId(docOrId._id) }
}

export function prepareInsert<T>(doc: T) {
	return { ...doc, _createdAt: new Date(), _updatedAt: new Date(), _version: 1 }
}

export function prepareUpdate<T extends { _id: string, _version?: number }>(doc: T) {
	const { _id, _version, ...$set } = doc

	const criteria:Filter<Document> = { _id: new ObjectId(_id) }
	if (_version !== undefined) criteria._version = _version

	const update: UpdateFilter<Document> = {
		$set,
		$inc: { _version: 1 },
		$currentDate: { _updatedAt: true },
	}
	return { criteria, update }
}

export const MongoWriteSchema = z.preprocess((val: any) => {
	if (val === null || typeof val !== 'object') return val

	mutateIds(val)
	return val

	function mutateIds(obj: any) {
		if (!obj || typeof obj !== 'object') return

		if (typeof obj._id === 'string' && obj._id.length === 24) {
			obj._id = new ObjectId(obj._id)
		}

		Object.values(obj).forEach(mutateIds)
	}
}, z.any())

async function _connect(): Promise<{ db: Db, client: MongoClient }> {
	try {
		const client = new MongoClient(config.dbURL)

		await client.connect()
		const db = client.db(config.dbName)

		return { db, client }
	} catch (err) {
		logger.error('Cannot connect to DB', err)
		if (process.env.NODE_ENV === 'test') throw err
		process.exit(1)
	}
}
