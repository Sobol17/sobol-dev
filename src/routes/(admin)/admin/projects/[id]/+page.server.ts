import { error } from '@sveltejs/kit';
import { container } from '$lib/server/container';
import { toFormValues } from '../form-values';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
	// The layout guard is not enough on its own: every server handler checks for itself.
	if (!locals.user) error(401, 'unauthorized');

	const found = container.projects.get(params.id);
	if (!found) error(404, 'Кейс не найден');

	return {
		id: found.project.id,
		status: found.project.status,
		values: toFormValues(found.project, found.tags)
	};
};
