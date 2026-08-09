export const TOPICS = {
	LEAD_SUBMITTED: 'lead.submitted',
	MEDIA_PROCESS: 'media.process',
	OUTBOX_DISPATCH: 'outbox.dispatch',
	MEDIA_GC: 'media.gc'
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

/** Retry budget and first backoff step per topic, straight from the queue contract. */
export const TOPIC_POLICY: Record<Topic, { maxAttempts: number; backoffBaseMs: number }> = {
	[TOPICS.LEAD_SUBMITTED]: { maxAttempts: 5, backoffBaseMs: 15_000 },
	[TOPICS.MEDIA_PROCESS]: { maxAttempts: 3, backoffBaseMs: 30_000 },
	[TOPICS.OUTBOX_DISPATCH]: { maxAttempts: 5, backoffBaseMs: 30_000 },
	[TOPICS.MEDIA_GC]: { maxAttempts: 1, backoffBaseMs: 60_000 }
};
