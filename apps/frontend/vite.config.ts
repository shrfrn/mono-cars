import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@/car/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
		},
	},
	plugins: [react(), tailwindcss()],
})
