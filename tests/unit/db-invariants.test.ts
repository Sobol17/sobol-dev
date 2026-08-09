import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { leadNotes, leads, sessions, users } from '$lib/server/db/schema';
import { createTestDb, type TestDb } from '../helpers/db';

let db: TestDb | null = null;

afterEach(() => {
	db?.drop();
	db = null;
});

function open(): TestDb {
	db = createTestDb();
	return db;
}

describe('database invariants', () => {
	it('applies migrations on a clean file and turns foreign keys on', () => {
		const handle = open();

		expect(handle.sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
		expect(handle.sqlite.pragma('journal_mode', { simple: true })).toBe('wal');
	});

	it('cascades a deleted user to their sessions', () => {
		const handle = open();
		const user = handle.db
			.insert(users)
			.values({ email: 'a@b.test', passwordHash: 'x', displayName: 'A' })
			.returning()
			.get()!;
		handle.db
			.insert(sessions)
			.values({ id: 'sid', userId: user.id, expiresAt: new Date(Date.now() + 1000) })
			.run();

		handle.db.delete(users).where(eq(users.id, user.id)).run();

		expect(handle.db.select().from(sessions).all()).toHaveLength(0);
	});

	it('refuses a lead with no contact channel', () => {
		const handle = open();

		expect(() =>
			handle.db
				.insert(leads)
				.values({ publicId: 'AAAAAA', type: 'web', goal: 'g', contactName: 'n', utm: {} })
				.run()
		).toThrow(/leads_contact_ck/);
	});

	it('cascades a deleted lead to its notes', () => {
		const handle = open();
		const lead = handle.db
			.insert(leads)
			.values({
				publicId: 'BBBBBB',
				type: 'web',
				goal: 'g',
				contactName: 'n',
				contactTelegram: '@x',
				utm: {}
			})
			.returning()
			.get()!;
		handle.db.insert(leadNotes).values({ leadId: lead.id, body: 'note' }).run();

		handle.db.delete(leads).where(eq(leads.id, lead.id)).run();

		expect(handle.db.select().from(leadNotes).all()).toHaveLength(0);
	});

	it('round-trips json and timestamp columns through their JS types', () => {
		const handle = open();
		const createdAt = new Date('2026-03-01T10:00:00.000Z');

		const lead = handle.db
			.insert(leads)
			.values({
				publicId: 'CCCCCC',
				type: 'tma',
				goal: 'g',
				contactName: 'n',
				contactEmail: 'a@b.test',
				utm: { source: 'telegram', campaign: 'launch' },
				createdAt,
				updatedAt: createdAt
			})
			.returning()
			.get()!;

		expect(lead.utm).toEqual({ source: 'telegram', campaign: 'launch' });
		expect(lead.createdAt).toBeInstanceOf(Date);
		expect(lead.createdAt.toISOString()).toBe(createdAt.toISOString());
	});
});
