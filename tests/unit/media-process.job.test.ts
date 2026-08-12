import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { jobs } from '$lib/server/db/schema';
import { VARIANT_FORMATS, VARIANT_WIDTHS } from '$lib/server/clients/image-processor';
import { StorageError } from '$lib/server/clients/storage';
import { TOPICS } from '$lib/server/queue/topics';
import { createMediaSlice, pngBytes } from '../helpers/media-slice';

let slice: ReturnType<typeof createMediaSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

const VARIANT_COUNT = VARIANT_WIDTHS.length * VARIANT_FORMATS.length;

describe('media.process', () => {
	it('produces every width in every format and marks the row ready', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());

		await slice.runner.drain();

		const row = slice.mediaRepository.findById(image.id);
		expect(row?.status).toBe('ready');
		expect(row?.width).toBe(2000);
		expect(row?.height).toBe(1200);
		expect(row?.blurhash).toBeTruthy();
		expect(row?.variants).toHaveLength(VARIANT_COUNT);
		expect(slice.storage.objects.size).toBe(VARIANT_COUNT + 1);
	});

	it('runs twice without producing a second set of variants', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());

		const handler = slice.handlers[TOPICS.MEDIA_PROCESS]!;
		const job = slice.db.db.select().from(jobs).all()[0]!;
		await handler({ mediaId: image.id }, job);
		await handler({ mediaId: image.id }, job);

		const row = slice.mediaRepository.findById(image.id);
		expect(row?.variants).toHaveLength(VARIANT_COUNT);
		expect(slice.images.calls).toHaveLength(VARIANT_COUNT);
		expect(slice.storage.objects.size).toBe(VARIANT_COUNT + 1);
	});

	it('redoes the work after a job was requeued from active', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());

		// Process, then lose a variant file the way a half-finished run would.
		await slice.runner.drain();
		const missing = slice.mediaRepository.findById(image.id)!.variants[0]!;
		slice.storage.objects.delete(missing.key);

		slice.db.db
			.update(jobs)
			.set({ status: 'pending', startedAt: null, finishedAt: null })
			.where(eq(jobs.topic, TOPICS.MEDIA_PROCESS))
			.run();
		await slice.runner.drain();

		expect(slice.storage.objects.has(missing.key)).toBe(true);
		expect(slice.mediaRepository.findById(image.id)?.variants).toHaveLength(VARIANT_COUNT);
	});

	it('marks a file that cannot be decoded as failed and does not retry it', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());
		slice.images.decodeFails = true;

		await slice.runner.drain();

		expect(slice.mediaRepository.findById(image.id)?.status).toBe('failed');
		const job = slice.db.db.select().from(jobs).all()[0];
		expect(job?.status).toBe('done');
		expect(job?.attempts).toBe(1);
	});

	it('retries when storage is the thing that failed', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());
		slice.storage.failNext = 1;

		await slice.runner.drain();

		const job = slice.db.db.select().from(jobs).all()[0];
		expect(job?.status).toBe('pending');
		expect(job?.lastError).toContain('fake storage failure');
		expect(slice.mediaRepository.findById(image.id)?.status).toBe('pending');

		// The next attempt finds storage healthy again and completes the work.
		slice.clock.advance(60_000);
		await slice.runner.drain();
		expect(slice.mediaRepository.findById(image.id)?.status).toBe('ready');
	});

	it('does nothing when the image was deleted while the job waited', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());
		await slice.media.remove(image.id);

		await slice.runner.drain();

		const job = slice.db.db.select().from(jobs).all()[0];
		expect(job?.status).toBe('done');
	});

	it('reports a storage failure as a storage error, not as a decode failure', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());
		slice.storage.failAlways = true;

		const handler = slice.handlers[TOPICS.MEDIA_PROCESS]!;
		const job = slice.db.db.select().from(jobs).all()[0]!;

		await expect(handler({ mediaId: image.id }, job)).rejects.toThrow(StorageError);
		expect(slice.mediaRepository.findById(image.id)?.status).toBe('pending');
	});
});
