<script lang="ts">
	import { base } from '$app/paths';
	import { Button, Dialog } from '$lib/ui';
	import Workspace from '../../../src/routes/(admin)/_components/workspace.svelte';
	import LeadOverview from '../../../src/routes/(admin)/_components/lead-overview.svelte';
	import { leads, leadDetails } from '../../leads';
	import LeadSummary from '../../../src/routes/(admin)/admin/leads/_components/lead-summary.svelte';
	let selected = $state<(typeof leadDetails)[number] | null>(null);
	let panelOpen = $state(false);
	const data = {
		leads,
		stats: {
			leads: leads.length,
			newLeads: leads.filter((lead) => lead.status === 'new').length
		}
	};
</script>

<Workspace
	items={[{ href: '/admin', label: 'Заявки' }]}
	user={{ displayName: 'Демо-пользователь' }}
>
	{#snippet exit()}<Button href={`${base}/`} variant="ghost" class="w-full justify-start text-muted"
			>Выйти из демо CRM</Button
		>{/snippet}
	<p class="mb-6 rounded-field border border-line bg-surface p-4 text-sm leading-6 text-muted">
		Демонстрационные заявки. Имена и задачи вымышлены. Детали доступны для просмотра. Статусы и
		заметки в демо не сохраняются.
	</p>
	<LeadOverview {data}>
		{#snippet action(lead)}<Button
				variant="secondary"
				size="sm"
				aria-label={`Подробнее о ${lead.publicId}`}
				onclick={() => {
					selected = leadDetails.find((item) => item.id === lead.id) ?? null;
					panelOpen = true;
				}}>Подробнее</Button
			>{/snippet}
	</LeadOverview>
</Workspace>

{#if selected}
	<Dialog
		bind:open={panelOpen}
		placement="right"
		title={`Заявка ${selected.publicId}`}
		description="Демонстрационная заявка · только просмотр"
	>
		<LeadSummary lead={selected}>
			<h3 class="text-base font-semibold">Заметки</h3>
			<p class="mt-3 text-sm leading-6 text-muted">
				Заметок пока нет. В рабочей CRM здесь хранится история общения с клиентом.
			</p>
		</LeadSummary>
		{#snippet footer()}<Button variant="secondary" onclick={() => (panelOpen = false)}
				>К списку заявок</Button
			>{/snippet}
	</Dialog>
{/if}
