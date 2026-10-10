import { defineConfig } from '@playwright/test';

/**
 * E2E runs against the production build with its own database file, seeded before the run.
 */
export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: 'http://localhost:4173',
		// The stylesheet turns off smooth scrolling under reduced motion. Without this the
		// browser animates every scroll and Playwright never sees a stable element.
		reducedMotion: 'reduce'
	},
	webServer: {
		// Secrets stay static across build and runtime. A separate build database proves
		// startup can select the persistent file without writing to it during the build.
		command:
			'DATABASE_FILE=./var/e2e/build.db pnpm exec vite build && pnpm exec tsx scripts/e2e-prepare.ts && node build/index.js',
		timeout: 180_000,
		port: 4173,
		reuseExistingServer: false,
		env: {
			DATABASE_FILE: './var/e2e/app.db',
			PUBLIC_SITE_URL: 'http://localhost:4173',
			SESSION_SECRET: 'e2e-session-secret-not-used-in-production-00',
			IP_HASH_SALT: 'e2e-ip-hash-salt-not-used-in-production-0000',
			ORIGIN: 'http://localhost:4173',
			PORT: '4173'
		}
	}
});
