import { error } from '@sveltejs/kit';
import { container } from '$lib/server/container';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	// The layout guard is not enough on its own: every server handler checks for itself.
	if (!locals.user) error(401, 'unauthorized');

	const stats = container.leads.stats();

	return {
		leads: container.leads.listRecent(20),
		stats: {
			leads: stats.total,
			newLeads: stats.fresh,
			openJobs: container.runner.openCount()
		}
	};
};
