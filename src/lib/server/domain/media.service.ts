import type { JobQueue } from '$lib/types';
import { MAX_UPLOAD_BYTES, detectImageMime } from '$lib/utils/image-type';
import type { Storage } from '../clients/storage';
import type { UnitOfWork } from '../db/unit-of-work';
import { TOPICS } from '../queue/topics';
import type {
	GalleryItem,
	MediaListItem,
	MediaRepository,
	MediaRow
} from '../repositories/media.repository';
import type { Clock } from './clock';
import { originalKey, variantKey } from './media-keys';
import { VARIANT_FORMATS, VARIANT_WIDTHS } from '../clients/image-processor';

export type MediaErrorCode = 'too_large' | 'unsupported_type' | 'not_found';

export class MediaError extends Error {
	constructor(
		readonly code: MediaErrorCode,
		message: string
	) {
		super(message);
		this.name = 'MediaError';
	}
}

export class MediaService {
	constructor(
		private readonly media: MediaRepository,
		private readonly storage: Storage,
		private readonly queue: JobQueue,
		private readonly uow: UnitOfWork,
		private readonly clock: Clock
	) {}

	/**
	 * Stores the bytes, then records them and schedules processing in one transaction.
	 * The write to storage happens first and outside the transaction on purpose: it is slow
	 * I/O, and a file without a row is swept later by `media.gc`, while a row without a file
	 * would break every page that renders it.
	 */
	async upload(bytes: Uint8Array): Promise<MediaRow> {
		if (bytes.byteLength > MAX_UPLOAD_BYTES) {
			throw new MediaError('too_large', `upload exceeds ${MAX_UPLOAD_BYTES} bytes`);
		}

		const mime = detectImageMime(bytes);
		if (!mime) throw new MediaError('unsupported_type', 'file is not a supported image');

		const key = originalKey(mime);
		await this.storage.put(key, bytes, mime);

		return this.uow.transaction(() => {
			const row = this.media.insert({
				storageKey: key,
				mime,
				sizeBytes: bytes.byteLength,
				status: 'pending',
				createdAt: this.clock.now()
			});

			this.queue.publish(
				TOPICS.MEDIA_PROCESS,
				{ mediaId: row.id },
				{ uniqueKey: `${TOPICS.MEDIA_PROCESS}:${row.id}` }
			);

			return row;
		});
	}

	list(): MediaListItem[] {
		return this.media.list();
	}

	gallery(projectId: string): GalleryItem[] {
		return this.media.galleryFor(projectId);
	}

	setAlt(id: string, alt: string): void {
		if (!this.media.setAlt(id, alt === '' ? null : alt)) {
			throw new MediaError('not_found', `media ${id} does not exist`);
		}
	}

	attach(projectId: string, mediaId: string): void {
		this.media.attach(projectId, mediaId);
	}

	detach(projectId: string, mediaId: string): void {
		this.media.detach(projectId, mediaId);
	}

	reorderGallery(projectId: string, mediaIds: readonly string[]): void {
		this.uow.transaction(() => this.media.setGalleryPositions(projectId, mediaIds));
	}

	/** Drops the row first: leftover files are cheap, a dangling reference is not. */
	async remove(id: string): Promise<void> {
		const row = this.media.remove(id);
		if (!row) throw new MediaError('not_found', `media ${id} does not exist`);

		for (const key of [row.storageKey, ...row.variants.map((variant) => variant.key)]) {
			await this.storage.delete(key);
		}
	}

	/** Keys the processing job is expected to produce. Used by the job and by its tests. */
	expectedVariantKeys(storageKey: string): string[] {
		return VARIANT_WIDTHS.flatMap((width) =>
			VARIANT_FORMATS.map((format) => variantKey(storageKey, width, format))
		);
	}
}
