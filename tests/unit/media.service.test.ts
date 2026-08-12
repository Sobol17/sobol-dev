import { afterEach, describe, expect, it } from 'vitest';
import { MediaError } from '$lib/server/domain/media.service';
import { MAX_UPLOAD_BYTES } from '$lib/utils/image-type';
import { createMediaSlice, jpegBytes, pngBytes } from '../helpers/media-slice';
import { projectInput } from '../helpers/project-slice';

let slice: ReturnType<typeof createMediaSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

describe('MediaService.upload', () => {
	it('stores the file under a random key and records it as pending', async () => {
		slice = createMediaSlice();

		const row = await slice.media.upload(pngBytes());

		expect(row.status).toBe('pending');
		expect(row.mime).toBe('image/png');
		expect(row.storageKey).toMatch(/^orig\/[0-9a-f]{32}\.png$/);
		expect(slice.storage.objects.has(row.storageKey)).toBe(true);
	});

	it('gives every upload its own key', async () => {
		slice = createMediaSlice();

		const first = await slice.media.upload(pngBytes());
		const second = await slice.media.upload(pngBytes());

		expect(first.storageKey).not.toBe(second.storageKey);
	});

	it('refuses a file that is not an image on the allowlist', async () => {
		slice = createMediaSlice();

		await expect(slice.media.upload(new Uint8Array([0x4d, 0x5a, 0x00]))).rejects.toThrow(
			MediaError
		);
		expect(slice.storage.objects.size).toBe(0);
		expect(slice.mediaRepository.list()).toHaveLength(0);
	});

	it('refuses a file over the size limit before touching storage', async () => {
		slice = createMediaSlice();

		const oversized = new Uint8Array(MAX_UPLOAD_BYTES + 1);
		oversized.set(pngBytes(0));

		await expect(slice.media.upload(oversized)).rejects.toMatchObject({ code: 'too_large' });
		expect(slice.storage.objects.size).toBe(0);
	});

	it('accepts jpeg as well as png', async () => {
		slice = createMediaSlice();

		const row = await slice.media.upload(jpegBytes());

		expect(row.mime).toBe('image/jpeg');
		expect(row.storageKey.endsWith('.jpg')).toBe(true);
	});
});

describe('MediaService gallery', () => {
	it('appends attachments in order and renumbers on reorder', async () => {
		slice = createMediaSlice();
		const project = slice.projects.create(projectInput());
		const first = await slice.media.upload(pngBytes());
		const second = await slice.media.upload(pngBytes());

		slice.media.attach(project.id, first.id);
		slice.media.attach(project.id, second.id);
		expect(slice.media.gallery(project.id).map((item) => item.id)).toEqual([first.id, second.id]);

		slice.media.reorderGallery(project.id, [second.id, first.id]);
		expect(slice.media.gallery(project.id).map((item) => item.id)).toEqual([second.id, first.id]);
	});

	it('ignores a repeated attach of the same image', async () => {
		slice = createMediaSlice();
		const project = slice.projects.create(projectInput());
		const image = await slice.media.upload(pngBytes());

		slice.media.attach(project.id, image.id);
		slice.media.attach(project.id, image.id);

		expect(slice.media.gallery(project.id)).toHaveLength(1);
	});

	it('detaches without deleting the image itself', async () => {
		slice = createMediaSlice();
		const project = slice.projects.create(projectInput());
		const image = await slice.media.upload(pngBytes());
		slice.media.attach(project.id, image.id);

		slice.media.detach(project.id, image.id);

		expect(slice.media.gallery(project.id)).toHaveLength(0);
		expect(slice.mediaRepository.findById(image.id)).toBeDefined();
	});

	it('counts how many cases use an image', async () => {
		slice = createMediaSlice();
		const first = slice.projects.create(projectInput({ title: 'A' }));
		const second = slice.projects.create(projectInput({ title: 'B' }));
		const image = await slice.media.upload(pngBytes());

		slice.media.attach(first.id, image.id);
		slice.media.attach(second.id, image.id);

		expect(slice.media.list()[0]?.usedBy).toBe(2);
	});

	it('drops the gallery link when the case goes away', async () => {
		slice = createMediaSlice();
		const project = slice.projects.create(projectInput());
		const image = await slice.media.upload(pngBytes());
		slice.media.attach(project.id, image.id);

		slice.projects.remove(project.id);

		expect(slice.media.gallery(project.id)).toHaveLength(0);
		expect(slice.mediaRepository.findById(image.id)).toBeDefined();
	});
});

describe('MediaService.remove', () => {
	it('deletes the row, the original and every variant', async () => {
		slice = createMediaSlice();
		const image = await slice.media.upload(pngBytes());
		await slice.runner.drain();

		const variants = slice.mediaRepository.findById(image.id)?.variants ?? [];
		expect(variants.length).toBeGreaterThan(0);

		await slice.media.remove(image.id);

		expect(slice.mediaRepository.findById(image.id)).toBeUndefined();
		expect(slice.storage.objects.size).toBe(0);
	});

	it('rejects an unknown id', async () => {
		slice = createMediaSlice();

		await expect(slice.media.remove(crypto.randomUUID())).rejects.toThrow(MediaError);
	});
});
