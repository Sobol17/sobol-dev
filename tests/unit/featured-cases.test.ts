import { afterEach, describe, expect, it } from 'vitest';
import { FEATURED_LIMIT } from '$lib/server/domain/project.service';
import { createProjectSlice, projectInput } from '../helpers/project-slice';

let slice: ReturnType<typeof createProjectSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

/** Creates a case and takes it to the state the landing selection cares about. */
function makeCase(
	instance: NonNullable<typeof slice>,
	title: string,
	options: { featured: boolean; published: boolean }
): string {
	const project = instance.projects.create(projectInput({ title, featured: options.featured }));
	if (options.published) instance.projects.publish(project.id);
	return project.id;
}

describe('featured cases on the landing', () => {
	it('takes published cases marked as featured and nothing else', () => {
		slice = createProjectSlice();
		makeCase(slice, 'Избранный', { featured: true, published: true });
		makeCase(slice, 'Обычный', { featured: false, published: true });
		makeCase(slice, 'Черновик избранного', { featured: true, published: false });

		const featured = slice.projects.featured();

		expect(featured.map((card) => card.title)).toEqual(['Избранный']);
	});

	it('follows the order the owner set by dragging', () => {
		slice = createProjectSlice();
		const first = makeCase(slice, 'Первый', { featured: true, published: true });
		const second = makeCase(slice, 'Второй', { featured: true, published: true });

		slice.projects.reorder([second, first]);

		expect(slice.projects.featured().map((card) => card.title)).toEqual(['Второй', 'Первый']);
	});

	it('never returns more cases than the landing has room for', () => {
		slice = createProjectSlice();
		for (let index = 0; index < FEATURED_LIMIT + 2; index += 1) {
			makeCase(slice, `Кейс ${index}`, { featured: true, published: true });
		}

		expect(slice.projects.featured()).toHaveLength(FEATURED_LIMIT);
		expect(slice.projects.featured(2)).toHaveLength(2);
	});
});
