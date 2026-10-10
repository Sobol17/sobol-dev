import { command, getRequestEvent, query, requested } from '$app/server';
import { error } from '@sveltejs/kit';
import { leadListSchema, leadNoteSchema, leadStatusChangeSchema } from '$lib/schemas/lead';
import { idSchema } from '$lib/schemas/common';
import { container } from '$lib/server/container';

function requireAdmin() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'unauthorized');
	return locals.user;
}

function leadError(thrown: unknown): never {
	if (thrown instanceof Error) {
		if (thrown.message === 'lead_not_found') error(404, 'Заявка не найдена');
		if (thrown.message === 'invalid_transition') error(409, 'Этот переход статуса недоступен');
		if (thrown.message === 'status_conflict') error(409, 'Заявка изменилась. Обновите карточку');
	}
	throw thrown;
}

export const listLeads = query(leadListSchema, (input) => {
	requireAdmin();
	return container.leads.list(input);
});

export const getLead = query(idSchema, (id) => {
	requireAdmin();
	try {
		return container.leads.detail(id);
	} catch (thrown) {
		leadError(thrown);
	}
});

export const changeLeadStatus = command(leadStatusChangeSchema, async ({ id, status }) => {
	requireAdmin();
	try {
		container.leads.changeStatus(id, status);
	} catch (thrown) {
		leadError(thrown);
	}
	await getLead(id).refresh();
	await requested(listLeads, 20).refreshAll();
});

export const addLeadNote = command(leadNoteSchema, async ({ id, body }) => {
	const user = requireAdmin();
	try {
		container.leads.addNote(id, user.id, body);
	} catch (thrown) {
		leadError(thrown);
	}
	await getLead(id).refresh();
});
