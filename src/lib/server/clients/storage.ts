export interface StoredObject {
	key: string;
	sizeBytes: number;
}

export interface Storage {
	/** Writes bytes under a caller-chosen random key. Returns what was actually stored. */
	put(key: string, data: Uint8Array, mime: string): Promise<StoredObject>;
	/** Backed by its own buffer, so the bytes can go straight into a response body. */
	get(key: string): Promise<Uint8Array<ArrayBuffer>>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
}

export class StorageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StorageError';
	}
}
