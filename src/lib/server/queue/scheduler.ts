import type { Logger } from 'pino';
import type { JobQueue } from '$lib/types';

/**
 * Periodic work without an external cron. The unique key carries the date, so re-running the
 * scheduler any number of times a day still leaves exactly one job per day in the queue.
 */
export class JobScheduler {
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor(
		_queue: JobQueue,
		private readonly log: Logger,
		_clock: () => Date = () => new Date()
	) {}

	/** Enqueues everything due today. Safe to call on every process start. */
	scheduleDaily(): void {
		// Core v4 has no periodic topics. Keep the lifecycle for future schedules.
	}

	start(intervalMs = 60 * 60 * 1000): void {
		if (this.timer) return;
		this.scheduleDaily();
		this.timer = setInterval(() => {
			try {
				this.scheduleDaily();
			} catch (error) {
				this.log.error({ err: error }, 'scheduler tick failed');
			}
		}, intervalMs);
		this.timer.unref?.();
	}

	stop(): void {
		if (!this.timer) return;
		clearInterval(this.timer);
		this.timer = null;
	}
}
