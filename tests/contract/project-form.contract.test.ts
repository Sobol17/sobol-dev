import * as v from 'valibot';
import { afterEach, describe, expect, it } from 'vitest';
import { projectInputSchema, projectUpdateSchema } from '$lib/schemas/project';
import { createProjectSlice } from '../helpers/project-slice';

let slice: ReturnType<typeof createProjectSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

/** What a browser posts: every value is a string, unchecked boxes are simply absent. */
function formPost(overrides: Record<string, string> = {}): Record<string, string> {
	return {
		title: 'Miracle',
		slug: '',
		category: 'web',
		summary: 'Лендинг и вейтлист для торговой платформы: собрать заявки до запуска.',
		body: '## Задача\n\nКоманда выходила на рынок и хотела набрать базу до релиза.',
		clientName: '',
		roleText: '',
		year: '',
		durationWeeks: '',
		liveUrl: '',
		repoUrl: '',
		tags: '',
		metrics: '',
		...overrides
	};
}

describe('project form contract', () => {
	it('turns the posted strings into the shape the service stores', () => {
		slice = createProjectSlice();

		const input = v.parse(
			projectInputSchema,
			formPost({
				year: '2026',
				durationWeeks: '2',
				tags: 'SvelteKit, TypeScript, sveltekit',
				metrics: 'Конверсия: +18%\nбез двоеточия\nСрок: 6 недель',
				featured: 'on'
			})
		);
		const project = slice.projects.create(input);

		expect(project.year).toBe(2026);
		expect(project.durationWeeks).toBe(2);
		expect(project.featured).toBe(true);
		expect(project.metrics).toEqual([
			{ label: 'Конверсия', value: '+18%' },
			{ label: 'Срок', value: '6 недель' }
		]);
		expect(slice.repository.tagNamesFor(project.id)).toEqual(['SvelteKit', 'TypeScript']);
	});

	it('never lets the browser set a server-owned field', () => {
		slice = createProjectSlice();

		const input = v.parse(
			projectInputSchema,
			formPost({
				id: 'forged-id',
				status: 'published',
				position: '99',
				publishedAt: '2020-01-01'
			})
		);
		const project = slice.projects.create(input);

		expect(Object.keys(input)).not.toContain('status');
		expect(project.id).not.toBe('forged-id');
		expect(project.status).toBe('draft');
		expect(project.position).toBe(0);
		expect(project.publishedAt).toBeNull();
	});

	it('reads an empty optional field as absent, not as an empty value', () => {
		slice = createProjectSlice();

		const input = v.parse(projectInputSchema, formPost());
		const project = slice.projects.create(input);

		expect(project.clientName).toBeNull();
		expect(project.year).toBeNull();
		expect(project.liveUrl).toBeNull();
		expect(project.metrics).toEqual([]);
	});

	it('rejects a malformed field with an issue on that field', () => {
		const result = v.safeParse(
			projectInputSchema,
			formPost({ slug: 'Не Слаг', liveUrl: 'not-a-url', year: '1200' })
		);

		expect(result.success).toBe(false);
		const fields = result.issues?.map((issue) => v.getDotPath(issue));
		expect(fields).toEqual(expect.arrayContaining(['slug', 'liveUrl', 'year']));
	});

	it('requires an id when the editor saves an existing case', () => {
		expect(v.safeParse(projectUpdateSchema, formPost()).success).toBe(false);
		expect(
			v.safeParse(projectUpdateSchema, { ...formPost(), id: crypto.randomUUID() }).success
		).toBe(true);
	});

	it('hands the admin table a row without the case body', () => {
		slice = createProjectSlice();
		const input = v.parse(projectInputSchema, formPost({ tags: 'Flutter' }));
		slice.projects.create(input);

		const [row] = slice.projects.list();

		expect(row).toMatchObject({
			title: 'Miracle',
			slug: 'miracle',
			category: 'web',
			status: 'draft',
			featured: false,
			position: 0,
			tags: ['Flutter']
		});
		expect(row).not.toHaveProperty('body');
		expect(typeof row?.updatedAt).toBe('string');
	});
});
