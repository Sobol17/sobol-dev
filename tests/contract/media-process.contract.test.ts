import * as v from 'valibot';
import { afterEach, describe, expect, it } from 'vitest';
import { jobs } from '$lib/server/db/schema';
import { VARIANT_FORMATS, VARIANT_WIDTHS } from '$lib/server/clients/image-processor';
import { TOPICS, TOPIC_POLICY } from '$lib/server/queue/topics';
import { storageKeySchema } from '$lib/schemas/media';
import { toMediaRef } from '$lib/server/repositories/media.repository';
import { createMediaSlice, pngBytes } from '../helpers/media-slice';

let slice: ReturnType<typeof createMediaSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

describe('media.process contract', () => {
	it('publishes one job carrying only the media id', async () => {
		slice = createMediaSlice();

		const image = await slice.media.upload(pngBytes());

		const published = slice.db.db.select().from(jobs).all();
		expect(published).toHaveLength(1);
		expect(published[0]?.topic).toBe(TOPICS.MEDIA_PROCESS);
		expect(published[0]?.payload).toEqual({ mediaId: image.id });
		expect(published[0]?.uniqueKey).toBe(`${TOPICS.MEDIA_PROCESS}:${image.id}`);
		expect(published[0]?.maxAttempts).toBe(TOPIC_POLICY[TOPICS.MEDIA_PROCESS].maxAttempts);
	});

	it('commits the media row and its job together', async () => {
		slice = createMediaSlice();

		await slice.media.upload(pngBytes());

		expect(slice.mediaRepository.list()).toHaveLength(1);
		expect(slice.db.db.select().from(jobs).all()).toHaveLength(1);
	});

	it('writes variants in the shape the public gallery reads', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());

		await slice.runner.drain();

		const ref = toMediaRef(slice.mediaRepository.findById(image.id)!);
		expect(ref).toMatchObject({ id: image.id, width: 2000, height: 1200 });
		expect(typeof ref.blurhash).toBe('string');

		for (const variant of ref.variants) {
			expect(VARIANT_WIDTHS).toContain(variant.width);
			expect(VARIANT_FORMATS).toContain(variant.format);
			expect(v.safeParse(storageKeySchema, variant.key).success).toBe(true);
			expect(variant.key.endsWith(`-${variant.width}.${variant.format}`)).toBe(true);
		}
	});

	it('keeps the storage key inside the shape the serving route accepts', async () => {
		slice = createMediaSlice();

		const image = await slice.media.upload(pngBytes());

		expect(v.safeParse(storageKeySchema, image.storageKey).success).toBe(true);
		expect(v.safeParse(storageKeySchema, '../../etc/passwd').success).toBe(false);
		expect(v.safeParse(storageKeySchema, 'orig/../secret.png').success).toBe(false);
	});

	it('never upscales past the original width', async () => {
		slice = createMediaSlice();
		slice.images.size = { width: 500, height: 400 };
		const image = await slice.media.upload(pngBytes());

		await slice.runner.drain();

		const widths = slice.mediaRepository.findById(image.id)?.variants.map((one) => one.width) ?? [];
		expect(new Set(widths)).toEqual(new Set([400]));
	});
});
