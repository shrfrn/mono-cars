import { LoginCredentials, MiniUser, MiniUserSchema, SignupCredentials, UserPublicSchema, UserRoles, User } from "@car/shared"
import { userService } from "../user/user.service.js"
import { Request, Response } from "express"
import { authService } from "./auth.service.js"
import { UnauthorizedError, ValidationError } from "../../errors/app-errors.js"

export async function login(req: Request<{}, MiniUser, LoginCredentials>, res: Response) {
    const { username, password } = req.body
	
	const user = await userService.getByUsername(username)
	if (!user || user.password !== password) throw new UnauthorizedError('Invalid username or password')

	const { publicUser, loginToken } = _prepareResponse(user)

	res.cookie('loginToken', loginToken)
	res.send(publicUser)
}

export async function signup(req: Request<{}, MiniUser, SignupCredentials>, res: Response) {
    const { username, password, fullname } = req.body
    const registration = { username, password, fullname, role: 'Member' as UserRoles }

	const user = await userService.getByUsername(username)
	if (user) throw new ValidationError('username taken')

	const newUser = await userService.post(registration)
	const { publicUser, loginToken } = _prepareResponse(newUser)
	
	res.cookie('loginToken', loginToken)
	res.send(publicUser)
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('loginToken')
    res.status(204).send()
}

function _prepareResponse(user: User) {
    const publicUser = UserPublicSchema.parse(user)
    const miniUser = MiniUserSchema.parse(publicUser)
    const loginToken = authService.getLoginToken(miniUser)

    return { publicUser, loginToken }
}