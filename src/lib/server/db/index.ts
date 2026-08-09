import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema>;

/** Migrations ship as files, so the folder is resolved from the process working directory. */
export const MIGRATIONS_DIR = resolve(process.cwd(), 'src/lib/server/db/migrations');

export interface DbHandle {
	db: Db;
	sqlite: Database.Database;
	close(): void;
}

/**
 * Opens the database file, applies PRAGMA once and runs pending migrations.
 * The file path is a parameter so scripts and tests can open their own database
 * without pulling the application environment in.
 */
export function createDb(file: string, options: { migrationsDir?: string } = {}): DbHandle {
	if (file !== ':memory:') {
		mkdirSync(dirname(resolve(file)), { recursive: true });
	}

	const sqlite = new Database(file);
	sqlite.pragma('journal_mode = WAL'); // readers do not block the single writer
	sqlite.pragma('foreign_keys = ON'); // off by default in SQLite, cascades depend on it
	sqlite.pragma('busy_timeout = 5000'); // wait instead of throwing SQLITE_BUSY
	sqlite.pragma('synchronous = NORMAL'); // safe with WAL, much faster than FULL

	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: options.migrationsDir ?? MIGRATIONS_DIR });

	return {
		db,
		sqlite,
		close: () => sqlite.close()
	};
}

export * as schema from './schema';
