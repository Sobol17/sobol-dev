import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from '$lib/utils/slug';

describe('slugify', () => {
	it('always returns a non-empty url-safe slug', () => {
		fc.assert(
			fc.property(fc.string({ maxLength: 300 }), (title) => {
				const slug = slugify(title);
				expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
				expect(slug.length).toBeGreaterThan(0);
				expect(slug.length).toBeLessThanOrEqual(80);
			})
		);
	});

	it('is stable when applied twice', () => {
		fc.assert(
			fc.property(fc.string({ maxLength: 300 }), (title) => {
				expect(slugify(slugify(title))).toBe(slugify(title));
			})
		);
	});

	it('transliterates cyrillic instead of dropping it', () => {
		expect(slugify('Магазин фермерских продуктов')).toBe(
			'magazin fermerskih produktov'.replace(/ /g, '-')
		);
	});
});

describe('uniqueSlug', () => {
	it('never returns a slug that is already taken', () => {
		fc.assert(
			fc.property(
				fc.string({ maxLength: 100 }),
				fc.array(fc.string({ maxLength: 100 }), { maxLength: 20 }),
				(title, others) => {
					const taken = new Set(others.map(slugify));
					const slug = uniqueSlug(title, taken);
					expect(taken.has(slug)).toBe(false);
					expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
				}
			)
		);
	});

	it('adds the smallest free numeric suffix', () => {
		const taken = new Set(['kanso', 'kanso-2']);
		expect(uniqueSlug('Kanso', taken)).toBe('kanso-3');
	});
});
