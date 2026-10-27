<script lang="ts">
	import { Button, Dialog, EmptyState, Skeleton } from '$lib/ui';
	import { getLead } from '../leads.remote';
	import LeadSummary from './lead-summary.svelte';
	import StatusForm from './status-form.svelte';
	import Notes from './notes.svelte';
	let {
		id,
		publicId,
		open = $bindable(false)
	}: { id: string; publicId: string; open?: boolean } = $props();
	const detail = $derived(open ? getLead(id) : null);
</script>

<Dialog
	bind:open
	placement="right"
	title={`Заявка ${publicId}`}
	description="Контакт, задача и история работы"
>
	{#if detail}
		{#await detail}<Skeleton variant="block" />
		{:then result}
			{#key result.lead.id}<LeadSummary lead={result.lead}>
					<h3 class="mb-4 text-base font-semibold">Статус заявки</h3>
					<StatusForm {id} status={result.lead.status} />
					<Notes {id} notes={result.notes} />
				</LeadSummary>{/key}
		{:catch}<EmptyState
				title="Не удалось загрузить заявку"
				description="Повторите попытку или войдите снова."
			>
				{#snippet action()}<Button onclick={() => detail?.refresh()} variant="secondary"
						>Повторить</Button
					>{/snippet}
			</EmptyState>{/await}
	{/if}
	{#snippet footer()}<Button href={`/admin/leads/${id}`} variant="secondary"
			>Открыть отдельной страницей</Button
		>{/snippet}
</Dialog>
