import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { storageKeySchema } from '$lib/schemas/media';
import { container } from '$lib/server/container';
import { mimeForExtension } from '$lib/utils/image-type';
import type { RequestHandler } from './$types';

/** A year of caching is safe: keys are random and a new upload never reuses one. */
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Uploads live outside the static root, so the web server cannot hand them out by itself.
 * This route is the only way in, and it only serves keys that match the storage shape.
 */
export const GET: RequestHandler = async ({ params }) => {
	const key = v.safeParse(storageKeySchema, params.key);
	if (!key.success) error(404, 'Файл не найден');

	const mime = mimeForExtension(key.output.slice(key.output.lastIndexOf('.') + 1));
	if (!mime) error(404, 'Файл не найден');

	let bytes: Uint8Array<ArrayBuffer>;
	try {
		bytes = await container.storage.get(key.output);
	} catch {
		error(404, 'Файл не найден');
	}

	// Blob rather than the raw view: a `Uint8Array` over a shared buffer is not a valid body.
	return new Response(new Blob([bytes], { type: mime }), {
		headers: {
			'content-type': mime,
			'content-length': String(bytes.byteLength),
			'cache-control': CACHE_CONTROL,
			'x-content-type-options': 'nosniff'
		}
	});
};
