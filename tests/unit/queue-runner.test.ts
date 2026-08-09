import { afterEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { jobs } from '$lib/server/db/schema';
import { createLogger } from '$lib/server/log';
import { FixedClock } from '$lib/server/domain/clock';
import { SqliteJobQueue } from '$lib/server/queue/queue';
import { JobRunner } from '$lib/server/queue/runner';
import { TOPICS } from '$lib/server/queue/topics';
import { createTestDb, type TestDb } from '../helpers/db';

let db: TestDb | null = null;

afterEach(() => {
	db?.drop();
	db = null;
});

function harness() {
	db = createTestDb();
	const clock = new FixedClock(new Date('2026-03-01T10:00:00.000Z'));
	const queue = new SqliteJobQueue(db.db, clock);
	return { db, clock, queue, log: createLogger('silent') };
}

describe('job queue', () => {
	it('drops a duplicate job while the first one is still open', () => {
		const { db: handle, queue } = harness();

		queue.publish(TOPICS.LEAD_SUBMITTED, { leadId: 'a' }, { uniqueKey: 'lead.submitted:a' });
		queue.publish(TOPICS.LEAD_SUBMITTED, { leadId: 'a' }, { uniqueKey: 'lead.submitted:a' });

		expect(handle.db.select().from(jobs).all()).toHaveLength(1);
	});

	it('allows the same unique key again once the first job finished', async () => {
		const { db: handle, clock, queue, log } = harness();
		const runner = new JobRunner(handle.db, { [TOPICS.MEDIA_GC]: () => {} }, log, {
			clock: () => clock.now()
		});

		queue.publish(TOPICS.MEDIA_GC, {}, { uniqueKey: 'media.gc:2026-03-01' });
		await runner.drain();
		queue.publish(TOPICS.MEDIA_GC, {}, { uniqueKey: 'media.gc:2026-03-01' });

		expect(handle.db.select().from(jobs).all()).toHaveLength(2);
	});

	it('publishes nothing when the surrounding transaction rolls back', () => {
		const { db: handle, queue } = harness();

		expect(() =>
			handle.db.transaction(() => {
				queue.publish(TOPICS.LEAD_SUBMITTED, { leadId: 'a' });
				throw new Error('business rule failed');
			})
		).toThrow('business rule failed');

		expect(handle.db.select().from(jobs).all()).toHaveLength(0);
	});
});

describe('job runner', () => {
	it('claims one job at a time and marks it done', async () => {
		const { db: handle, clock, queue, log } = harness();
		const seen: string[] = [];
		const runner = new JobRunner(
			handle.db,
			{ [TOPICS.MEDIA_GC]: (payload) => void seen.push(String(payload.tag)) },
			log,
			{ clock: () => clock.now() }
		);

		queue.publish(TOPICS.MEDIA_GC, { tag: 'first' }, { uniqueKey: 'gc:1' });
		queue.publish(TOPICS.MEDIA_GC, { tag: 'second' }, { uniqueKey: 'gc:2' });

		expect(await runner.tick()).toBe(true);
		expect(seen).toEqual(['first']);

		await runner.drain();
		expect(seen).toEqual(['first', 'second']);
		expect(
			handle.db
				.select()
				.from(jobs)
				.all()
				.every((job) => job.status === 'done')
		).toBe(true);
	});

	it('reports an empty queue instead of spinning', async () => {
		const { db: handle, clock, log } = harness();
		const runner = new JobRunner(handle.db, {}, log, { clock: () => clock.now() });

		expect(await runner.tick()).toBe(false);
	});

	it('grows the retry delay exponentially', async () => {
		const { db: handle, clock, queue, log } = harness();
		const runner = new JobRunner(
			handle.db,
			{
				[TOPICS.OUTBOX_DISPATCH]: () => {
					throw new Error('boom');
				}
			},
			log,
			{ clock: () => clock.now() }
		);

		queue.publish(TOPICS.OUTBOX_DISPATCH, { messageId: 'm' }, { uniqueKey: 'd:1' });

		const delays: number[] = [];
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await runner.drain();
			const row = handle.db.select().from(jobs).where(eq(jobs.uniqueKey, 'd:1')).get();
			delays.push((row?.runAt.getTime() ?? 0) - clock.now().getTime());
			clock.advance(2 * 60 * 60 * 1000);
		}

		expect(delays[1]).toBeGreaterThan(delays[0]!);
		expect(delays[2]).toBeGreaterThan(delays[1]!);
	});

	it('leaves a fresh active job alone and requeues an old one', () => {
		const { db: handle, clock, queue, log } = harness();
		const runner = new JobRunner(handle.db, {}, log, { clock: () => clock.now() });

		queue.publish(TOPICS.MEDIA_GC, {}, { uniqueKey: 'gc:stuck' });
		handle.db
			.update(jobs)
			.set({ status: 'active', startedAt: clock.now() })
			.where(eq(jobs.uniqueKey, 'gc:stuck'))
			.run();

		expect(runner.reapStuck()).toBe(0);

		clock.advance(11 * 60 * 1000);
		expect(runner.reapStuck()).toBe(1);
		expect(handle.db.select().from(jobs).get()?.status).toBe('pending');
	});

	it('stops the loop and leaves no timer behind', async () => {
		const { db: handle, clock, log } = harness();
		const runner = new JobRunner(handle.db, {}, log, {
			clock: () => clock.now(),
			pollIntervalMs: 5
		});

		runner.start();
		await vi.waitFor(() => expect(runner.openCount()).toBe(0));
		await runner.stop();
	});
});
