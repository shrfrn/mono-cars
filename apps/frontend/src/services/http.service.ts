import Axios from 'axios'
import type { Method, AxiosRequestConfig } from 'axios'

const axios = Axios.create({ withCredentials: true })

const BASE_URL = import.meta.env.PROD
    ? '/api/'
    : '//localhost:3030/api/'

export const httpService = {
    get(endpoint: string, data: object | null = null) {
        return ajax(endpoint, 'GET', data)
    },
    delete(endpoint: string) { 
        return ajax( endpoint, 'DELETE') 
    },
    post(endpoint: string, data: object){ 
        return ajax(endpoint, 'POST', data )
    },
    put(endpoint: string, data: object){ 
        return ajax(endpoint, 'PUT', data )
    },
    patch(endpoint: string, data: object){ 
        return ajax(endpoint, 'PATCH', data )
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
        console.groupCollapsed('%cAxios call failed', 'color: orange; font-weight: bold;')

            console.log('method: ', method)
            console.log('endpoint: ', endpoint)

            if (data) console.log('data: ', data)

            console.dir(err)
            
        console.groupEnd()
        throw err
    }
}