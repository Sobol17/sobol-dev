import { error } from '@sveltejs/kit';
import { command, getRequestEvent, query } from '$app/server';
import { mediaAltSchema, mediaIdSchema, mediaUploadSchema } from '$lib/schemas/media';
import { container } from '$lib/server/container';
import { MediaError } from '$lib/server/domain/media.service';

/** The layout guard does not cover remote functions, so every one of them checks again. */
function requireAdmin(): void {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'unauthorized');
}

export const adminMedia = query(() => {
	requireAdmin();
	return container.media.list();
});

export const uploadMedia = command(mediaUploadSchema, async ({ file }) => {
	requireAdmin();

	try {
		// The schema trusts the browser-supplied type; the service reads the magic bytes.
		const row = await container.media.upload(new Uint8Array(await file.arrayBuffer()));
		await adminMedia().refresh();
		return { id: row.id, status: row.status };
	} catch (thrown) {
		if (thrown instanceof MediaError) error(422, uploadMessage(thrown));
		throw thrown;
	}
});

export const setMediaAlt = command(mediaAltSchema, async ({ id, alt }) => {
	requireAdmin();
	container.media.setAlt(id, alt);
	await adminMedia().refresh();
	return { saved: true };
});

export const deleteMedia = command(mediaIdSchema, async ({ id }) => {
	requireAdmin();
	await container.media.remove(id);
	await adminMedia().refresh();
	return { removed: true };
});

function uploadMessage(thrown: MediaError): string {
	if (thrown.code === 'too_large') return 'Файл больше 10 МБ';
	if (thrown.code === 'unsupported_type') return 'Это не изображение: PNG, JPEG, WebP или AVIF';
	return 'Файл не удалось принять';
}
