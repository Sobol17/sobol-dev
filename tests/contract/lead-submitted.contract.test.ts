import { describe, expect, it, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { jobs, outboxMessages } from '$lib/server/db/schema';
import { TOPICS } from '$lib/server/queue/topics';
import { TEMPLATE_KEYS } from '$lib/server/clients/templates';
import { createLeadSlice, leadInput, OWNER_CHAT_ID, requestMeta } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

describe('lead.submitted contract', () => {
	it('publishes exactly one job with only the lead id and the agreed unique key', async () => {
		slice = createLeadSlice();

		const lead = await slice.leads.submit(leadInput(), requestMeta());

		const published = slice.db.db.select().from(jobs).all();
		expect(published).toHaveLength(1);
		expect(published[0]?.topic).toBe(TOPICS.LEAD_SUBMITTED);
		expect(published[0]?.payload).toEqual({ leadId: lead.id });
		expect(published[0]?.uniqueKey).toBe(`${TOPICS.LEAD_SUBMITTED}:${lead.id}`);
	});

	it('commits the lead and its job together', async () => {
		slice = createLeadSlice();

		await slice.leads.submit(leadInput(), requestMeta());

		const leadCount = slice.leadRepository.count();
		const jobCount = slice.db.db.select().from(jobs).all().length;
		expect([leadCount, jobCount]).toEqual([1, 1]);
	});

	it('produces an outbox message matching the telegram template contract', async () => {
		slice = createLeadSlice();
		const lead = await slice.leads.submit(leadInput(), requestMeta());

		await slice.runner.drain();

		const message = slice.db.db
			.select()
			.from(outboxMessages)
			.where(eq(outboxMessages.dedupeKey, `telegram:${TEMPLATE_KEYS.LEAD_NEW}:${lead.id}`))
			.get();

		expect(message).toBeDefined();
		expect(message?.channel).toBe('telegram');
		expect(message?.recipient).toBe(OWNER_CHAT_ID);
		// The fake validates the message shape and throws on anything malformed.
		expect(slice.notifier.sent).toHaveLength(1);
		expect(slice.notifier.sent[0]?.text).toContain(lead.publicId);
	});

	it('keeps spam out of the owner chat', async () => {
		slice = createLeadSlice();

		await slice.leads.submit(leadInput(), requestMeta({ honeypot: 'http://spam.example' }));
		await slice.runner.drain();

		expect(slice.db.db.select().from(outboxMessages).all()).toHaveLength(0);
		expect(slice.notifier.sent).toHaveLength(0);
	});
});
