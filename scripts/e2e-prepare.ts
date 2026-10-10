import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createDb } from '../src/lib/server/db/index';
import { users } from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/security/password';
import { databaseFile } from './env';
import { seedAdminLeads } from '../tests/helpers/e2e-leads';
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from './e2e-credentials';

/** Drops the e2e database and recreates it with one admin and the A4 acceptance fixtures. */
async function main(): Promise<void> {
	const file = databaseFile();
	rmSync(dirname(resolve(file)), { recursive: true, force: true });

	const { db, close } = createDb(file);
	try {
		db.insert(users)
			.values({
				email: E2E_ADMIN_EMAIL,
				passwordHash: await hashPassword(E2E_ADMIN_PASSWORD),
				displayName: 'E2E'
			})
			.run();
		seedAdminLeads(db);
	} finally {
		close();
	}

	console.log(`e2e database ready at ${file}`);
}

await main();
