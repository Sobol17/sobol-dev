import { container } from '$lib/server/container';
import type { PageServerLoad } from './$types';

// The featured block reads the database, so the page is rendered per request instead of at
// build time: a build runs before the deploy and would bake in whatever the build host had.
export const prerender = false;

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=600' });

	return { featured: container.projects.featured() };
};
