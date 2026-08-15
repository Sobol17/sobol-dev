import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { media, projectMedia, projectTags, projects, techTags } from '../db/schema';
import type { MediaRef, ProjectCard, ProjectCategory, PublishStatus } from '$lib/types';
import { slugify } from '$lib/utils/slug';
import { toMediaRef, type MediaRow } from './media.repository';

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;

/** Row of the admin table. The list never carries `body`: it is not drawn there. */
export interface AdminProjectListItem {
	id: string;
	slug: string;
	title: string;
	category: ProjectCategory;
	status: PublishStatus;
	featured: boolean;
	position: number;
	tags: string[];
	updatedAt: string;
}

export class ProjectRepository {
	constructor(private readonly db: Db) {}

	listAdmin(): AdminProjectListItem[] {
		const rows = this.db
			.select()
			.from(projects)
			.orderBy(asc(projects.position), desc(projects.createdAt))
			.all();

		const tags = this.tagNamesByProject(rows.map((row) => row.id));

		return rows.map((row) => ({
			id: row.id,
			slug: row.slug,
			title: row.title,
			category: row.category,
			status: row.status,
			featured: row.featured,
			position: row.position,
			tags: tags.get(row.id) ?? [],
			updatedAt: row.updatedAt.toISOString()
		}));
	}

	/**
	 * Public reads live here, not in a component: the `published` filter is part of the query
	 * and cannot be forgotten by whoever renders the list.
	 */
	listPublished(): ProjectCard[] {
		const rows = this.db
			.select({ project: projects, cover: media })
			.from(projects)
			.leftJoin(media, eq(media.id, projects.coverMediaId))
			.where(eq(projects.status, 'published'))
			.orderBy(asc(projects.position), desc(projects.publishedAt))
			.all();

		const tags = this.tagNamesByProject(rows.map((row) => row.project.id));
		return rows.map((row) => toCard(row.project, row.cover, tags.get(row.project.id) ?? []));
	}

	/** Cases picked for the landing. Position keeps the owner in charge of the order. */
	listFeatured(limit: number): ProjectCard[] {
		const rows = this.db
			.select({ project: projects, cover: media })
			.from(projects)
			.leftJoin(media, eq(media.id, projects.coverMediaId))
			.where(and(eq(projects.status, 'published'), eq(projects.featured, true)))
			.orderBy(asc(projects.position), desc(projects.publishedAt))
			.limit(limit)
			.all();

		const tags = this.tagNamesByProject(rows.map((row) => row.project.id));
		return rows.map((row) => toCard(row.project, row.cover, tags.get(row.project.id) ?? []));
	}

	findPublishedBySlug(slug: string): { project: ProjectRow; cover: MediaRef | null } | undefined {
		const row = this.db
			.select({ project: projects, cover: media })
			.from(projects)
			.leftJoin(media, eq(media.id, projects.coverMediaId))
			.where(and(eq(projects.slug, slug), eq(projects.status, 'published')))
			.get();
		if (!row) return undefined;

		return { project: row.project, cover: toPublicCover(row.cover) };
	}

	/** Sitemap input: published pages only, with the date crawlers use to schedule a revisit. */
	listPublishedForSitemap(): { slug: string; updatedAt: Date }[] {
		return this.db
			.select({ slug: projects.slug, updatedAt: projects.updatedAt })
			.from(projects)
			.where(eq(projects.status, 'published'))
			.orderBy(asc(projects.position))
			.all();
	}

	findById(id: string): ProjectRow | undefined {
		return this.db.select().from(projects).where(eq(projects.id, id)).get();
	}

	findBySlug(slug: string): ProjectRow | undefined {
		return this.db.select().from(projects).where(eq(projects.slug, slug)).get();
	}

	listSlugs(): string[] {
		return this.db
			.select({ slug: projects.slug })
			.from(projects)
			.all()
			.map((row) => row.slug);
	}

	insert(values: NewProjectRow): ProjectRow {
		const row = this.db.insert(projects).values(values).returning().get();
		if (!row) throw new Error('project insert returned no row');
		return row;
	}

