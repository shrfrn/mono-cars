import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: [
			'src/**/*.integration.test.ts',
			'src/**/*.e2e.test.ts',
			'test/**/*.integration.test.ts',
			'test/**/*.e2e.test.ts',
		],
		globalSetup: ['src/test/integration/global-setup.ts'],
		setupFiles: ['src/test/integration/setup-env.ts'],
		clearMocks: true,
		restoreMocks: true,
		testTimeout: 30_000,
		hookTimeout: 60_000,
	},
})
