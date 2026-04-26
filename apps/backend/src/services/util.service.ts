import fs from 'fs'

export function readJsonFile(path: string) {
  const json = fs.readFileSync(path, 'utf8')
  const data = JSON.parse(json)
  return data
}

export function makeId(length = 5) {
  let id = ''

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min 
}

export function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min 
}

export function getRandomElement<T>(arr: T[]): T {
    const idx = getRandomInt(0, arr.length)
    return arr[idx]
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString() // Returns "MM/DD/YYYY, HH:MM:SS AM/PM" (locale dependent)
}
