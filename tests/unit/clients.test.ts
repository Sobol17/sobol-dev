import { describe, expect, it } from 'vitest';
import { FakeNotifier } from '$lib/server/clients/notifier.fake';
import { FakeStorage } from '$lib/server/clients/storage.fake';
import { NotifierError } from '$lib/server/clients/notifier';
import { StorageError } from '$lib/server/clients/storage';

describe('FakeNotifier', () => {
	it('records what was sent', async () => {
		const notifier = new FakeNotifier();

		await notifier.send({ recipient: 'chat', text: 'hello' });

		expect(notifier.sent).toEqual([{ recipient: 'chat', text: 'hello' }]);
	});

	it('rejects a malformed message the way the real channel would', async () => {
		const notifier = new FakeNotifier();

		await expect(notifier.send({ recipient: '', text: 'hello' })).rejects.toThrow(NotifierError);
		await expect(notifier.send({ recipient: 'chat', text: '  ' })).rejects.toThrow(NotifierError);
		expect(notifier.sent).toHaveLength(0);
	});

	it('fails a fixed number of times on demand', async () => {
		const notifier = new FakeNotifier();
		notifier.failNext = 2;

		await expect(notifier.send({ recipient: 'chat', text: 'a' })).rejects.toThrow();
		await expect(notifier.send({ recipient: 'chat', text: 'b' })).rejects.toThrow();
		await notifier.send({ recipient: 'chat', text: 'c' });

		expect(notifier.sent).toHaveLength(1);
	});

	it('fails forever while the flag is on', async () => {
		const notifier = new FakeNotifier();
		notifier.failAlways = true;

		await expect(notifier.send({ recipient: 'chat', text: 'a' })).rejects.toThrow();

		notifier.reset();
		await notifier.send({ recipient: 'chat', text: 'a' });
		expect(notifier.sent).toHaveLength(1);
	});
});

describe('FakeStorage', () => {
	it('round-trips an object', async () => {
		const storage = new FakeStorage();
		const data = new Uint8Array([1, 2, 3]);

		const stored = await storage.put('key/one', data, 'image/png');

		expect(stored).toEqual({ key: 'key/one', sizeBytes: 3 });
		expect(await storage.exists('key/one')).toBe(true);
		expect(await storage.get('key/one')).toEqual(data);
	});

	it('reports a missing object instead of returning empty bytes', async () => {
		const storage = new FakeStorage();

		await expect(storage.get('nope')).rejects.toThrow(StorageError);
	});

	it('fails on demand and recovers after reset', async () => {
		const storage = new FakeStorage();
		storage.failNext = 1;

		await expect(storage.put('k', new Uint8Array([0]), 'image/png')).rejects.toThrow(StorageError);
		await storage.put('k', new Uint8Array([0]), 'image/png');

		storage.failAlways = true;
		await expect(storage.get('k')).rejects.toThrow(StorageError);

		storage.reset();
		expect(await storage.exists('k')).toBe(false);
	});
});
