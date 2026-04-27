import type { Entity } from '@cars/shared'

export const storageService = {
    query,
    get,
    remove,
    post,
    patch,
}

async function query<T extends Entity>(entityType: string, delay: number = 300): Promise<T[]> {
	return new Promise(resolve => setTimeout(() => {

		const json = localStorage.getItem(entityType)
		const data = json ? JSON.parse(json) : []

		return resolve(data)
	}, delay))
}

async function get<T extends Entity>(entityType: string, entityId: string): Promise<T | undefined> {
    const entities = await query<T>(entityType)
    return entities.find(entity => entity._id === entityId)
}

async function remove<T extends Entity>(entityType: string, entityId: string): Promise<void>  {
    const entities = await query<T>(entityType)
    const idx =  entities.findIndex(entity => entity._id === entityId)

    if (idx === -1) return

    entities.splice(idx, 1)
    _saveEntities(entityType, entities)
}

async function post<T extends Entity>(EntityType: string, entity: any): Promise<T> {
    const newEntity = { ...entity, _id: _makeId(), createdAt: Date.now(), updatedAt: Date.now() }
    const entities = await query(EntityType)

    entities.push(newEntity)
    _saveEntities(EntityType, entities)

    return newEntity
}

async function patch<T extends Entity>(entityType: string, entity: { _id: string } & any): Promise<T> {
    const entities = await query(entityType)
    const idx = entities.findIndex(e => e._id === entity._id)

    const patchedEntity = { ...entities[idx], ...entity, updatedAt: Date.now() }
    entities[idx] = patchedEntity

    _saveEntities(entityType, entities)

    return patchedEntity
}

function _saveEntities<T extends Entity>(entityType: string, entities: T[]) {
    localStorage.setItem(entityType, JSON.stringify(entities))
}

function _makeId(length = 5) {
    var id = ''
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (var i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
}