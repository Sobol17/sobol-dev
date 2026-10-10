import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Clock } from '../domain/clock';

const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const BACKUP_NAME = /^app-\d{8}T\d{6}Z-[a-f0-9-]{36}\.db$/;

export class BackupService {
	constructor(
		private readonly source: string,
		private readonly directory: string,
		private readonly clock: Clock
	) {}

	/** Snapshot the live WAL database without changing the source or running migrations. */
	create(): string {
		mkdirSync(this.directory, { recursive: true, mode: 0o700 });
		const stamp = this.clock
			.now()
			.toISOString()
			.replace(/[-:]/g, '')
			.replace(/\.\d{3}/, '');
		const target = join(this.directory, `app-${stamp}-${randomUUID()}.db`);
		const source = new Database(this.source, { readonly: true, fileMustExist: true });
		try {
			source.prepare('VACUUM INTO ?').run(target);
			chmodSync(target, 0o600);
			this.verify(target);
		} catch (error) {
			rmSync(target, { force: true });
			throw error;
		} finally {
			source.close();
		}
		this.prune(target);
		return target;
	}

	/** Reject corruption and broken foreign keys before the snapshot is reported as usable. */
	verify(file: string): void {
		const db = new Database(file, { readonly: true, fileMustExist: true });
		try {
			if (db.pragma('integrity_check', { simple: true }) !== 'ok')
				throw new Error('backup integrity check failed');
			const violations = db.pragma('foreign_key_check');
			if (!Array.isArray(violations) || violations.length)
				throw new Error('backup foreign key check failed');
		} finally {
			db.close();
		}
	}

	private prune(current: string): void {
		const cutoff = this.clock.now().getTime() - RETENTION_MS;
		for (const name of readdirSync(this.directory)) {
			if (!BACKUP_NAME.test(name)) continue;
			const file = join(this.directory, name);
			const info = statSync(file);
			if (file !== current && info.isFile() && info.mtimeMs < cutoff) rmSync(file);
		}
	}
}
