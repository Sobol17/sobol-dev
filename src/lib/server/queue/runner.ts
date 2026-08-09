import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import type { Logger } from 'pino';
import type { Db } from '../db/index';
import { jobs } from '../db/schema';
import { TOPIC_POLICY, type Topic } from './topics';

export type JobRow = typeof jobs.$inferSelect;

export type JobHandler = (payload: Record<string, unknown>, job: JobRow) => Promise<void> | void;

/** Keyed by topic. Typed as a plain record so tests can register their own topic. */
export type JobHandlers = Record<string, JobHandler>;

export interface RunnerOptions {
	pollIntervalMs?: number;
	/** A job left `active` longer than this lost its process and goes back to `pending`. */
	stuckAfterMs?: number;
	maxBackoffMs?: number;
	clock?: () => Date;
}

const DEFAULTS = {
	pollIntervalMs: 1000,
	stuckAfterMs: 10 * 60 * 1000,
	maxBackoffMs: 60 * 60 * 1000
};

export class JobRunner {
	private readonly pollIntervalMs: number;
	private readonly stuckAfterMs: number;
	private readonly maxBackoffMs: number;
	private readonly now: () => Date;
	private running = false;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private loop: Promise<void> = Promise.resolve();

	constructor(
		private readonly db: Db,
		private readonly handlers: JobHandlers,
		private readonly log: Logger,
		options: RunnerOptions = {}
	) {
		this.pollIntervalMs = options.pollIntervalMs ?? DEFAULTS.pollIntervalMs;
		this.stuckAfterMs = options.stuckAfterMs ?? DEFAULTS.stuckAfterMs;
		this.maxBackoffMs = options.maxBackoffMs ?? DEFAULTS.maxBackoffMs;
		this.now = options.clock ?? (() => new Date());
	}

	/**
	 * Returns jobs abandoned mid-flight to `pending`. Handlers are idempotent, so a second
	 * run of a job that already did its work is a normal case, not a corruption.
	 */
	reapStuck(): number {
		const threshold = new Date(this.now().getTime() - this.stuckAfterMs);
		const rows = this.db
			.update(jobs)
			.set({ status: 'pending', startedAt: null })
			.where(and(eq(jobs.status, 'active'), lte(jobs.startedAt, threshold)))
			.returning({ id: jobs.id })
			.all();

		if (rows.length > 0) {
			this.log.warn({ count: rows.length }, 'requeued stuck jobs');
		}
		return rows.length;
	}

	/** Atomic claim: one writer, one statement, no race. */
	claim(): JobRow | undefined {
		const now = this.now();
		return this.db
			.update(jobs)
			.set({ status: 'active', attempts: sql`${jobs.attempts} + 1`, startedAt: now })
			.where(
				eq(
					jobs.id,
					sql`(select ${jobs.id} from ${jobs} where ${jobs.status} = 'pending' and ${jobs.runAt} <= ${now.getTime()} order by ${jobs.runAt} limit 1)`
				)
			)
			.returning()
			.get();
	}

	/** Runs at most one job. Returns false when the queue had nothing ready. */
	async tick(): Promise<boolean> {
		const job = this.claim();
		if (!job) return false;

		const handler = this.handlers[job.topic];
		if (!handler) {
			this.fail(job, `no handler registered for topic ${job.topic}`);
			return true;
		}

		try {
			await handler(job.payload, job);
			this.db
				.update(jobs)
				.set({ status: 'done', finishedAt: this.now(), lastError: null })
				.where(eq(jobs.id, job.id))
				.run();
			this.log.info({ jobId: job.id, topic: job.topic }, 'job done');
		} catch (error) {
			this.fail(job, error instanceof Error ? error.message : String(error));
		}
		return true;
	}

	private fail(job: JobRow, message: string): void {
		if (job.attempts >= job.maxAttempts) {
			this.db
				.update(jobs)
				.set({ status: 'failed', finishedAt: this.now(), lastError: message })
				.where(eq(jobs.id, job.id))
				.run();
			this.log.error({ jobId: job.id, topic: job.topic, err: message }, 'job failed for good');
			return;
		}

		const runAt = new Date(this.now().getTime() + this.backoffMs(job));
		this.db
			.update(jobs)
			.set({ status: 'pending', startedAt: null, runAt, lastError: message })
			.where(eq(jobs.id, job.id))
			.run();
		this.log.warn(
			{ jobId: job.id, topic: job.topic, attempts: job.attempts, err: message },
			'job retried'
		);
	}

	private backoffMs(job: JobRow): number {
		const base = TOPIC_POLICY[job.topic as Topic]?.backoffBaseMs ?? 15_000;
		return Math.min(base * 2 ** (job.attempts - 1), this.maxBackoffMs);
	}

	start(): void {
		if (this.running) return;
		this.running = true;
		this.reapStuck();
		this.loop = this.drainThenWait();
		this.log.info('job runner started');
	}

	/** Resolves once the job in flight is finished. Callers use it on SIGTERM. */
	async stop(): Promise<void> {
		this.running = false;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		await this.loop;
		this.log.info('job runner stopped');
	}

	private async drainThenWait(): Promise<void> {
		while (this.running) {
			let worked = false;
			try {
				worked = await this.tick();
			} catch (error) {
				this.log.error({ err: error }, 'runner tick crashed');
			}
			if (!worked) await this.sleep();
		}
	}

	private sleep(): Promise<void> {
		return new Promise((resolve) => {
			this.timer = setTimeout(resolve, this.pollIntervalMs);
			this.timer.unref?.();
		});
	}

	/** Drains everything ready right now. Tests use it instead of the timer loop. */
	async drain(limit = 100): Promise<number> {
		let processed = 0;
		while (processed < limit && (await this.tick())) processed += 1;
		return processed;
	}

	openCount(): number {
		const row = this.db
			.select({ count: sql<number>`count(*)` })
			.from(jobs)
			.where(inArray(jobs.status, ['pending', 'active']))
			.get();
		return row?.count ?? 0;
	}
}
