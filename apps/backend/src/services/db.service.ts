import z from 'zod'
import { Db, MongoClient, Document, ObjectId, WithId } from 'mongodb'

// import { config } from '../config/index.js'
import type { Entity } from '@cars/shared'
import { logger } from './logger.service.js'

const config = {
	dbURL: 'mongodb://localhost:27017/car',
	dbName: 'car',
}

var db: Db | null = null

export async function getCollection<T extends Document>(collectionName: string) {
	try {
		const db = await _connect()
		return db.collection<T>(collectionName)
	} catch (err) {
		logger.error('Failed to get Mongo collection', err)
		throw err
	}
}

export function byObjectId<T extends Entity>(docOrId: T | string) {
	return typeof docOrId === 'string' ? 
		{ _id: new ObjectId(docOrId) } : 
		{ _id: new ObjectId(docOrId._id) }
}

export function prepareInsert<T>(doc: T) {
	return { ...doc, createdAt: Date.now(), updatedAt: Date.now() }
}

export function prepareUpdate<T>(doc: T) {
	return { ...doc, updatedAt: Date.now() } 
}

export const MongoWriteSchema = z.preprocess((val: any) => {
    if (val === null || typeof val !== 'object') return val;
	
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

async function _connect() {
	if (db) return db
    
	try {
		const client = await MongoClient.connect(config.dbURL)
		return db = client.db(config.dbName)
	} catch (err) {
		logger.error('Cannot Connect to DB', err)
		throw err
	}
}