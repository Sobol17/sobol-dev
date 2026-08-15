import { afterEach, describe, expect, it } from 'vitest';
import { jobs, leads } from '$lib/server/db/schema';
import { SqliteUnitOfWork } from '$lib/server/db/unit-of-work';
import { FixedClock } from '$lib/server/domain/clock';
import { LeadService } from '$lib/server/domain/lead.service';
import { RateLimitService } from '$lib/server/domain/rate-limit.service';
import { LeadRepository } from '$lib/server/repositories/lead.repository';
import type { JobQueue } from '$lib/types';
import { createTestDb, type TestDb } from '../helpers/db';
import { leadInput, requestMeta } from '../helpers/lead-slice';

let db: TestDb | null = null;

afterEach(() => {
	db?.drop();
	db = null;
});

/** Stands in for the queue when the test needs publication to fail. */
class BrokenQueue implements JobQueue {
	publish(): void {
		throw new Error('queue is down');
	}
}

function buildService(queue: JobQueue, handle: TestDb): LeadService {
	const clock = new FixedClock(new Date('2026-03-01T10:00:00.000Z'));
	return new LeadService(
		new LeadRepository(handle.db),
		queue,
		new SqliteUnitOfWork(handle.db),
		new RateLimitService(clock),
		clock
	);
}

describe('LeadService.submit on the error path', () => {
	it('leaves no lead behind when the job cannot be published', async () => {
		db = createTestDb();
		const leadService = buildService(new BrokenQueue(), db);

		await expect(leadService.submit(leadInput(), requestMeta())).rejects.toThrow('queue is down');

		// The insert and the job share one transaction: a failed publish rolls the lead back.
		expect(db.db.select().from(leads).all()).toHaveLength(0);
		expect(db.db.select().from(jobs).all()).toHaveLength(0);
	});

	it('fails loudly when the database is gone instead of reporting success', async () => {
		db = createTestDb();
		const leadService = buildService(new BrokenQueue(), db);
		db.close();

		await expect(leadService.submit(leadInput(), requestMeta())).rejects.toThrow();
	});
});