	update(id: string, values: Partial<NewProjectRow>): ProjectRow | undefined {
		return this.db.update(projects).set(values).where(eq(projects.id, id)).returning().get();
	}

	remove(id: string): boolean {
		return (
			this.db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id }).get() !==
			undefined
		);
	}

	/**
	 * Conditional update: the caller states which statuses it is willing to move away from,
	 * so a double click cannot publish twice or resurrect a row somebody else changed.
	 */
	setStatus(
		id: string,
		from: PublishStatus[],
		to: PublishStatus,
		changes: { publishedAt?: Date | null; updatedAt: Date }
	): boolean {
		const row = this.db
			.update(projects)
			.set({ status: to, ...changes })
			.where(and(eq(projects.id, id), inArray(projects.status, from)))
			.returning({ id: projects.id })
			.get();
		return row !== undefined;
	}

	nextPosition(): number {
		const row = this.db
			.select({ max: sql<number | null>`max(${projects.position})` })
			.from(projects)
			.get();
		return (row?.max ?? -1) + 1;
	}

	setPosition(id: string, position: number, updatedAt: Date): void {
		this.db.update(projects).set({ position, updatedAt }).where(eq(projects.id, id)).run();
	}

	/** Returns tag ids for the given names, creating the ones that do not exist yet. */
	ensureTags(names: readonly string[]): string[] {
		return names.map((name) => {
			const slug = slugify(name);
			const existing = this.db.select().from(techTags).where(eq(techTags.slug, slug)).get();
			if (existing) return existing.id;

			const created = this.db.insert(techTags).values({ slug, name }).returning().get();
			if (!created) throw new Error(`tag insert returned no row: ${name}`);
			return created.id;
		});
	}

	replaceTags(projectId: string, tagIds: readonly string[]): void {
		this.db.delete(projectTags).where(eq(projectTags.projectId, projectId)).run();
		for (const tagId of tagIds) {
			this.db.insert(projectTags).values({ projectId, tagId }).run();
		}
	}

	tagNamesFor(projectId: string): string[] {
		return this.tagNamesByProject([projectId]).get(projectId) ?? [];
	}

	/** Gallery of a public case: processed images only, in the order the owner set. */
	publicGallery(projectId: string): PublicGalleryImage[] {
		return this.db
			.select({ media, caption: projectMedia.caption })
			.from(projectMedia)
			.innerJoin(media, eq(media.id, projectMedia.mediaId))
			.where(and(eq(projectMedia.projectId, projectId), eq(media.status, 'ready')))
			.orderBy(asc(projectMedia.position))
			.all()
			.map((row) => ({ ...toMediaRef(row.media), caption: row.caption }));
	}

	tagNamesByProject(projectIds: readonly string[]): Map<string, string[]> {
		const grouped = new Map<string, string[]>();
		if (projectIds.length === 0) return grouped;

		const rows = this.db
			.select({ projectId: projectTags.projectId, name: techTags.name })
			.from(projectTags)
			.innerJoin(techTags, eq(techTags.id, projectTags.tagId))
			.where(inArray(projectTags.projectId, [...projectIds]))
			.orderBy(asc(techTags.name))
			.all();

		for (const row of rows) {
			const names = grouped.get(row.projectId) ?? [];
			names.push(row.name);
			grouped.set(row.projectId, names);
		}
		return grouped;
	}
}

/** One image of a public case gallery. The caption belongs to the link, not to the file. */
export interface PublicGalleryImage extends MediaRef {
	caption: string | null;
}

function toCard(row: ProjectRow, cover: MediaRow | null, tags: string[]): ProjectCard {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		category: row.category,
		summary: row.summary,
		cover: toPublicCover(cover),
		tags,
		featured: row.featured
	};
}

/** A cover that has not been processed yet has no variants to render, so it counts as absent. */
function toPublicCover(cover: MediaRow | null): MediaRef | null {
	return cover && cover.status === 'ready' ? toMediaRef(cover) : null;
}
