import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/demo',
	workers: 1,
	use: { baseURL: 'http://127.0.0.1:4176/sobol-dev/', reducedMotion: 'reduce' },
	webServer: {
		command: 'pnpm build:demo && node scripts/serve-demo.mjs',
		url: 'http://127.0.0.1:4176/sobol-dev/',
		timeout: 120_000,
		reuseExistingServer: false
	}
});
