import { Request, Response, NextFunction, RequestHandler } from "express"
import { byObjectId, getCollection } from "#services/db.service.js"
import { getAsyncStore } from "./async-store.js"

import {
	checkPermission,
	PermissionRequestSchema,
	actionResolvers,
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
		if (!params?.id) throw new InternalServerError('requirePermission requires validateRequest(..., "params") to run first')

		const config = actionResolvers[action] ?? {}
		const collectionName = config.collection ?? action.split(':')[0]
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
