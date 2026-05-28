import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

type TestInfraEnv = {
	mongoUrl: string,
	redisUrl: string,
}

const ENV_FILE_PATH = path.resolve('.test-artifacts/integration-env.json')

const raw = await readFile(ENV_FILE_PATH, 'utf8')
const env = JSON.parse(raw) as TestInfraEnv
const dbName = `cars_it_${randomUUID().slice(0, 8)}`

process.env.TEST_MONGO_URL = env.mongoUrl
process.env.TEST_REDIS_URL = env.redisUrl
process.env.MONGO_URL = env.mongoUrl
process.env.REDIS_QUEUE_URL = env.redisUrl
process.env.MONGO_DB_NAME = dbName
process.env.NODE_ENV = 'test'
