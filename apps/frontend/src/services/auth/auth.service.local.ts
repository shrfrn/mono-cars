import type { LoginCredentials, MiniUser, SignupCredentials } from '@cars/shared'
import { MiniUserSchema } from '@cars/shared'

import { userService } from '../user/user.service.local'

export const authService = {
	login,
	signup,
	logout,
}

async function login(credentials: LoginCredentials): Promise<MiniUser> {
    const user = await userService.getByUsername(credentials.username)
    if (!user || user.password !== credentials.password) throw new Error('Invalid credentials')

    const miniUser = MiniUserSchema.parse(user)
    return _setLoggedInUser(miniUser)
}

async function signup(credentials: SignupCredentials): Promise<MiniUser> {
    const user = await userService.getByUsername(credentials.username)
    if (user) throw new Error('Username already taken')

    const newUser = await userService.addUser(credentials)
    const miniUser = MiniUserSchema.parse(newUser)

    return _setLoggedInUser(miniUser)
}

async function logout(): Promise<void> {
    _setLoggedInUser(null)
}

// Private functions

function _setLoggedInUser(user: MiniUser | null) {
    if (user) sessionStorage.setItem('loggedInUser', JSON.stringify(user))
	else sessionStorage.removeItem('loggedInUser')

    return user
}