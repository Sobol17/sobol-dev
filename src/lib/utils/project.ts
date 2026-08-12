import type { ProjectMetric } from '$lib/types';
import { slugify } from './slug';

export const MAX_TAGS = 12;
export const MAX_TAG_LENGTH = 40;
export const MAX_METRICS = 6;
export const MAX_METRIC_PART_LENGTH = 40;

/**
 * The editor types tags as one comma-separated line. Deduplication runs on the slug, so
 * `Node.js` and `node js` cannot become two tags pointing at the same slug in `tech_tags`.
 */
export function parseTagList(raw: string): string[] {
	const seen = new Set<string>();
	const tags: string[] = [];

	for (const part of raw.split(',')) {
		const name = part.trim().slice(0, MAX_TAG_LENGTH);
		if (name === '') continue;

		const key = slugify(name);
		if (seen.has(key)) continue;

		seen.add(key);
		tags.push(name);
		if (tags.length === MAX_TAGS) break;
	}

	return tags;
}

export function formatTagList(tags: readonly string[]): string {
	return tags.join(', ');
}

/** One metric per line, `label: value`. A line without both halves is dropped, not rejected. */
export function parseMetricLines(raw: string): ProjectMetric[] {
	const metrics: ProjectMetric[] = [];

	for (const line of raw.split('\n')) {
		const separator = line.indexOf(':');
		if (separator === -1) continue;

		const label = line.slice(0, separator).trim().slice(0, MAX_METRIC_PART_LENGTH);
		const value = line
			.slice(separator + 1)
			.trim()
			.slice(0, MAX_METRIC_PART_LENGTH);
		if (label === '' || value === '') continue;

		metrics.push({ label, value });
		if (metrics.length === MAX_METRICS) break;
	}

	return metrics;
}

export function formatMetricLines(metrics: readonly ProjectMetric[]): string {
	return metrics.map((metric) => `${metric.label}: ${metric.value}`).join('\n');
}
