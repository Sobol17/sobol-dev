import { container } from '$lib/server/container';
import type { PageServerLoad } from './$types';

// Cases change from the admin, so the page is rendered per request and cached at the edge
// of the response instead of being baked at build time.
export const prerender = false;

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=600' });

	return { cases: container.projects.publicList() };
};
