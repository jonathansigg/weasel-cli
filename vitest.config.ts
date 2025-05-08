import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		exclude: ['**/node_modules/**', '**/dist/**'],
		globals: true,
		environment: 'node',
	},
});
