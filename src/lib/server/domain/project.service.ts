import type { ProjectInput } from '$lib/schemas/project';
import { slugify, uniqueSlug } from '$lib/utils/slug';
import type { UnitOfWork } from '../db/unit-of-work';
import type {
	AdminProjectListItem,
	ProjectRepository,
	ProjectRow
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

export class ProjectService {
	constructor(
		private readonly projects: ProjectRepository,
		private readonly uow: UnitOfWork,
		private readonly clock: Clock
	) {}

	list(): AdminProjectListItem[] {
		return this.projects.listAdmin();
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
