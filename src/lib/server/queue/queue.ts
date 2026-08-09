import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { jobs } from '../db/schema';
import type { JobQueue, PublishOptions } from '$lib/types';
import { TOPIC_POLICY, type Topic } from './topics';

/**
 * Queue backed by the `jobs` table of the same database file.
 *
 * `publish` is synchronous on purpose: better-sqlite3 transactions live on the connection,
 * so a call made inside `db.transaction(...)` commits together with the business data.
 */
export class SqliteJobQueue implements JobQueue {
	constructor(private readonly db: Db) {}

	publish<T extends object>(topic: Topic, payload: T, options: PublishOptions = {}): void {
		const policy = TOPIC_POLICY[topic];

		this.db
			.insert(jobs)
			.values({
				topic,
				payload: payload as Record<string, unknown>,
				uniqueKey: options.uniqueKey ?? null,
				runAt: options.runAt ?? new Date(),
				maxAttempts: options.maxAttempts ?? policy.maxAttempts
			})
			// Duplicate work that has not finished yet is dropped, not retried.
			.onConflictDoNothing({
				target: jobs.uniqueKey,
				where: and(isNotNull(jobs.uniqueKey), inArray(jobs.status, ['pending', 'active']))
			})
			.run();
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
