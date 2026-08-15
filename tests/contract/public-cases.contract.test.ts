import { afterEach, describe, expect, it } from 'vitest';
import { media, projectMedia } from '$lib/server/db/schema';
import type { MediaStatus, MediaVariant } from '$lib/types';
import { createProjectSlice, projectInput } from '../helpers/project-slice';

let slice: ReturnType<typeof createProjectSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

const VARIANTS: MediaVariant[] = [
	{ key: 'ab/cd/shot-400.webp', width: 400, format: 'webp' },
	{ key: 'ab/cd/shot-800.webp', width: 800, format: 'webp' },
	{ key: 'ab/cd/shot-800.avif', width: 800, format: 'avif' }
];

function insertImage(
	db: NonNullable<typeof slice>['db'],
	storageKey: string,
	status: MediaStatus
): string {
	const row = db.db
		.insert(media)
		.values({
			storageKey,
			mime: 'image/webp',
			sizeBytes: 1024,
			width: 1600,
			height: 900,
			alt: 'Скриншот',
			blurhash: 'LEHV6nWB2yk8',
			variants: status === 'ready' ? VARIANTS : [],
			status
		})
		.returning()
		.get();
	if (!row) throw new Error('media insert returned no row');
	return row.id;
}

describe('public case reads', () => {
	it('keeps a draft out of the list, the case page and the sitemap', () => {
		slice = createProjectSlice();
		const draft = slice.projects.create(projectInput({ title: 'Скрытый кейс' }));

		expect(slice.projects.publicList()).toHaveLength(0);
		expect(slice.projects.publicCase(draft.slug)).toBeUndefined();
		expect(slice.projects.sitemapEntries()).toHaveLength(0);
	});

	it('exposes a case once it is published and hides it again on unpublish', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput({ title: 'Панель дилера' }));

		slice.projects.publish(project.id);
		expect(slice.projects.publicList().map((card) => card.slug)).toEqual([project.slug]);
		expect(slice.projects.sitemapEntries()).toEqual([
			{ path: `/cases/${project.slug}`, updatedAt: slice.clock.now().toISOString() }
		]);

		slice.projects.unpublish(project.id);
		expect(slice.projects.publicList()).toHaveLength(0);
		expect(slice.projects.publicCase(project.slug)).toBeUndefined();
	});

	it('renders the case body as sanitized markdown', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(
			projectInput({ body: '## Задача\n\n<script>alert(1)</script> и текст' })
		);
		slice.projects.publish(project.id);

		const published = slice.projects.publicCase(project.slug);

		expect(published?.bodyHtml).toContain('<h2>Задача</h2>');
		expect(published?.bodyHtml).not.toContain('<script>');
	});

	it('treats a cover that is still processing as no cover at all', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput());
		const pending = insertImage(slice.db, 'ab/cd/pending.webp', 'pending');
		slice.projects.setCover(project.id, pending);
		slice.projects.publish(project.id);

		expect(slice.projects.publicList()[0]?.cover).toBeNull();
		expect(slice.projects.publicCase(project.slug)?.cover).toBeNull();
	});

	it('serves the cover with its variants once processing finished', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput());
		const ready = insertImage(slice.db, 'ab/cd/ready.webp', 'ready');
		slice.projects.setCover(project.id, ready);
		slice.projects.publish(project.id);

		const card = slice.projects.publicList()[0];

		expect(card?.cover?.id).toBe(ready);
		expect(card?.cover?.variants).toEqual(VARIANTS);
	});

	it('shows gallery images in order and skips the ones that are not ready', () => {
		slice = createProjectSlice();
		const project = slice.projects.create(projectInput());
		const first = insertImage(slice.db, 'ab/cd/one.webp', 'ready');
		const second = insertImage(slice.db, 'ab/cd/two.webp', 'ready');
		const broken = insertImage(slice.db, 'ab/cd/broken.webp', 'failed');

		slice.db.db
			.insert(projectMedia)
			.values([
				{ projectId: project.id, mediaId: second, position: 0, caption: 'Экран заказа' },
				{ projectId: project.id, mediaId: first, position: 1, caption: null },
				{ projectId: project.id, mediaId: broken, position: 2, caption: null }
			])
			.run();
		slice.projects.publish(project.id);

		const gallery = slice.projects.publicCase(project.slug)?.gallery ?? [];

		expect(gallery.map((image) => image.id)).toEqual([second, first]);
		expect(gallery[0]?.caption).toBe('Экран заказа');
	});
});
