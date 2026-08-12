import { afterEach, describe, expect, it } from 'vitest';
import { ProjectError } from '$lib/server/domain/project.service';
import { createProjectSlice, projectInput } from '../helpers/project-slice';

let slice: ReturnType<typeof createProjectSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

describe('ProjectService.create', () => {
	it('stores a new case as a draft at the end of the order', () => {
		slice = createProjectSlice();

		const first = slice.projects.create(projectInput({ title: 'Miracle' }));
		const second = slice.projects.create(projectInput({ title: 'Kanso' }));

		expect(first.status).toBe('draft');
		expect(first.publishedAt).toBeNull();
		expect([first.position, second.position]).toEqual([0, 1]);
	});

	it('derives the slug from the title and adds a suffix on a collision', () => {
		slice = createProjectSlice();

		const first = slice.projects.create(projectInput({ title: 'Магазин фермеров' }));
		const second = slice.projects.create(projectInput({ title: 'Магазин фермеров' }));

		expect(first.slug).toBe('magazin-fermerov');
		expect(second.slug).toBe('magazin-fermerov-2');
	});

	it('creates tags once and reuses them for the next case', () => {
		slice = createProjectSlice();

		slice.projects.create(projectInput({ title: 'A', tags: ['SvelteKit', 'TypeScript'] }));
		const second = slice.projects.create(projectInput({ title: 'B', tags: ['sveltekit'] }));

		expect(slice.repository.tagNamesFor(second.id)).toEqual(['SvelteKit']);
	});

	it('keeps metrics as typed pairs', () => {
		slice = createProjectSlice();

		const project = slice.projects.create(
			projectInput({ metrics: [{ label: 'Конверсия', value: '+18%' }] })
		);

		expect(slice.repository.findById(project.id)?.metrics).toEqual([
			{ label: 'Конверсия', value: '+18%' }
		]);
	});
});

describe('ProjectService.update', () => {
	it('keeps the slug the owner typed and leaves position untouched', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput({ title: 'Miracle' }));

		const updated = slice.projects.update(
			project.id,
			projectInput({ title: 'Miracle 2', slug: 'miracle-x', tags: ['Flutter'] })
		);

		expect(updated.slug).toBe('miracle-x');
		expect(updated.position).toBe(project.position);
		expect(slice.repository.tagNamesFor(project.id)).toEqual(['Flutter']);
	});

	it('accepts the case keeping its own slug', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput({ title: 'Miracle' }));

		const updated = slice.projects.update(
			project.id,
			projectInput({ title: 'Miracle', slug: project.slug })
		);

		expect(updated.slug).toBe(project.slug);
	});

	it('refuses a slug that belongs to another case and writes nothing', () => {
		slice = createProjectSlice();
		slice.projects.create(projectInput({ title: 'Kanso' }));
		const project = slice.projects.create(projectInput({ title: 'Miracle' }));

		expect(() =>
			slice!.projects.update(project.id, projectInput({ title: 'Miracle', slug: 'kanso' }))
		).toThrow(ProjectError);
		expect(slice.repository.findById(project.id)?.title).toBe('Miracle');
		expect(slice.repository.findById(project.id)?.slug).toBe('miracle');
	});

	it('rejects an unknown id', () => {
		slice = createProjectSlice();

		expect(() => slice!.projects.update(crypto.randomUUID(), projectInput())).toThrow(ProjectError);
	});
});

describe('ProjectService publication', () => {
	it('publishes a draft and stamps the publication date once', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput());

		expect(slice.projects.publish(project.id)).toBe(true);
		const published = slice.repository.findById(project.id);
		expect(published?.status).toBe('published');
		expect(published?.publishedAt).toEqual(slice.clock.now());

		slice.clock.advance(60_000);
		slice.projects.unpublish(project.id);
		slice.projects.publish(project.id);

		expect(slice.repository.findById(project.id)?.publishedAt).toEqual(published?.publishedAt);
	});

	it('ignores a second publish of an already published case', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput());
		slice.projects.publish(project.id);

		expect(slice.projects.publish(project.id)).toBe(false);
	});

	it('unpublishes only what is published', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput());

		expect(slice.projects.unpublish(project.id)).toBe(false);

		slice.projects.publish(project.id);
		expect(slice.projects.unpublish(project.id)).toBe(true);
		expect(slice.repository.findById(project.id)?.status).toBe('draft');
	});
});

describe('ProjectService ordering and removal', () => {
	it('rewrites positions in the order it was given', () => {
		slice = createProjectSlice();
		const first = slice.projects.create(projectInput({ title: 'A' }));
		const second = slice.projects.create(projectInput({ title: 'B' }));
		const third = slice.projects.create(projectInput({ title: 'C' }));

		slice.projects.reorder([third.id, first.id, second.id]);

		expect(slice.projects.list().map((item) => item.title)).toEqual(['C', 'A', 'B']);
	});

	it('drops the case together with its tag links', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput({ tags: ['Flutter'] }));

		expect(slice.projects.remove(project.id)).toBe(true);
		expect(slice.projects.get(project.id)).toBeUndefined();
		expect(slice.repository.tagNamesFor(project.id)).toEqual([]);
	});
});
