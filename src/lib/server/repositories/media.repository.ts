import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { media, projectMedia } from '../db/schema';
import type { MediaRef, MediaStatus, MediaVariant } from '$lib/types';

export type MediaRow = typeof media.$inferSelect;
export type NewMediaRow = typeof media.$inferInsert;

export interface MediaListItem extends MediaRef {
	storageKey: string;
	mime: string;
	status: MediaStatus;
	sizeBytes: number;
	usedBy: number;
	createdAt: string;
}

export interface GalleryItem extends MediaRef {
	storageKey: string;
	status: MediaStatus;
	position: number;
	caption: string | null;
}

export interface ReadyPatch {
	width: number;
	height: number;
	blurhash: string;
	variants: MediaVariant[];
}

export class MediaRepository {
	constructor(private readonly db: Db) {}

	insert(values: NewMediaRow): MediaRow {
		const row = this.db.insert(media).values(values).returning().get();
		if (!row) throw new Error('media insert returned no row');
		return row;
	}

	findById(id: string): MediaRow | undefined {
		return this.db.select().from(media).where(eq(media.id, id)).get();
	}

	list(limit = 200): MediaListItem[] {
		const usage = new Map(
			this.db
				.select({ mediaId: projectMedia.mediaId, count: sql<number>`count(*)` })
				.from(projectMedia)
				.groupBy(projectMedia.mediaId)
				.all()
				.map((row) => [row.mediaId, row.count])
		);

		return this.db
			.select()
			.from(media)
			.orderBy(desc(media.createdAt))
			.limit(limit)
			.all()
			.map((row) => ({
				...toMediaRef(row),
				storageKey: row.storageKey,
				mime: row.mime,
				status: row.status,
				sizeBytes: row.sizeBytes,
				usedBy: usage.get(row.id) ?? 0,
				createdAt: row.createdAt.toISOString()
			}));
	}

	/**
	 * Conditional update: a job that runs twice finds the row already ready and writes nothing,
	 * so a retry cannot produce a second set of variants.
	 */
	markReady(id: string, patch: ReadyPatch): boolean {
		const row = this.db
			.update(media)
			.set({ ...patch, status: 'ready' })
			.where(and(eq(media.id, id), ne(media.status, 'ready')))
			.returning({ id: media.id })
			.get();
		return row !== undefined;
	}

	markFailed(id: string): boolean {
		const row = this.db
			.update(media)
			.set({ status: 'failed' })
			.where(and(eq(media.id, id), ne(media.status, 'ready')))
			.returning({ id: media.id })
			.get();
		return row !== undefined;
	}

	setAlt(id: string, alt: string | null): boolean {
		return (
			this.db.update(media).set({ alt }).where(eq(media.id, id)).returning().get() !== undefined
		);
	}

	/** Returns the deleted row so the caller can drop the files it points at. */
	remove(id: string): MediaRow | undefined {
		return this.db.delete(media).where(eq(media.id, id)).returning().get();
	}

	attach(projectId: string, mediaId: string): void {
		this.db
			.insert(projectMedia)
			.values({ projectId, mediaId, position: this.nextGalleryPosition(projectId) })
			.onConflictDoNothing()
			.run();
	}

	detach(projectId: string, mediaId: string): void {
		this.db
			.delete(projectMedia)
			.where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.mediaId, mediaId)))
			.run();
	}

	galleryFor(projectId: string): GalleryItem[] {
		return this.db
			.select({ media, position: projectMedia.position, caption: projectMedia.caption })
			.from(projectMedia)
			.innerJoin(media, eq(media.id, projectMedia.mediaId))
			.where(eq(projectMedia.projectId, projectId))
			.orderBy(asc(projectMedia.position))
			.all()
			.map((row) => ({
				...toMediaRef(row.media),
				storageKey: row.media.storageKey,
				status: row.media.status,
				position: row.position,
				caption: row.caption
			}));
	}

	setGalleryPositions(projectId: string, mediaIds: readonly string[]): void {
		mediaIds.forEach((mediaId, index) => {
			this.db
				.update(projectMedia)
				.set({ position: index })
				.where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.mediaId, mediaId)))
				.run();
		});
	}

	private nextGalleryPosition(projectId: string): number {
		const row = this.db
			.select({ max: sql<number | null>`max(${projectMedia.position})` })
			.from(projectMedia)
			.where(eq(projectMedia.projectId, projectId))
			.get();
		return (row?.max ?? -1) + 1;
	}
}

export function toMediaRef(row: MediaRow): MediaRef {
	return {
		id: row.id,
		alt: row.alt,
		width: row.width,
		height: row.height,
		blurhash: row.blurhash,
		variants: row.variants
	};
}
