import type { MediaProcessPayload, MediaVariant } from '$lib/types';
import {
	ImageDecodeError,
	VARIANT_FORMATS,
	VARIANT_WIDTHS,
	type ImageProcessor
} from '../../clients/image-processor';
import type { Storage } from '../../clients/storage';
import { variantKey } from '../../domain/media-keys';
import type { MediaRepository, MediaRow } from '../../repositories/media.repository';
import type { JobHandler } from '../runner';

export interface MediaProcessDeps {
	media: MediaRepository;
	storage: Storage;
	images: ImageProcessor;
}

/**
 * Builds the responsive variants and the blurhash for one upload.
 *
 * Idempotent: a media row that is already `ready` with all its files in storage is skipped,
 * and the final write is a conditional update, so a rerun cannot double the variant list.
 * Encoding runs outside any transaction because it is slow and SQLite has one writer.
 */
export function mediaProcessHandler(deps: MediaProcessDeps): JobHandler {
	return async (payload) => {
		const { mediaId } = payload as unknown as MediaProcessPayload;

		const row = deps.media.findById(mediaId);
		if (!row) return; // deleted while the job waited: nothing to process

		if (await isComplete(deps, row)) return;

		const original = await deps.storage.get(row.storageKey);

		let dimensions: { width: number; height: number };
		let variants: MediaVariant[];
		let blurhash: string;

		try {
			dimensions = await deps.images.dimensions(original);
			variants = await buildVariants(deps, row.storageKey, original, dimensions.width);
			blurhash = await deps.images.blurhash(original);
		} catch (error) {
			// A file that cannot be decoded will not decode on the next attempt either.
			if (error instanceof ImageDecodeError) {
				deps.media.markFailed(mediaId);
				return;
			}
			throw error;
		}

		deps.media.markReady(mediaId, { ...dimensions, blurhash, variants });
	};
}

async function buildVariants(
	deps: MediaProcessDeps,
	storageKey: string,
	original: Uint8Array,
	originalWidth: number
): Promise<MediaVariant[]> {
	// Never upscale: a 500px screenshot rendered at 1600 is a blurry, heavier file.
	const widths = VARIANT_WIDTHS.filter((width) => width <= originalWidth);
	const targets = widths.length > 0 ? widths : [Math.min(originalWidth, VARIANT_WIDTHS[0])];

	const variants: MediaVariant[] = [];
	for (const width of targets) {
		for (const format of VARIANT_FORMATS) {
			const key = variantKey(storageKey, width, format);
			const data = await deps.images.resize(original, width, format);
			await deps.storage.put(key, data, `image/${format}`);
			variants.push({ key, width, format });
		}
	}
	return variants;
}

/** Ready means the row says so and every file it points at is still in storage. */
async function isComplete(deps: MediaProcessDeps, row: MediaRow): Promise<boolean> {
	if (row.status !== 'ready' || row.variants.length === 0) return false;

	for (const variant of row.variants) {
		if (!(await deps.storage.exists(variant.key))) return false;
	}
	return true;
}
