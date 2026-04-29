import { Request, Response, NextFunction, RequestHandler } from 'express'
import { ValidationError } from '../errors/app-errors.js'

export const validateParamsMatch = (paramKey: string, bodyKey: string): RequestHandler => 
    (req: Request, res: Response, next: NextFunction) => {

        if (res.locals.params[paramKey] !== res.locals.body[bodyKey]) {
            throw new ValidationError(`params.${paramKey} and body.${bodyKey} don't match`)
        }
        next()
}