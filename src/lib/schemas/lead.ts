import * as v from 'valibot';
import { blankable, idSchema } from './common';

/** Also parses the `type` query parameter the landing puts on its call to action. */
export const leadTypeSchema = v.picklist(['web', 'mobile', 'tma', 'other']);

export const leadInputSchema = v.pipe(
	v.object({
		type: leadTypeSchema,
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

export const leadStatusSchema = v.picklist([
	'new',
	'qualifying',
	'proposal_sent',
	'won',
	'lost',
	'spam'
]);

export const leadListSchema = v.object({
	view: v.optional(v.picklist(['active', 'spam']), 'active'),
	status: v.optional(v.union([v.literal(''), leadStatusSchema]), ''),
	type: v.optional(v.union([v.literal(''), leadTypeSchema]), ''),
	search: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120)), ''),
	page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1_000_000)), 1)
});

export const leadStatusChangeSchema = v.object({ id: idSchema, status: leadStatusSchema });
export const leadNoteSchema = v.object({
	id: idSchema,
	body: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4000))
});
