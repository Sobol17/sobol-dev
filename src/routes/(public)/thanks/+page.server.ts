import { parsePublicId } from '$lib/utils/public-id';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	publicId: parsePublicId(url.searchParams.get('id'))
});
