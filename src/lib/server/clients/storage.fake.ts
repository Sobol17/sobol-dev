import { StorageError, type Storage, type StoredObject } from './storage';

/** In-memory double with the same failure switch as the other fakes. */
export class FakeStorage implements Storage {
	readonly objects = new Map<string, Uint8Array>();
	failNext = 0;
	failAlways = false;

	async put(key: string, data: Uint8Array, _mime: string): Promise<StoredObject> {
		this.guard();
		this.objects.set(key, data);
		return { key, sizeBytes: data.byteLength };
	}

	async get(key: string): Promise<Uint8Array> {
		this.guard();
		const data = this.objects.get(key);
		if (!data) throw new StorageError(`object not found: ${key}`);
		return data;
	}

	async delete(key: string): Promise<void> {
		this.guard();
		this.objects.delete(key);
	}

	async exists(key: string): Promise<boolean> {
		return this.objects.has(key);
	}

	reset(): void {
		this.objects.clear();
		this.failNext = 0;
		this.failAlways = false;
	}

	private guard(): void {
		if (this.failAlways || this.failNext > 0) {
			if (this.failNext > 0) this.failNext -= 1;
			throw new StorageError('fake storage failure');
		}
	}
}
