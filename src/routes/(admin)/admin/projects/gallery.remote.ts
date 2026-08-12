import { error } from '@sveltejs/kit';
import { command, getRequestEvent, query } from '$app/server';
import { idSchema } from '$lib/schemas/common';
import { coverSchema, galleryItemSchema, galleryOrderSchema } from '$lib/schemas/media';
import { container } from '$lib/server/container';

/** The layout guard does not cover remote functions, so every one of them checks again. */
function requireAdmin(): void {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'unauthorized');
}

export const projectGallery = query(idSchema, (projectId) => {
	requireAdmin();
	const project = container.projects.get(projectId);
	if (!project) error(404, 'Кейс не найден');

	return {
		coverMediaId: project.project.coverMediaId,
		items: container.media.gallery(projectId)
	};
});

export const attachToGallery = command(galleryItemSchema, async ({ projectId, mediaId }) => {
	requireAdmin();
	container.media.attach(projectId, mediaId);
	await projectGallery(projectId).refresh();
	return { attached: true };
});

export const detachFromGallery = command(galleryItemSchema, async ({ projectId, mediaId }) => {
	requireAdmin();
	container.media.detach(projectId, mediaId);
	await projectGallery(projectId).refresh();
	return { detached: true };
});

export const reorderGallery = command(galleryOrderSchema, async ({ projectId, mediaIds }) => {
	requireAdmin();
	container.media.reorderGallery(projectId, mediaIds);
	await projectGallery(projectId).refresh();
	return { count: mediaIds.length };
});

export const setProjectCover = command(coverSchema, async ({ projectId, mediaId }) => {
	requireAdmin();
	container.projects.setCover(projectId, mediaId);
	await projectGallery(projectId).refresh();
	return { coverMediaId: mediaId };
});

/** Library picker inside the editor: only processed images can be attached to a case. */
export const readyMedia = query(() => {
	requireAdmin();
	return container.media.list().filter((item) => item.status === 'ready');
});
