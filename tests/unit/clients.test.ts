import { describe, expect, it } from 'vitest';
import { FakeNotifier } from '$lib/server/clients/notifier.fake';
import { NotifierError } from '$lib/server/clients/notifier';

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
