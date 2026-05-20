import { Request, Response, NextFunction, RequestHandler } from "express"
import { byObjectId, getCollection } from "#services/db.service.js"
import { getAsyncStore } from "./async-store.js"

import {
	checkPermission,
	PermissionRequestSchema,
	resourceResolvers,
	type PermissionKey,
} from "@cars/shared/src/abac.js"
import {
	EntityNotFoundError,
	ForbidenError,
	InternalServerError,
	UnauthorizedError,
} from "../errors/app-errors.js"

export function requirePermission(action: PermissionKey): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		
		const { authUser: subject } = getAsyncStore()!
		if (!subject) throw new UnauthorizedError()

		const params = res.locals.params
		if (!params) throw new InternalServerError('requirePermission requires validateRequest(..., "params") to run first')
		if (!params.id) throw new InternalServerError('requirePermission requires params schema to include "id"')

		// Fetch a resource resolver if one exists for this action or default to - {}
		const config = resourceResolvers[action] ?? {}
		// If a collection name exists on the request resolver, use it, otherwise derive it from the action
		const collectionName = config.collection ?? action.split(':')[0]
		// If a resolve function exists on the request resolver, use it, otherwise use the parent
		const resolve = config.resolve ?? (parent => parent)

		const collection = await getCollection(collectionName)
		const parent = await collection.findOne(byObjectId(params.id))
		if (!parent) throw new EntityNotFoundError(collectionName)

		const resource = resolve(parent, params)
		if (!resource) throw new EntityNotFoundError(action.split(':')[1] ?? collectionName)

		const request = PermissionRequestSchema.parse({ action, subject, resource })
		if (!checkPermission(request)) throw new ForbidenError()
		next()
	}
}
