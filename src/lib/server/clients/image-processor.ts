import type { MediaVariant } from '$lib/types';

export interface ImageDimensions {
	width: number;
	height: number;
}

export type VariantFormat = MediaVariant['format'];

/** Widths the public gallery asks for. Anything wider than the original is skipped. */
export const VARIANT_WIDTHS = [400, 800, 1600] as const;
export const VARIANT_FORMATS: VariantFormat[] = ['webp', 'avif'];

export interface ImageProcessor {
	dimensions(data: Uint8Array): Promise<ImageDimensions>;
	resize(data: Uint8Array, width: number, format: VariantFormat): Promise<Uint8Array>;
	/** Compact placeholder rendered while the real image loads. */
	blurhash(data: Uint8Array): Promise<string>;
}

/** Raised when the bytes are not a decodable image. Reprocessing cannot fix that, so no retry. */
export class ImageDecodeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImageDecodeError';
	}
}
