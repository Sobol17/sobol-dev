import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	out: './src/lib/server/db/migrations',
	dbCredentials: {
		url: process.env.DATABASE_FILE ?? './var/data/app.db'
	},
	strict: true,
	verbose: true
});
