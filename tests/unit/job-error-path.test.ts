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

function dispatchJob(slice: ReturnType<typeof createLeadSlice>) {
	return slice.db.db.select().from(jobs).where(eq(jobs.topic, TOPICS.OUTBOX_DISPATCH)).get();
}

describe('outbox.dispatch error path', () => {
	it('retries with backoff and leaves the message pending when telegram fails', async () => {
		slice = createLeadSlice();
		slice.notifier.failNext = 1;

		await slice.leads.submit(leadInput(), requestMeta());
		await slice.runner.drain();

		const job = dispatchJob(slice);
		expect(job?.status).toBe('pending');
		expect(job?.attempts).toBe(1);
		expect(job?.lastError).toContain('fake notifier failure');
		expect(job?.runAt.getTime()).toBeGreaterThan(slice.clock.now().getTime());

		const message = slice.db.db.select().from(outboxMessages).all()[0];
		expect(message?.status).toBe('pending');
		expect(message?.sentAt).toBeNull();
		expect(slice.notifier.sent).toHaveLength(0);
	});

	it('delivers on the retry once the channel recovers', async () => {
		slice = createLeadSlice();
		slice.notifier.failNext = 1;

		await slice.leads.submit(leadInput(), requestMeta());
		await slice.runner.drain();

		slice.clock.advance(60_000);
		await slice.runner.drain();

		expect(slice.notifier.sent).toHaveLength(1);
		expect(dispatchJob(slice)?.status).toBe('done');
		expect(slice.db.db.select().from(outboxMessages).all()[0]?.status).toBe('sent');
	});

	it('gives up after maxAttempts and records the reason', async () => {
		slice = createLeadSlice();
		slice.notifier.failAlways = true;

		await slice.leads.submit(leadInput(), requestMeta());

		// One drain per attempt: each failure schedules the next run in the future.
		for (let attempt = 0; attempt < 6; attempt += 1) {
			await slice.runner.drain();
			slice.clock.advance(2 * 60 * 60 * 1000);
		}

		const job = dispatchJob(slice);
		expect(job?.status).toBe('failed');
		expect(job?.attempts).toBe(5);
		expect(job?.lastError).toContain('fake notifier failure');
		expect(slice.notifier.sent).toHaveLength(0);
	});

	it('fails the job when no handler owns the topic', async () => {
		slice = createLeadSlice();
		slice.queue.publish(TOPICS.MEDIA_PROCESS, { mediaId: 'missing' });

		await slice.runner.drain();

		const job = slice.db.db.select().from(jobs).where(eq(jobs.topic, TOPICS.MEDIA_PROCESS)).get();
		expect(job?.status).toBe('pending');
		expect(job?.lastError).toContain('no handler registered');
	});
});
