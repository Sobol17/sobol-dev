import sharp from 'sharp';
import { encode } from 'blurhash';
import {
	ImageDecodeError,
	type ImageDimensions,
	type ImageProcessor,
	type VariantFormat
} from './image-processor';

const BLURHASH_SIZE = 32;
const BLURHASH_COMPONENTS = 4;
const QUALITY: Record<VariantFormat, number> = { webp: 82, avif: 55 };

/**
 * Runs outside any transaction: encoding a large image takes seconds and SQLite has a
 * single writer, so holding a transaction here would stall every web request.
 */
export class SharpImageProcessor implements ImageProcessor {
	async dimensions(data: Uint8Array): Promise<ImageDimensions> {
		try {
			const meta = await sharp(data).metadata();
			if (!meta.width || !meta.height) throw new ImageDecodeError('image has no dimensions');
			return { width: meta.width, height: meta.height };
		} catch (error) {
			throw asDecodeError(error);
		}
	}

	async resize(data: Uint8Array, width: number, format: VariantFormat): Promise<Uint8Array> {
		try {
			const buffer = await sharp(data)
				.rotate()
				.resize({ width, withoutEnlargement: true })
				.toFormat(format, { quality: QUALITY[format] })
				.toBuffer();
			return new Uint8Array(buffer);
		} catch (error) {
			throw asDecodeError(error);
		}
	}

	async blurhash(data: Uint8Array): Promise<string> {
		try {
			const { data: pixels, info } = await sharp(data)
				.raw()
				.ensureAlpha()
				.resize(BLURHASH_SIZE, BLURHASH_SIZE, { fit: 'inside' })
				.toBuffer({ resolveWithObject: true });

			return encode(
				new Uint8ClampedArray(pixels),
				info.width,
				info.height,
				BLURHASH_COMPONENTS,
				BLURHASH_COMPONENTS
			);
		} catch (error) {
			throw asDecodeError(error);
		}
	}
}

function asDecodeError(error: unknown): Error {
	if (error instanceof ImageDecodeError) return error;
	return new ImageDecodeError(error instanceof Error ? error.message : String(error));
}
