import { Request, Response, NextFunction, RequestHandler } from "express"
import { ZodType } from "zod"

type RequestPart = 'query' | 'params' | 'body'

export const validateRequest = (schema: ZodType, part: RequestPart): RequestHandler => 
    (req: Request, res: Response, next: NextFunction) => {

        req[part] = schema.parse(req[part])
        next()
}