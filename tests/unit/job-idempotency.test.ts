import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { jobs, outboxMessages } from '$lib/server/db/schema';
import { TOPICS } from '$lib/server/queue/topics';
import { createLeadSlice, leadInput, requestMeta } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

describe('lead.submitted handler is idempotent', () => {
	it('creates one outbox message when run twice with the same payload', async () => {
		slice = createLeadSlice();
		const lead = await slice.leads.submit(leadInput(), requestMeta());
		const handler = slice.handlers[TOPICS.LEAD_SUBMITTED]!;
		const job = slice.db.db.select().from(jobs).all()[0]!;

		await handler({ leadId: lead.id }, job);
		await handler({ leadId: lead.id }, job);

		expect(slice.db.db.select().from(outboxMessages).all()).toHaveLength(1);
	});

	it('survives a job that hung in active and got requeued', async () => {
		slice = createLeadSlice();
		const lead = await slice.leads.submit(leadInput(), requestMeta());

		// First pass claims the job and does the work.
		await slice.runner.drain();

		// Simulate a process that died after the work but before marking the job done.
		slice.db.db
			.update(jobs)
			.set({ status: 'active', startedAt: new Date(slice.clock.now().getTime() - 20 * 60 * 1000) })
			.where(eq(jobs.topic, TOPICS.LEAD_SUBMITTED))
			.run();

		expect(slice.runner.reapStuck()).toBe(1);
		await slice.runner.drain();

		expect(slice.db.db.select().from(outboxMessages).all()).toHaveLength(1);
		expect(slice.notifier.sent).toHaveLength(1);
		expect(slice.leadRepository.findById(lead.id)?.status).toBe('new');
	});
});

describe('outbox.dispatch handler is idempotent', () => {
	it('sends once even when the job runs twice', async () => {
		slice = createLeadSlice();
		await slice.leads.submit(leadInput(), requestMeta());
		await slice.runner.drain();

		const message = slice.db.db.select().from(outboxMessages).all()[0]!;
		const handler = slice.handlers[TOPICS.OUTBOX_DISPATCH]!;
		const job = slice.db.db.select().from(jobs).all()[0]!;

		await handler({ messageId: message.id }, job);

		expect(slice.notifier.sent).toHaveLength(1);
	});

	it('does not double-send after a requeue from active', async () => {
		slice = createLeadSlice();
		await slice.leads.submit(leadInput(), requestMeta());
		await slice.runner.drain();

		slice.db.db
			.update(jobs)
			.set({
				status: 'active',
				startedAt: new Date(slice.clock.now().getTime() - 20 * 60 * 1000)
			})
			.where(eq(jobs.topic, TOPICS.OUTBOX_DISPATCH))
			.run();

		slice.runner.reapStuck();
		await slice.runner.drain();

		expect(slice.notifier.sent).toHaveLength(1);
	});
});
