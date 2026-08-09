import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { jobs } from '../db/schema';
import type { JobQueue, PublishOptions } from '$lib/types';
import type { Clock } from '../domain/clock';
import { systemClock } from '../domain/clock';
import { TOPIC_POLICY, type Topic } from './topics';

/**
 * Queue backed by the `jobs` table of the same database file.
 *
 * `publish` is synchronous on purpose: better-sqlite3 transactions live on the connection,
 * so a call made inside `db.transaction(...)` commits together with the business data.
 */
export class SqliteJobQueue implements JobQueue {
	constructor(
		private readonly db: Db,
		private readonly clock: Clock = systemClock
	) {}

	publish<T extends object>(topic: Topic, payload: T, options: PublishOptions = {}): void {
		const policy = TOPIC_POLICY[topic];

		// Duplicate work that has not finished yet is dropped, not retried. The check and the
		// insert cannot interleave: better-sqlite3 is synchronous and the process is the only writer.
		if (options.uniqueKey && this.hasOpen(options.uniqueKey)) return;

		this.db
			.insert(jobs)
			.values({
				topic,
				payload: payload as Record<string, unknown>,
				uniqueKey: options.uniqueKey ?? null,
				runAt: options.runAt ?? this.clock.now(),
				maxAttempts: options.maxAttempts ?? policy.maxAttempts
			})
			.run();
	}

	private hasOpen(uniqueKey: string): boolean {
		return (
			this.db
				.select({ id: jobs.id })
				.from(jobs)
				.where(and(eq(jobs.uniqueKey, uniqueKey), inArray(jobs.status, ['pending', 'active'])))
				.get() !== undefined
		);
	}

	/** Test and admin helper: reads a job back without going through the runner. */
	findById(id: string) {
		return this.db.select().from(jobs).where(eq(jobs.id, id)).get();
	}

	countOpen(topic: Topic): number {
		const row = this.db
			.select({ count: sql<number>`count(*)` })
			.from(jobs)
			.where(and(eq(jobs.topic, topic), inArray(jobs.status, ['pending', 'active'])))
			.get();
		return row?.count ?? 0;
	}
}
