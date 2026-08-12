import { describe, expect, it } from 'vitest';
import {
	ALLOWED_IMAGE_MIMES,
	detectImageMime,
	extensionFor,
	mimeForExtension
} from '$lib/utils/image-type';
import { jpegBytes, pngBytes } from '../helpers/media-slice';

function bytes(values: number[]): Uint8Array {
	return new Uint8Array(values);
}

function ascii(text: string): number[] {
	return [...text].map((char) => char.charCodeAt(0));
}

describe('detectImageMime', () => {
	it('reads the format from the signature', () => {
		expect(detectImageMime(pngBytes())).toBe('image/png');
		expect(detectImageMime(jpegBytes())).toBe('image/jpeg');
		expect(detectImageMime(bytes([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')]))).toBe(
			'image/webp'
		);
		expect(detectImageMime(bytes([0, 0, 0, 0, ...ascii('ftyp'), ...ascii('avif')]))).toBe(
			'image/avif'
		);
	});

	it('rejects anything that is not on the allowlist', () => {
		expect(detectImageMime(bytes(ascii('GIF89a')))).toBeNull();
		expect(detectImageMime(bytes([0x4d, 0x5a, 0x90, 0x00]))).toBeNull(); // windows executable
		expect(detectImageMime(bytes(ascii('<svg xmlns=')))).toBeNull();
	});

	it('does not trust a matching extension without the signature', () => {
		const renamed = bytes([0x50, 0x4b, 0x03, 0x04, ...ascii('payload.png')]);
		expect(detectImageMime(renamed)).toBeNull();
	});

	it('survives a file shorter than the signature it looks for', () => {
		expect(detectImageMime(bytes([0x89, 0x50]))).toBeNull();
		expect(detectImageMime(bytes([]))).toBeNull();
	});
});

describe('extension mapping', () => {
	it('round trips every allowed mime', () => {
		for (const mime of ALLOWED_IMAGE_MIMES) {
			expect(mimeForExtension(extensionFor(mime))).toBe(mime);
		}
	});

	it('refuses an extension outside the allowlist', () => {
		expect(mimeForExtension('svg')).toBeNull();
		expect(mimeForExtension('')).toBeNull();
	});
});
