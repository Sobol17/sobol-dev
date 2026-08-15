import type { ProjectInput } from '$lib/schemas/project';
import type { MediaRef, ProjectCard, ProjectCategory, ProjectMetric } from '$lib/types';
import { renderMarkdown } from '$lib/utils/markdown';
import { slugify, uniqueSlug } from '$lib/utils/slug';
import type { UnitOfWork } from '../db/unit-of-work';
import type {
	AdminProjectListItem,
	ProjectRepository,
	ProjectRow,
	PublicGalleryImage
} from '../repositories/project.repository';
import type { Clock } from './clock';

export type ProjectErrorCode = 'slug_taken' | 'not_found';

export class ProjectError extends Error {
	constructor(
		readonly code: ProjectErrorCode,
		message: string
	) {
		super(message);
		this.name = 'ProjectError';
	}
}

export interface ProjectDetails {
	project: ProjectRow;
	tags: string[];
}

/** Everything a public case page draws. `bodyHtml` is already sanitized markdown. */
export interface PublicCase {
	id: string;
	slug: string;
	title: string;
	category: ProjectCategory;
	summary: string;
	bodyHtml: string;
	clientName: string | null;
	roleText: string | null;
	year: number | null;
	durationWeeks: number | null;
	liveUrl: string | null;
	repoUrl: string | null;
	metrics: ProjectMetric[];
	tags: string[];
	cover: MediaRef | null;
	gallery: PublicGalleryImage[];
	publishedAt: string | null;
	updatedAt: string;
}

export interface SitemapEntry {
	path: string;
	updatedAt: string;
}

/** How many cases the landing shows. More than three stops reading as a selection. */
export const FEATURED_LIMIT = 3;

export class ProjectService {
	constructor(
		private readonly projects: ProjectRepository,
		private readonly uow: UnitOfWork,
		private readonly clock: Clock
	) {}

	list(): AdminProjectListItem[] {
		return this.projects.listAdmin();
	}

	/** Public list. Drafts and archived cases never leave the repository, so they cannot leak. */
	publicList(): ProjectCard[] {
		return this.projects.listPublished();
	}

	featured(limit = FEATURED_LIMIT): ProjectCard[] {
		return this.projects.listFeatured(limit);
	}

	publicCase(slug: string): PublicCase | undefined {
		const found = this.projects.findPublishedBySlug(slug);
		if (!found) return undefined;

		const { project, cover } = found;
		return {
			id: project.id,
			slug: project.slug,
			title: project.title,
			category: project.category,
			summary: project.summary,
			// Rendered here so the markup the browser receives went through the sanitizer once.
			bodyHtml: renderMarkdown(project.body),
			clientName: project.clientName,
			roleText: project.roleText,
			year: project.year,
			durationWeeks: project.durationWeeks,
			liveUrl: project.liveUrl,
			repoUrl: project.repoUrl,
			metrics: project.metrics,
			tags: this.projects.tagNamesFor(project.id),
			cover,
			gallery: this.projects.publicGallery(project.id),
			publishedAt: project.publishedAt?.toISOString() ?? null,
			updatedAt: project.updatedAt.toISOString()
		};
	}

	sitemapEntries(): SitemapEntry[] {
		return this.projects.listPublishedForSitemap().map((entry) => ({
			path: `/cases/${entry.slug}`,
			updatedAt: entry.updatedAt.toISOString()
		}));
	}

	get(id: string): ProjectDetails | undefined {
		const project = this.projects.findById(id);
		if (!project) return undefined;
		return { project, tags: this.projects.tagNamesFor(project.id) };
	}

	create(input: ProjectInput): ProjectRow {
		const now = this.clock.now();
		const slug = this.resolveSlug(input, null);

		return this.uow.transaction(() => {
			const project = this.projects.insert({
				slug,
				title: input.title,
				category: input.category,
				summary: input.summary,
				body: input.body,
				clientName: input.clientName ?? null,
				roleText: input.roleText ?? null,
				year: input.year ?? null,
				durationWeeks: input.durationWeeks ?? null,
				liveUrl: input.liveUrl ?? null,
				repoUrl: input.repoUrl ?? null,
				metrics: input.metrics,
				featured: input.featured,
				position: this.projects.nextPosition(),
				status: 'draft',
				createdAt: now,
				updatedAt: now
			});

			this.projects.replaceTags(project.id, this.projects.ensureTags(input.tags));
			return project;
		});
	}

	update(id: string, input: ProjectInput): ProjectRow {
		const current = this.projects.findById(id);
		if (!current) throw new ProjectError('not_found', `project ${id} does not exist`);

		const now = this.clock.now();
		const slug = this.resolveSlug(input, current);

		return this.uow.transaction(() => {
			const project = this.projects.update(id, {
				slug,
				title: input.title,
				category: input.category,
				summary: input.summary,
				body: input.body,
				clientName: input.clientName ?? null,
				roleText: input.roleText ?? null,
				year: input.year ?? null,
				durationWeeks: input.durationWeeks ?? null,
				liveUrl: input.liveUrl ?? null,
				repoUrl: input.repoUrl ?? null,
				metrics: input.metrics,
				featured: input.featured,
				updatedAt: now
			});
			if (!project) throw new ProjectError('not_found', `project ${id} does not exist`);

			this.projects.replaceTags(project.id, this.projects.ensureTags(input.tags));
			return project;
		});
	}

	/** Publishing keeps the first publication date: it drives ordering and sitemap output. */
	publish(id: string): boolean {
		const current = this.projects.findById(id);
		if (!current) throw new ProjectError('not_found', `project ${id} does not exist`);

		const now = this.clock.now();
		return this.projects.setStatus(id, ['draft', 'archived'], 'published', {
			publishedAt: current.publishedAt ?? now,
			updatedAt: now
		});
	}

	unpublish(id: string): boolean {
		return this.projects.setStatus(id, ['published'], 'draft', { updatedAt: this.clock.now() });
	}

	remove(id: string): boolean {
		return this.projects.remove(id);
	}

	/** The cover is one image out of the gallery. Passing null takes the cover off. */
	setCover(id: string, mediaId: string | null): void {
		const updated = this.projects.update(id, {
			coverMediaId: mediaId,
			updatedAt: this.clock.now()
		});
		if (!updated) throw new ProjectError('not_found', `project ${id} does not exist`);
	}

	/** Drag and drop sends the whole order. Positions are rewritten in one transaction. */
	reorder(ids: readonly string[]): void {
		const now = this.clock.now();
		this.uow.transaction(() => {
			ids.forEach((id, index) => this.projects.setPosition(id, index, now));
		});
	}

	/**
	 * An empty slug field means "derive it from the title" and gets a numeric suffix on a
	 * collision. A slug the owner typed is taken literally, so a collision is an error they
	 * can see and fix instead of a silently renamed page.
	 */
	private resolveSlug(input: ProjectInput, current: ProjectRow | null): string {
		const taken = new Set(this.projects.listSlugs());
		if (current) taken.delete(current.slug);

		if (input.slug === undefined) return uniqueSlug(input.title, taken);

		const slug = slugify(input.slug);
		if (taken.has(slug)) throw new ProjectError('slug_taken', `slug ${slug} is already used`);
		return slug;
	}
}
