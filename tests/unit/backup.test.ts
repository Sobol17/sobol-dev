import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readdirSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BackupService } from '$lib/server/db/backup';
import { createDb } from '$lib/server/db';
import { leadNotes, users } from '$lib/server/db/schema';
import { createLeadSlice, leadInput, requestMeta } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice>;
afterEach(() => slice?.dispose());
function backupService() {
	slice = createLeadSlice();
	return new BackupService(slice.db.file, join(slice.db.dir, 'backups'), slice.clock);
}

describe('VPS database backups', () => {
	it('restores a lead and note from active WAL and leaves subsequent submissions in the live database', async () => {
		const backup = backupService();
		const lead = await slice.leads.submit(leadInput(), requestMeta());
		const user = slice.db.db
			.insert(users)
			.values({ email: 'owner@example.test', passwordHash: 'hash', displayName: 'Owner' })
			.returning()
			.get()!;
		slice.leads.addNote(lead.id, user.id, 'Keep the conversation');
		expect(existsSync(slice.db.file + '-wal')).toBe(true);
		const file = backup.create();
		expect(statSync(file).mode & 0o777).toBe(0o600);
		await slice.leads.submit(leadInput({ contactName: 'Later client' }), requestMeta());
		const restored = createDb(file);
		try {
			expect(restored.db.select().from(leadNotes).all()).toMatchObject([
				{ body: 'Keep the conversation', leadId: lead.id, authorId: user.id }
			]);
			expect(restored.sqlite.prepare('select public_id from leads').all()).toEqual([
				{ public_id: lead.publicId }
			]);
			expect(slice.leadRepository.count()).toBe(2);
		} finally {
			restored.close();
		}
	});

	it('keeps recent snapshots and removes only its own snapshots older than fourteen days', () => {
		const backup = backupService();
		const old = backup.create();
		utimesSync(old, slice.clock.now(), slice.clock.now());
		slice.clock.advance(15 * 24 * 60 * 60 * 1000);
		const directory = join(slice.db.dir, 'backups');
		const other = join(directory, 'manual.db');
		writeFileSync(other, 'keep');
		utimesSync(other, new Date(0), new Date(0));
		const latest = backup.create();
		expect(existsSync(old)).toBe(false);
		expect(existsSync(other)).toBe(true);
		expect(existsSync(latest)).toBe(true);
	});

	it('does not create a missing source database', () => {
		backupService();
		const missing = join(slice.db.dir, 'missing.db');
		const backup = new BackupService(missing, join(slice.db.dir, 'backups'), slice.clock);
		expect(() => backup.create()).toThrow();
		expect(existsSync(missing)).toBe(false);
	});

	it('rejects an invalid source without deleting an existing snapshot', () => {
		const backup = backupService();
		const usable = backup.create();
		const bad = join(slice.db.dir, 'bad.db');
		writeFileSync(bad, 'not sqlite');
		expect(() =>
			new BackupService(bad, join(slice.db.dir, 'backups'), slice.clock).create()
		).toThrow();
		expect(readdirSync(join(slice.db.dir, 'backups'))).toEqual([usable.split('/').at(-1)]);
	});

	it('rejects broken foreign keys and removes the unusable snapshot', () => {
		const backup = backupService();
		slice.db.sqlite.pragma('foreign_keys = OFF');
		slice.db.db.insert(leadNotes).values({ leadId: 'missing', body: 'Broken history' }).run();
		mkdirSync(join(slice.db.dir, 'backups'));
		expect(() => backup.create()).toThrow('foreign key check');
		expect(readdirSync(join(slice.db.dir, 'backups'))).toEqual([]);
	});
});
