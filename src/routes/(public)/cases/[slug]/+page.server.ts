import { error } from '@sveltejs/kit';
import { container } from '$lib/server/container';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = ({ params, setHeaders }) => {
	const found = container.projects.publicCase(params.slug);
	// A draft is indistinguishable from a case that never existed. That is the point.
	if (!found) error(404, 'Кейс не найден');

	setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=600' });

	return { case: found };
};
