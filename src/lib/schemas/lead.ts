import * as v from 'valibot';

/**
 * Without JS an untouched input still posts an empty string. Map it to `undefined`
 * so an omitted optional field never reads as a malformed value.
 */
function blankable<TOutput>(schema: v.GenericSchema<string, TOutput>) {
	return v.pipe(
		v.optional(v.string(), ''),
		v.trim(),
		v.transform((value): string | undefined => (value === '' ? undefined : value)),
		v.union([v.undefined_(), schema])
	);
}

export const leadInputSchema = v.pipe(
	v.object({
		type: v.picklist(['web', 'mobile', 'tma', 'other']),
		goal: v.pipe(v.string(), v.trim(), v.minLength(20), v.maxLength(2000)),
		budget: v.picklist(['under_3k', '3k_10k', '10k_30k', 'over_30k', 'unknown']),
		timeline: v.picklist(['asap', 'under_1m', '1_3m', 'over_3m', 'unknown']),
		contactName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
		contactEmail: blankable(v.pipe(v.string(), v.email(), v.maxLength(255))),
		contactTelegram: blankable(v.pipe(v.string(), v.regex(/^@?[a-zA-Z0-9_]{4,32}$/))),
		website: v.optional(v.literal('')) // honeypot, must stay empty
	}),
	// At least one contact channel is required.
	v.forward(
		v.check((i) => Boolean(i.contactEmail || i.contactTelegram), 'contact_required'),
		['contactEmail']
	)
);

export type LeadInputSchema = v.InferOutput<typeof leadInputSchema>;

/** UTM arrives from the query string, never from the request body. */
export const utmSchema = v.object({
	source: v.optional(v.pipe(v.string(), v.maxLength(120))),
	medium: v.optional(v.pipe(v.string(), v.maxLength(120))),
	campaign: v.optional(v.pipe(v.string(), v.maxLength(120))),
	content: v.optional(v.pipe(v.string(), v.maxLength(120))),
	term: v.optional(v.pipe(v.string(), v.maxLength(120)))
});
