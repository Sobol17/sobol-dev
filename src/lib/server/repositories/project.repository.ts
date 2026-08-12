import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { projectTags, projects, techTags } from '../db/schema';
import type { ProjectCategory, PublishStatus } from '$lib/types';
import { slugify } from '$lib/utils/slug';

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
