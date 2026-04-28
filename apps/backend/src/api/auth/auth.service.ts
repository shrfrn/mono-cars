import Cryptr from 'cryptr'
import { MiniUser, LoginTokenSchema } from '@car/shared'

const cryptr = new Cryptr(process.env.ENCRIPTION_KEY || 'do-89-rh-8j')

export const authService = {
	getLoginToken,
	validateToken,
}

function getLoginToken(user: MiniUser) {
	const validated = LoginTokenSchema.parse(user)
	const json = JSON.stringify(validated)
    return cryptr.encrypt(json)
}

function validateToken(token: string) {
    if (!token) return null

    const json = cryptr.decrypt(token)
	return JSON.parse(json)
}
