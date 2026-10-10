<script lang="ts">
	import { Button } from '$lib/ui';
	import type { LeadListItem } from '$lib/types';
	import type { RemoteQuery } from '@sveltejs/kit';
	import { getToastStore } from '$lib/state/toast.svelte';
	import { errorText } from '$lib/utils/errors';
	import { changeLeadStatus, listLeads } from '../leads.remote';
	let {
		lead,
		list
	}: { lead: LeadListItem; list: RemoteQuery<Awaited<ReturnType<typeof listLeads>>> } = $props();
	const toast = getToastStore();
	let saving = $state(false);
	async function update() {
		saving = true;
		try {
			await changeLeadStatus({
				id: lead.id,
				status: lead.status === 'spam' ? 'new' : 'qualifying'
			}).updates(list);
			toast.success('Статус сохранён');
		} catch (thrown) {
			toast.error(errorText(thrown, 'Не удалось изменить статус'));
		} finally {
			saving = false;
		}
	}
</script>

{#if lead.status === 'new' || lead.status === 'spam'}
	<Button variant="secondary" size="sm" loading={saving} onclick={update}
		>{lead.status === 'spam' ? 'Вернуть' : 'В работу'}</Button
	>
{/if}
