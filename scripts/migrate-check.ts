import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDb } from '../src/lib/server/db/index';

const EXPECTED_TABLES = [
	'auth_attempts',
	'jobs',
	'lead_notes',
	'leads',
	'media',
	'outbox_messages',
	'project_media',
	'project_tags',
	'projects',
	'proposals',
	'sessions',
	'tech_tags',
	'users'
];

const LEAD_WITHOUT_CONTACT =
	'insert into leads (id, public_id, type, goal, contact_name, utm, created_at, updated_at)' +
	" values ('probe', 'PROBE', 'web', 'goal', 'name', '{}', 1, 1)";

/**
 * Applies every migration to an empty file, then checks what SQLite silently loses when a
 * generated migration rebuilds a table: the pragma, the foreign keys and the CHECK constraints.
 */
function main(): void {
	const dir = mkdtempSync(join(tmpdir(), 'sobol-migrate-'));
	const { sqlite, close } = createDb(join(dir, 'check.db'));

	try {
		if (sqlite.pragma('foreign_keys', { simple: true }) !== 1) {
			throw new Error('foreign_keys pragma is off');
		}

		const violations = sqlite.pragma('foreign_key_check') as unknown[];
		if (violations.length > 0) {
			throw new Error(`foreign key violations after migration: ${JSON.stringify(violations)}`);
		}

		const integrity = sqlite.pragma('integrity_check', { simple: true });
		if (integrity !== 'ok') throw new Error(`integrity check failed: ${String(integrity)}`);

		const tables = (
			sqlite
				.prepare("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'")
				.all() as { name: string }[]
		).map((row) => row.name);

		const missing = EXPECTED_TABLES.filter((name) => !tables.includes(name));
		if (missing.length > 0) throw new Error(`missing tables: ${missing.join(', ')}`);

		if (!rejects(() => sqlite.prepare(LEAD_WITHOUT_CONTACT).run())) {
			throw new Error('leads_contact_ck is missing after migration');
		}

		console.log(`migrations applied cleanly, ${tables.length} tables`);
	} finally {
		close();
		rmSync(dir, { recursive: true, force: true });
	}
}

function rejects(run: () => void): boolean {
	try {
		run();
		return false;
	} catch {
		return true;
	}
}

main();
