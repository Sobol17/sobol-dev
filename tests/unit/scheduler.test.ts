import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { jobs } from '$lib/server/db/schema';
import { FixedClock } from '$lib/server/domain/clock';
import { createLogger } from '$lib/server/log';
import { SqliteJobQueue } from '$lib/server/queue/queue';
import { JobScheduler } from '$lib/server/queue/scheduler';
import { TOPICS } from '$lib/server/queue/topics';
import { createTestDb, type TestDb } from '../helpers/db';

let db: TestDb | null = null;

afterEach(() => {
	db?.drop();
	db = null;
});

function harness(now: string) {
	db = createTestDb();
	const clock = new FixedClock(new Date(now));
	const queue = new SqliteJobQueue(db.db, clock);
	const scheduler = new JobScheduler(queue, createLogger('silent'), () => clock.now());
	return { db, clock, scheduler };
}

const gcJobs = (handle: TestDb) =>
	handle.db.select().from(jobs).where(eq(jobs.topic, TOPICS.MEDIA_GC)).all();

describe('JobScheduler', () => {
	it('queues one daily job no matter how often it runs', () => {
		const { db: handle, scheduler } = harness('2026-03-01T10:00:00.000Z');

		scheduler.scheduleDaily();
		scheduler.scheduleDaily();
		scheduler.scheduleDaily();

		expect(gcJobs(handle)).toHaveLength(1);
	});

	it('keys the job by date so the next day gets its own', () => {
		const { db: handle, clock, scheduler } = harness('2026-03-01T10:00:00.000Z');

		scheduler.scheduleDaily();
		clock.advance(24 * 60 * 60 * 1000);
		scheduler.scheduleDaily();

		const keys = gcJobs(handle).map((job) => job.uniqueKey);
		expect(keys).toEqual([`${TOPICS.MEDIA_GC}:2026-03-01`, `${TOPICS.MEDIA_GC}:2026-03-02`]);
	});

	it('runs at 03:00 UTC on the next day when that hour already passed', () => {
		const { db: handle, scheduler } = harness('2026-03-01T10:00:00.000Z');

		scheduler.scheduleDaily();

		expect(gcJobs(handle)[0]?.runAt.toISOString()).toBe('2026-03-02T03:00:00.000Z');
	});

	it('runs at 03:00 UTC today when the hour is still ahead', () => {
		const { db: handle, scheduler } = harness('2026-03-01T01:00:00.000Z');

		scheduler.scheduleDaily();

		expect(gcJobs(handle)[0]?.runAt.toISOString()).toBe('2026-03-01T03:00:00.000Z');
	});
});
