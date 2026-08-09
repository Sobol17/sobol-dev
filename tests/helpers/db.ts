import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDb, type DbHandle } from '$lib/server/db/index';

export interface TestDb extends DbHandle {
	drop(): void;
}

/**
 * A fresh file per test case. `:memory:` would hide WAL and file behaviour, and shared state
 * between cases is exactly the leak these tests are supposed to catch.
 */
export function createTestDb(): TestDb {
	const dir = mkdtempSync(join(tmpdir(), 'sobol-test-'));
	const handle = createDb(join(dir, 'test.db'));

	return {
		...handle,
		drop() {
			handle.close();
			rmSync(dir, { recursive: true, force: true });
		}
	};
}
