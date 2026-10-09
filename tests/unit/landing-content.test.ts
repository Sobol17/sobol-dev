import { expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CASES, LABELS } from '../../src/routes/(public)/landing-content';
it('publishes labelled concepts with complete scope and responsive local covers', () => {
	expect(CASES.length).toBeGreaterThan(0);
	expect(LABELS.casesIntro).toContain('не клиентские кейсы');
	for (const item of CASES) {
		for (const value of [item.task, item.scenario, item.role, item.outcome, item.cover.alt])
			expect(value.trim().length).toBeGreaterThan(10);
		expect(item.cover.width).toBeGreaterThan(0);
		expect(item.cover.height).toBeGreaterThan(0);
		expect(existsSync(join('static', item.cover.src))).toBe(true);
		for (const srcset of [item.cover.avif, item.cover.webp]) {
			const variants = srcset.split(',').map((entry) => entry.trim().split(' '));
			expect(variants.map((entry) => entry[1])).toEqual(['480w', '800w', '1200w']);
			for (const [file] of variants) expect(existsSync(join('static', file))).toBe(true);
		}
	}
});
