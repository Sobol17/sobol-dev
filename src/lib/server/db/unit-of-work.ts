import type { Db } from './index';

/**
 * Lets a service commit business data and the job it publishes together without knowing
 * about Drizzle. better-sqlite3 transactions belong to the connection, so anything written
 * through the same handle inside the callback joins the same transaction.
 */
export interface UnitOfWork {
	transaction<T>(fn: () => T): T;
}

export class SqliteUnitOfWork implements UnitOfWork {
	constructor(private readonly db: Db) {}

	transaction<T>(fn: () => T): T {
		return this.db.transaction(() => fn());
	}
}
