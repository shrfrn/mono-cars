export function makeid(length = 5) {
	let id = ''
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (let i = 0; i < length; i++) {
		id += chars.charAt(getRandomInt(0, chars.length))
	}
	return id
}

export function getRandomInt(min: number, max: number) {
	const minCeiled = Math.ceil(min)
	const maxFloored = Math.floor(max)

	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

export function getRandomIntInclusive(min: number, max: number) {
	const minCeiled = Math.ceil(min)
	const maxFloored = Math.floor(max)

	return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
}

export function getRandomElement<T>(arr: T[]): T {
    const idx = getRandomInt(0, arr.length)
    return arr[idx]
}

export function formatTimestamp(timestamp: number | string | Date) {
  const date = new Date(timestamp)
  return date.toLocaleString() // Returns "MM/DD/YYYY, HH:MM:SS AM/PM" (locale dependent)
}

export function saveToStorage<T>(key: string, data: T) {
    const json = JSON.stringify(data)
    localStorage.setItem(key, json)
}

export function loadFromStorage<T>(key: string): T | null {
    const json = localStorage.getItem(key)
    return json ? JSON.parse(json) as T : null
}