import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDb, MIGRATIONS_DIR } from '$lib/server/db';
import {
	users,
	sessions,
	authAttempts,
	leads,
	leadNotes,
	jobs,
	outboxMessages
} from '$lib/server/db/schema';
const dirs: string[] = [];
afterEach(() => {
	dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});
const retained = [
	'auth_attempts',
	'jobs',
	'lead_notes',
	'leads',
	'outbox_messages',
	'sessions',
	'users'
];
function folder() {
	const dir = mkdtempSync(join(tmpdir(), 'agency-migration-'));
	dirs.push(dir);
	return dir;
}
it('creates only core v4 tables on a fresh database', () => {
	const db = createDb(join(folder(), 'fresh.db'));
	try {
		const tables = db.sqlite
			.prepare(
				"select name from sqlite_master where type='table' and name not like 'sqlite_%' and name != '__drizzle_migrations' order by name"
			)
			.all() as { name: string }[];
		expect(tables.map((row) => row.name)).toEqual(retained);
		expect(db.sqlite.pragma('foreign_key_check')).toEqual([]);
	} finally {
		db.close();
	}
});
it('upgrades a consistent backup without changing existing lead, auth, outbox or job rows', () => {
	const dir = folder();
	const oldMigrations = join(dir, 'old');
	mkdirSync(join(oldMigrations, 'meta'), { recursive: true });
	const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf8'));
	journal.entries = journal.entries.slice(0, 1);
	writeFileSync(join(oldMigrations, 'meta/_journal.json'), JSON.stringify(journal));
	copyFileSync(join(MIGRATIONS_DIR, '0000_init.sql'), join(oldMigrations, '0000_init.sql'));
	const old = createDb(join(dir, 'original.db'), { migrationsDir: oldMigrations });
	let before: unknown[];
	try {
		const user = old.db
			.insert(users)
			.values({ email: 'owner@example.test', passwordHash: 'hash', displayName: 'Owner' })
			.returning()
			.get();
		old.db
			.insert(sessions)
			.values({ id: 'session', userId: user.id, expiresAt: new Date('2030-01-01') })
			.run();
		old.db.insert(authAttempts).values({ ipHash: 'hash', succeeded: true }).run();
		const lead = old.db
			.insert(leads)
			.values({
				publicId: 'ABCDEF',
				type: 'web',
				goal: 'Keep this request',
				contactName: 'Client',
				contactEmail: 'client@example.test',
				utm: { source: 'backup' }
			})
			.returning()
			.get();
		old.db
			.insert(leadNotes)
			.values({ leadId: lead.id, authorId: user.id, body: 'Keep this note' })
			.run();
		old.db
			.insert(jobs)
			.values({
				topic: 'lead.submitted',
				payload: { leadId: lead.id },
				runAt: new Date(),
				status: 'active',
				attempts: 1
			})
			.run();
		old.db
			.insert(outboxMessages)
			.values({
				channel: 'telegram',
				templateKey: 'lead.new',
				recipient: 'owner',
				payload: { leadId: lead.id },
				dedupeKey: 'retained'
			})
			.run();
		// Populate retired tables too: their foreign keys must not cascade into retained data.
		old.sqlite
			.prepare(
				'insert into media (id, storage_key, mime, size_bytes, variants, created_at) values (?, ?, ?, ?, ?, ?)'
			)
			.run('cover', 'cover.png', 'image/png', 1, '[]', 1);
		old.sqlite
			.prepare(
				'insert into projects (id, slug, title, category, summary, body, cover_media_id, metrics, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
			.run('case', 'case', 'Case', 'web', 'Summary', 'Body', 'cover', '[]', 1, 1);
		old.sqlite
			.prepare(
				'insert into proposals (id, lead_id, public_token, title, body_md, scope, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)'
			)
			.run('offer', lead.id, 'token', 'Offer', 'Body', '[]', 1, 1);
		before = retained.map((table) =>
			old.sqlite.prepare(`select * from ${table} order by id`).all()
		);
		old.sqlite.prepare('VACUUM INTO ?').run(join(dir, 'backup.db'));
	} finally {
		old.close();
	}
	const upgraded = createDb(join(dir, 'backup.db'));
	try {
		expect(
			retained.map((table) => upgraded.sqlite.prepare(`select * from ${table} order by id`).all())
		).toEqual(before);
		expect(upgraded.sqlite.pragma('foreign_key_check')).toEqual([]);
		expect(upgraded.sqlite.pragma('integrity_check', { simple: true })).toBe('ok');
	} finally {
		upgraded.close();
	}
});
