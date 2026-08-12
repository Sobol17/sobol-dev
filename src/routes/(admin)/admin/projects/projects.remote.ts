import { error, invalid, redirect, type InvalidField } from '@sveltejs/kit';
import { command, form, getRequestEvent, query } from '$app/server';
import {
	projectIdSchema,
	projectInputSchema,
	projectOrderSchema,
	projectUpdateSchema
} from '$lib/schemas/project';
import { container } from '$lib/server/container';
import { ProjectError } from '$lib/server/domain/project.service';

/** The layout guard does not cover remote functions, so every one of them checks again. */
function requireAdmin(): void {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'unauthorized');
}

export const adminProjects = query(() => {
	requireAdmin();
	return container.projects.list();
});

export const createProject = form(projectInputSchema, async (data, issue) => {
	requireAdmin();

	let id: string;
	try {
		id = container.projects.create(data).id;
	} catch (thrown) {
		reportSlugCollision(thrown, issue.slug);
	}

	await adminProjects().refresh();
	redirect(303, `/admin/projects/${id}`);
});

export const updateProject = form(projectUpdateSchema, async ({ id, ...data }, issue) => {
	requireAdmin();

	try {
		container.projects.update(id, data);
	} catch (thrown) {
		reportSlugCollision(thrown, issue.slug);
	}

	await adminProjects().refresh();
	return { saved: true };
});

export const publishProject = command(projectIdSchema, async ({ id }) => {
	requireAdmin();
	const published = container.projects.publish(id);
	await adminProjects().refresh();
	return { published };
});

export const unpublishProject = command(projectIdSchema, async ({ id }) => {
	requireAdmin();
	const unpublished = container.projects.unpublish(id);
	await adminProjects().refresh();
	return { unpublished };
});

export const deleteProject = command(projectIdSchema, async ({ id }) => {
	requireAdmin();
	const removed = container.projects.remove(id);
	await adminProjects().refresh();
	return { removed };
});

export const reorderProjects = command(projectOrderSchema, async ({ ids }) => {
	requireAdmin();
	container.projects.reorder(ids);
	await adminProjects().refresh();
	return { count: ids.length };
});

/** A slug collision belongs next to the slug field, not on the error page. */
function reportSlugCollision(thrown: unknown, slug: InvalidField<string | undefined>): never {
	if (thrown instanceof ProjectError && thrown.code === 'slug_taken') {
		invalid(slug('Такой адрес уже занят'));
	}
	throw thrown;
}
