import Axios, { AxiosError } from 'axios'
import type { Method, AxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '@cars/shared/src/http'

const axios = Axios.create({ withCredentials: true })

const BASE_URL = import.meta.env.PROD
	? '/api/'
	: '//localhost:3030/api/'


export const httpService = {
	get(endpoint: string, data: object | null = null) {
		return ajax(endpoint, 'GET', data)
	},
	delete(endpoint: string) {
		return ajax(endpoint, 'DELETE')
	},
	post(endpoint: string, data: object | null = null) {
		return ajax(endpoint, 'POST', data)
	},
	put(endpoint: string, data: object) {
		return ajax(endpoint, 'PUT', data)
	},
	patch(endpoint: string, data: object) {
		return ajax(endpoint, 'PATCH', data)
	},
}


async function ajax(endpoint: string, method: Method, data: object | null = null) {
	const url = `${BASE_URL}${endpoint}`
	const params = (method === 'GET') ? data : null
	const options: AxiosRequestConfig = { url, method, data, params }

	try {
		const res = await axios(options)
		return res.data
	} catch (err) {
		if (err instanceof AxiosError) _logAxiosError(err, method, endpoint, data)
		else console.error(`${method} ${endpoint} failed`, err)

		throw err
	}
}


function _logAxiosError(err: AxiosError<ApiErrorResponse>, method: Method, endpoint: string, data: object | null) {
	const status = err.response?.status ?? '?'
	const body = err.response?.data

	console.groupCollapsed(
		`%c${method} ${endpoint} failed (${status})${body?.message ? ` — ${body.message}` : ''}`,
		'color: orange; font-weight: bold;',
	)

	if (data) console.log('request data:', data)

	if (body) {
		if (body.code)    console.log('code:', body.code)
		if (body.details) console.log('details:', body.details)
		if (body.pretty)  console.log('pretty:\n' + body.pretty)
		if (body.stack)   console.log('stack:\n' + body.stack)
	} else {
		console.log('no response body — network or CORS error')
		console.dir(err)
	}

	console.groupEnd()
}
