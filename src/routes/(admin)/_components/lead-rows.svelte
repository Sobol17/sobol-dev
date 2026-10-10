<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card, Table } from '$lib/ui';
	import { LEAD_TYPE_LABELS, formatDate } from '$lib/utils/format';
	import type { LeadListItem } from '$lib/types';
	import StatusBadge from './lead-status-badge.svelte';
	let {
		leads,
		interactive = false,
		action
	}: { leads: LeadListItem[]; interactive?: boolean; action?: Snippet<[LeadListItem]> } = $props();
	const baseColumns = [
		{ key: 'publicId', label: 'Номер', width: '100px' },
		{ key: 'contactName', label: 'Клиент и задача' },
		{ key: 'type', label: 'Тип проекта', width: '140px' },
		{ key: 'status', label: 'Статус', width: '140px' },
		{ key: 'createdAt', label: 'Получена', width: '140px' }
	];
	const columns = $derived(
		action ? [...baseColumns, { key: 'action', label: 'Действие', width: '120px' }] : baseColumns
	);
</script>

{#snippet reference(lead: LeadListItem)}
	{#if interactive}<a
			href={`/admin/leads/${lead.id}`}
			class="text-accent underline underline-offset-4">{lead.publicId}</a
		>{:else}{lead.publicId}{/if}
{/snippet}

<div class="hidden xl:block">
	<Table {columns} rows={leads} class="[&_table]:table-fixed [&_th]:px-4">
		{#snippet row(lead: LeadListItem)}
			<tr class="border-t border-line transition-colors hover:bg-accent-soft/60">
				<td class="px-4 py-4 align-top text-xs font-medium tracking-[.06em]"
					>{@render reference(lead)}</td
				>
				<td class="px-4 py-4 align-top wrap-anywhere"
					><span class="block font-medium">{lead.contactName}</span><span
						class="mt-2 block max-w-[46ch] text-sm leading-relaxed wrap-anywhere text-muted"
						>{lead.goalExcerpt}</span
					></td
				>
				<td class="px-4 py-4 align-top text-sm text-muted">{LEAD_TYPE_LABELS[lead.type]}</td>
				<td class="px-4 py-4 align-top"><StatusBadge status={lead.status} /></td>
				<td class="px-4 py-4 align-top text-sm leading-relaxed text-muted"
					><time datetime={lead.createdAt}>{formatDate(lead.createdAt)}</time></td
				>
				{#if action}<td class="px-4 py-4 align-top">{@render action(lead)}</td>{/if}
			</tr>
		{/snippet}
	</Table>
</div>
<ul class="grid gap-4 sm:grid-cols-2 xl:hidden" aria-label="Список заявок">
	{#each leads as lead (lead.id)}
		<li>
			<Card class="p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<span class="text-xs font-medium tracking-[.06em]">{@render reference(lead)}</span
					><StatusBadge status={lead.status} />
				</div>
				{#if action}<div class="mt-4">{@render action(lead)}</div>{/if}
				<h3 class="mt-4 text-base font-semibold wrap-anywhere">{lead.contactName}</h3>
				<p class="mt-2 text-sm leading-relaxed wrap-anywhere text-muted">{lead.goalExcerpt}</p>
				<div class="mt-6 grid gap-2 border-t border-line pt-4 text-xs leading-5 text-muted">
					<span>{LEAD_TYPE_LABELS[lead.type]}</span><time datetime={lead.createdAt}
						>{formatDate(lead.createdAt)}</time
					>
				</div>
			</Card>
		</li>
	{/each}
</ul>
