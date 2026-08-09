import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { eq } from 'drizzle-orm';
import { createDb } from '../src/lib/server/db/index';
import { users } from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/security/password';
import { databaseFile } from './env';

/** The only way an account is created. There is no public registration. */
async function main(): Promise<void> {
	const [emailArg, passwordArg, nameArg] = process.argv.slice(2);

	const rl = createInterface({ input: stdin, output: stdout });
	const email = emailArg ?? (await rl.question('email: '));
	const password = passwordArg ?? (await rl.question('password: '));
	const displayName = nameArg ?? (await rl.question('display name: '));
	rl.close();

	if (password.length < 12) throw new Error('password must be at least 12 characters');

	const { db, close } = createDb(databaseFile());
	try {
		const existing = db.select().from(users).where(eq(users.email, email)).get();
		const passwordHash = await hashPassword(password);

		if (existing) {
			db.update(users).set({ passwordHash, displayName }).where(eq(users.id, existing.id)).run();
			console.log(`updated admin ${email}`);
			return;
		}

		db.insert(users).values({ email, passwordHash, displayName }).run();
		console.log(`created admin ${email}`);
	} finally {
		close();
	}
}

await main();
