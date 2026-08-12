import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ImageDecodeError } from '$lib/server/clients/image-processor';
import { SharpImageProcessor } from '$lib/server/clients/image-processor.sharp';

const processor = new SharpImageProcessor();

async function samplePng(width = 120, height = 90): Promise<Uint8Array> {
	const buffer = await sharp({
		create: { width, height, channels: 3, background: { r: 200, g: 60, b: 40 } }
	})
		.png()
		.toBuffer();
	return new Uint8Array(buffer);
}

describe('SharpImageProcessor', () => {
	it('reads the real dimensions', async () => {
		expect(await processor.dimensions(await samplePng())).toEqual({ width: 120, height: 90 });
	});

	it('encodes both delivery formats without enlarging the source', async () => {
		const original = await samplePng();
		// AVIF rides in a HEIF container, which is what sharp reports back for it.
		const containers = { webp: 'webp', avif: 'heif' } as const;

		for (const format of ['webp', 'avif'] as const) {
			const resized = await processor.resize(original, 400, format);
			const meta = await sharp(resized).metadata();

			expect(meta.format).toBe(containers[format]);
			expect(meta.width).toBe(120);
		}
	});

	it('returns a blurhash the decoder side can read', async () => {
		const hash = await processor.blurhash(await samplePng());

		expect(hash.length).toBeGreaterThan(6);
		expect(hash).toMatch(/^[\w#$%*+,\-.:;=?@[\]^{|}~]+$/);
	});

	it('reports a file that is not an image as a decode error', async () => {
		const junk = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);

		await expect(processor.dimensions(junk)).rejects.toThrow(ImageDecodeError);
	});
});
