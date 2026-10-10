import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { leadListSchema } from '$lib/schemas/lead';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) error(401, 'unauthorized');
	const parsed = v.safeParse(leadListSchema, {
		view: url.searchParams.get('view') ?? undefined,
		status: url.searchParams.get('status') ?? undefined,
		type: url.searchParams.get('type') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		page: Number(url.searchParams.get('page') ?? 1)
	});
	if (!parsed.success) error(400, 'Некорректные фильтры заявок');
	return { filters: parsed.output };
};
