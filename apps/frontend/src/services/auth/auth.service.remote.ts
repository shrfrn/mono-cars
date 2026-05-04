import type { LoginCredentials, SignupCredentials, MiniUser } from '@cars/shared'
import { MiniUserSchema } from '@cars/shared'

import { httpService } from '../http.service'

const BASE_URL = 'auth/'

export const authService = {
	login,
	signup,
	logout,
}

async function login(credentials: LoginCredentials): Promise<MiniUser> {
    const user = await httpService.post(BASE_URL + 'login', credentials)

    const miniUser = MiniUserSchema.parse(user)
    return _setLoggedInUser(miniUser)
}

async function signup(credentials: SignupCredentials): Promise<MiniUser> {
    const user = await httpService.post(BASE_URL + 'signup', credentials)

    const miniUser = MiniUserSchema.parse(user)
    return _setLoggedInUser(miniUser)
}

async function logout(): Promise<void> {
    await httpService.post(BASE_URL + 'logout', {})
	_setLoggedInUser(null)
}

// Private functions

function _setLoggedInUser(user: MiniUser | null) {
    if (user) sessionStorage.setItem('loggedInUser', JSON.stringify(user))
	else sessionStorage.removeItem('loggedInUser')

    return user
}