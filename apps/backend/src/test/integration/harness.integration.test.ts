import { describe, expect, it } from 'vitest'

import { applyIntegrationEnv, createIntegrationScope } from './harness.js'

describe('integration harness setup', () => {
	it('applies runtime env vars for isolated scope', () => {
		const scope = createIntegrationScope('phase2')

		applyIntegrationEnv(scope)

		expect(process.env.MONGO_URL).toBe(process.env.TEST_MONGO_URL)
		expect(process.env.REDIS_QUEUE_URL).toBe(process.env.TEST_REDIS_URL)
		expect(process.env.MONGO_DB_NAME).toBe(scope.dbName)
	})
})
