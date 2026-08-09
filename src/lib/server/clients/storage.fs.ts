import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { StorageError, type Storage, type StoredObject } from './storage';

/**
 * Files live outside the static root and are served through an application route,
 * so the web server never hands out an upload by itself.
 */
export class FsStorage implements Storage {
	private readonly root: string;

	constructor(root: string) {
		this.root = resolve(root);
	}

	async put(key: string, data: Uint8Array, _mime: string): Promise<StoredObject> {
		const path = this.pathFor(key);
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, data, { mode: 0o600 });
		return { key, sizeBytes: data.byteLength };
	}

	async get(key: string): Promise<Uint8Array> {
		return new Uint8Array(await readFile(this.pathFor(key)));
	}

	async delete(key: string): Promise<void> {
		await rm(this.pathFor(key), { force: true });
	}

	async exists(key: string): Promise<boolean> {
		try {
			await stat(this.pathFor(key));
			return true;
		} catch {
			return false;
		}
	}

	/** Rejects any key that would climb out of the storage root. */
	private pathFor(key: string): string {
		const path = resolve(join(this.root, normalize(key)));
		if (path !== this.root && !path.startsWith(this.root + sep)) {
			throw new StorageError(`storage key escapes the root: ${key}`);
		}
		return path;
	}
}
