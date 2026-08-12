import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	MAX_METRICS,
	MAX_METRIC_PART_LENGTH,
	MAX_TAGS,
	MAX_TAG_LENGTH,
	formatMetricLines,
	formatTagList,
	parseMetricLines,
	parseTagList
} from '$lib/utils/project';
import { slugify } from '$lib/utils/slug';

describe('parseTagList', () => {
	it('never returns blanks, duplicates by slug or more tags than allowed', () => {
		fc.assert(
			fc.property(fc.string({ maxLength: 400 }), (raw) => {
				const tags = parseTagList(raw);
				const slugs = tags.map(slugify);

				expect(tags.length).toBeLessThanOrEqual(MAX_TAGS);
				expect(new Set(slugs).size).toBe(slugs.length);
				for (const tag of tags) {
					expect(tag).toBe(tag.trim());
					expect(tag.length).toBeGreaterThan(0);
					expect(tag.length).toBeLessThanOrEqual(MAX_TAG_LENGTH);
				}
			})
		);
	});

	it('survives the round trip through the editor field', () => {
		fc.assert(
			fc.property(fc.string({ maxLength: 400 }), (raw) => {
				const tags = parseTagList(raw);
				expect(parseTagList(formatTagList(tags))).toEqual(tags);
			})
		);
	});
});

describe('parseMetricLines', () => {
	it('keeps every metric within the stored shape', () => {
		fc.assert(
			fc.property(fc.string({ maxLength: 400 }), (raw) => {
				const metrics = parseMetricLines(raw);

				expect(metrics.length).toBeLessThanOrEqual(MAX_METRICS);
				for (const metric of metrics) {
					expect(metric.label.length).toBeGreaterThan(0);
					expect(metric.value.length).toBeGreaterThan(0);
					expect(metric.label.length).toBeLessThanOrEqual(MAX_METRIC_PART_LENGTH);
					expect(metric.value.length).toBeLessThanOrEqual(MAX_METRIC_PART_LENGTH);
				}
			})
		);
	});

	it('survives the round trip through the editor field', () => {
		fc.assert(
			fc.property(fc.string({ maxLength: 400 }), (raw) => {
				const metrics = parseMetricLines(raw);
				expect(parseMetricLines(formatMetricLines(metrics))).toEqual(metrics);
			})
		);
	});
});
