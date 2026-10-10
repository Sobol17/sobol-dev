import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { idSchema } from '$lib/schemas/common';
import { container } from '$lib/server/container';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
	if (!locals.user) error(401, 'unauthorized');
	const parsed = v.safeParse(idSchema, params.id);
	if (!parsed.success) error(404, 'Заявка не найдена');
	// The route must return 404 before rendering, including on a direct visit.
	try {
		container.leads.detail(parsed.output);
	} catch (thrown) {
		if (thrown instanceof Error && thrown.message === 'lead_not_found')
			error(404, 'Заявка не найдена');
		throw thrown;
	}
	return { id: parsed.output };
};
