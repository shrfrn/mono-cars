import type { LoginCredentials, SignupCredentials, MiniUser } from '@cars/shared'
import { MiniUserSchema } from '@cars/shared'

import { httpService } from '../http.service'

const STORAGE_KEY = 'loggedinUser'
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
	const withImgUrl = { ...credentials, imgUrl: `https://robohash.org/${credentials.username}` }
    const user = await httpService.post(BASE_URL + 'signup', withImgUrl)

    const miniUser = MiniUserSchema.parse(user)
    return _setLoggedInUser(miniUser)
}

async function logout(): Promise<void> {
    await httpService.post(BASE_URL + 'logout', {})
	_setLoggedInUser(null)
}

// Private functions

function _setLoggedInUser(user: MiniUser | null) {
	if (user) {
		console.log(STORAGE_KEY, user)
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
	}
	else sessionStorage.removeItem(STORAGE_KEY)

    return user
}