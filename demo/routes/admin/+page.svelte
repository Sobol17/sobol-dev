<script lang="ts">
	import { base } from '$app/paths';
	import { Button } from '$lib/ui';
	import Workspace from '../../../src/routes/(admin)/_components/workspace.svelte';
	import LeadOverview from '../../../src/routes/(admin)/_components/lead-overview.svelte';
	import { leads } from '../../leads';
	const data = {
		leads,
		stats: {
			leads: leads.length,
			newLeads: leads.filter((lead) => lead.status === 'new').length,
			openJobs: 0
		}
	};
</script>

<Workspace user={{ displayName: 'Демо-пользователь' }}>
	{#snippet exit()}<Button href={`${base}/`} variant="ghost" class="w-full justify-start text-muted"
			>Выйти из демо CRM</Button
		>{/snippet}
	<p class="mb-6 rounded-field border border-line bg-surface p-4 text-sm leading-6 text-muted">
		Демонстрационные заявки. Имена и задачи вымышлены. Изменение статусов и заметки пока не
		реализованы.
	</p>
	<LeadOverview {data} />
</Workspace>
