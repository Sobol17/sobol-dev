import { afterEach, describe, expect, it } from 'vitest';
import { jobs, outboxMessages } from '$lib/server/db/schema';
import { createLeadSlice, leadInput, requestMeta } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice>;
afterEach(() => slice?.dispose());

describe('v6 synchronous submission', () => {
	it('persists the submission and attribution without jobs or notifications', async () => {
		slice = createLeadSlice();
		const lead = await slice.leads.submit(leadInput({ utm: { source: 'direct' } }), requestMeta());
		expect(slice.leads.detail(lead.id).lead).toMatchObject({
			publicId: lead.publicId,
			status: 'new',
			utm: { source: 'direct' }
		});
		expect(slice.db.db.select().from(jobs).all()).toEqual([]);
		expect(slice.db.db.select().from(outboxMessages).all()).toEqual([]);
	});

	it('preserves historical pending jobs and outbox rows without resuming them', async () => {
		slice = createLeadSlice();
		slice.db.db
			.insert(jobs)
			.values({
				topic: 'lead.submitted',
				payload: { leadId: 'old' },
				runAt: slice.clock.now(),
				status: 'active'
			})
			.run();
		slice.db.db
			.insert(outboxMessages)
			.values({
				channel: 'telegram',
				templateKey: 'lead.new',
				recipient: 'old-owner',
				payload: {},
				dedupeKey: 'legacy'
			})
			.run();
		const beforeJobs = slice.db.db.select().from(jobs).all();
		const beforeOutbox = slice.db.db.select().from(outboxMessages).all();
		const lead = await slice.leads.submit(leadInput(), requestMeta());
		slice.leads.changeStatus(lead.id, 'qualifying');
		expect(slice.db.db.select().from(jobs).all()).toEqual(beforeJobs);
		expect(slice.db.db.select().from(outboxMessages).all()).toEqual(beforeOutbox);
	});
});
