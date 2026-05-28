import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
		exclude: [
			'src/**/*.integration.test.ts',
			'src/**/*.e2e.test.ts',
			'test/**/*.integration.test.ts',
			'test/**/*.e2e.test.ts',
		],
		clearMocks: true,
		restoreMocks: true,
	},
})
