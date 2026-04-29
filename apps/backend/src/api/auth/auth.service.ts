import Cryptr from 'cryptr'
import { MiniUser, MiniUserSchema } from '@car/shared'

const cryptr = new Cryptr(process.env.ENCRIPTION_KEY || 'do-89-rh-8j')

export const authService = {
	getLoginToken,
	validateToken,
}

function getLoginToken(user: MiniUser) {
	const validated = MiniUserSchema.parse(user)
	const json = JSON.stringify(validated)

    return cryptr.encrypt(json)
}

function validateToken(token: string): MiniUser | null {
    if (!token) return null

    const decrpyted = cryptr.decrypt(token)
    const raw = JSON.parse(decrpyted)
    const validated = MiniUserSchema.parse(raw)

	return validated
}
