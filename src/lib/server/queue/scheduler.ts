import type { Logger } from 'pino';
import type { JobQueue } from '$lib/types';
import { TOPICS } from './topics';

/**
 * Periodic work without an external cron. The unique key carries the date, so re-running the
 * scheduler any number of times a day still leaves exactly one job per day in the queue.
 */
export class JobScheduler {
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor(
		private readonly queue: JobQueue,
		private readonly log: Logger,
		private readonly clock: () => Date = () => new Date()
	) {}

	/** Enqueues everything due today. Safe to call on every process start. */
	scheduleDaily(): void {
		const now = this.clock();
		this.queue.publish(
			TOPICS.MEDIA_GC,
			{},
			{ uniqueKey: `${TOPICS.MEDIA_GC}:${isoDate(now)}`, runAt: nextAt(now, 3) }
		);
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

function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Next occurrence of the given UTC hour, today if it has not passed yet. */
function nextAt(now: Date, hourUtc: number): Date {
	const at = new Date(now);
	at.setUTCHours(hourUtc, 0, 0, 0);
	if (at <= now) at.setUTCDate(at.getUTCDate() + 1);
	return at;
}
