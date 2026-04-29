import { LoginCredentials, MiniUser, MiniUserSchema, SignupCredentials, UserPublicSchema, UserRoles, User } from "@car/shared"
import { userService } from "../user/user.service.js"
import { Request, Response } from "express"
import { authService } from "./auth.service.js"

export async function login(req: Request<{}, MiniUser, LoginCredentials>, res: Response) {
    const { username, password } = req.body
    try {
        const user = await userService.getByUsername(username)
        if (!user || user.password !== password) return res.status(404).send()

        const { publicUser, loginToken } = _prepareResponse(user)

        res.cookie('loginToken', loginToken)
        res.send(publicUser)
    } catch (err) {
        
    }
}

export async function signup(req: Request<{}, MiniUser, SignupCredentials>, res: Response) {
    const { username, password, fullname } = req.body
    const registration = { username, password, fullname, role: 'Guest' as UserRoles }

    try {
        const user = await userService.getByUsername(username)
        if (user) return res.status(400).send({ err: 'username taken' })

        const newUser = await userService.post(registration)
        const { publicUser, loginToken } = _prepareResponse(newUser)
        
        res.cookie('loginToken', loginToken)
        res.send(publicUser)
    } catch (err) {
        
    }
}

export async function logout(req: Request, res: Response) {
    console.log('Hi')
    res.clearCookie('loginToken')
    res.status(204).send()
}

function _prepareResponse(user: User) {
    const publicUser = UserPublicSchema.parse(user)
    const miniUser = MiniUserSchema.parse(publicUser)
    const loginToken = authService.getLoginToken(miniUser)

    return { publicUser, loginToken }
}