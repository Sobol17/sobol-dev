import { defineConfig } from '@playwright/test';

/**
 * E2E runs against the production build with its own database file, seeded before the run.
 * `USE_FAKE_CLIENTS` keeps Telegram out of the loop.
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
		// `$env/static/private` is inlined at build time, so the build has to run with the same
		// environment the server will use. Building here is what makes the e2e database take effect.
		command: 'pnpm exec vite build && pnpm exec tsx scripts/e2e-prepare.ts && node build/index.js',
		timeout: 180_000,
		port: 4173,
		reuseExistingServer: false,
		env: {
			DATABASE_FILE: './var/e2e/app.db',
			PUBLIC_SITE_URL: 'http://localhost:4173',
			SESSION_SECRET: 'e2e-session-secret-not-used-in-production-00',
			IP_HASH_SALT: 'e2e-ip-hash-salt-not-used-in-production-0000',
			UPLOADS_DIR: './var/e2e/uploads',
			USE_FAKE_CLIENTS: 'true',
			TELEGRAM_OWNER_CHAT_ID: 'fake-owner-chat',
			ORIGIN: 'http://localhost:4173',
			PORT: '4173'
		}
	}
});
