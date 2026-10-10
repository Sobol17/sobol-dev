import { expect, it } from 'vitest';
import { JobScheduler } from '$lib/server/queue/scheduler';
import { createLogger } from '$lib/server/log';
import type { JobQueue } from '$lib/types';
it('keeps the scheduler idle because core v4 has no periodic topics', () => {
	const published: unknown[] = [];
	const queue: JobQueue = {
		publish: (...args) => {
			published.push(args);
		}
	};
	const scheduler = new JobScheduler(queue, createLogger('silent'));
	scheduler.scheduleDaily();
	scheduler.start();
	scheduler.start();
	scheduler.stop();
	scheduler.stop();
	expect(published).toEqual([]);
});
