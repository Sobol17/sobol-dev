import * as v from 'valibot';
import { parseMetricLines, parseTagList } from '$lib/utils/project';
import { blankable, blankableInt, checkboxFlag, idSchema } from './common';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * One schema for the create and the edit form. The slug stays optional: an empty field
 * means "derive it from the title", a filled one means the owner picked it deliberately.
 */
export const projectInputSchema = v.object({
	title: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
	slug: blankable(v.pipe(v.string(), v.regex(SLUG_PATTERN), v.maxLength(80))),
	category: v.picklist(['web', 'mobile', 'tma']),
	summary: v.pipe(v.string(), v.trim(), v.minLength(20), v.maxLength(300)),
	body: v.pipe(v.string(), v.trim(), v.minLength(20), v.maxLength(20000)),
	clientName: blankable(v.pipe(v.string(), v.maxLength(120))),
	roleText: blankable(v.pipe(v.string(), v.maxLength(200))),
	year: blankableInt(2000, 2100),
	durationWeeks: blankableInt(1, 260),
	liveUrl: blankable(v.pipe(v.string(), v.url(), v.maxLength(500))),
	repoUrl: blankable(v.pipe(v.string(), v.url(), v.maxLength(500))),
	tags: v.pipe(v.optional(v.string(), ''), v.maxLength(500), v.transform(parseTagList)),
	metrics: v.pipe(v.optional(v.string(), ''), v.maxLength(2000), v.transform(parseMetricLines)),
	featured: checkboxFlag
});

export type ProjectInput = v.InferOutput<typeof projectInputSchema>;

/** Editing posts the id alongside the fields. The route re-checks that the row exists. */
export const projectUpdateSchema = v.object({
	...projectInputSchema.entries,
	id: idSchema
});

export const projectIdSchema = v.object({ id: idSchema });

export const projectOrderSchema = v.object({
	ids: v.pipe(v.array(idSchema), v.minLength(1), v.maxLength(500))
});
