import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { MongoDBContainer } from '@testcontainers/mongodb'
import { GenericContainer } from 'testcontainers'

type TestInfraEnv = {
	mongoUrl: string,
	redisUrl: string,
}

const ENV_FILE_PATH = path.resolve('.test-artifacts/integration-env.json')

export default async function globalSetup() {
	const mongoContainer = await new MongoDBContainer('mongo:7').start()
	const redisContainer = await new GenericContainer('redis:7-alpine')
		.withExposedPorts(6379)
		.start()

	const env = {
		mongoUrl: buildMongoUrl(mongoContainer.getConnectionString()),
		redisUrl: `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`,
	} satisfies TestInfraEnv

	process.env.TEST_MONGO_URL = env.mongoUrl
	process.env.TEST_REDIS_URL = env.redisUrl
	process.env.NODE_ENV = 'test'

	await mkdir(path.dirname(ENV_FILE_PATH), { recursive: true })
	await writeFile(ENV_FILE_PATH, JSON.stringify(env), 'utf8')

	return async () => {
		await redisContainer.stop()
		await mongoContainer.stop()
	}
}

function buildMongoUrl(connectionString: string) {
	const separator = connectionString.includes('?') ? '&' : '?'
	return `${connectionString}${separator}replicaSet=rs0&retryWrites=false&directConnection=true`
}
