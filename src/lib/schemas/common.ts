import * as v from 'valibot';

/**
 * Without JS an untouched input still posts an empty string. Map it to `undefined`
 * so an omitted optional field never reads as a malformed value.
 */
export function blankable<TOutput>(schema: v.GenericSchema<string, TOutput>) {
	return v.pipe(
		v.optional(v.string(), ''),
		v.trim(),
		v.transform((value): string | undefined => (value === '' ? undefined : value)),
		v.union([v.undefined_(), schema])
	);
}

/** Number inputs post strings. An empty one means "not filled", not zero. */
export function blankableInt(min: number, max: number) {
	return v.pipe(
		v.optional(v.string(), ''),
		v.trim(),
		v.transform((value): number | undefined => (value === '' ? undefined : Number(value))),
		v.union([v.undefined_(), v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(max))])
	);
}

/** A checkbox posts `on` when checked and nothing at all when it is not. */
export const checkboxFlag = v.pipe(
	v.optional(v.literal('on')),
	v.transform((value) => value === 'on')
);

/** Ids travel in hidden fields and command arguments. They are always UUID v4 from the database. */
export const idSchema = v.pipe(v.string(), v.uuid());
