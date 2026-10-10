import type * as v from 'valibot';
import type { leadListSchema } from '$lib/schemas/lead';

export function listUrl(filters: v.InferOutput<typeof leadListSchema>): string {
	const params = new URLSearchParams();
	if (filters.view === 'spam') params.set('view', 'spam');
	if (filters.status) params.set('status', filters.status);
	if (filters.type) params.set('type', filters.type);
	if (filters.search) params.set('search', filters.search);
	if (filters.page > 1) params.set('page', String(filters.page));
	const query = params.toString();
	return '/admin/leads' + (query ? '?' + query : '');
}
