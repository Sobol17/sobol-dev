import { json } from '@sveltejs/kit';
import { container } from '$lib/server/container';
import type { RequestHandler } from './$types';

/** Liveness probe for systemd and the deploy script. Touches the database on purpose. */
export const GET: RequestHandler = () => {
	container.db.sqlite.prepare('select 1').get();
	return json({ status: 'ok', openJobs: container.runner.openCount() });
};
