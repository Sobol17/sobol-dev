<script lang="ts">
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Card, EmptyState, Table } from '$lib/ui';
	import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, formatDate } from '$lib/utils/format';
	import type { LeadListItem, LeadStatus } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const columns = [
		{ key: 'publicId', label: 'Номер', width: '110px' },
		{ key: 'contactName', label: 'Имя' },
		{ key: 'type', label: 'Тип', width: '180px' },
		{ key: 'status', label: 'Статус', width: '150px' },
		{ key: 'createdAt', label: 'Пришла', width: '180px' }
	];

	const TONES: Record<LeadStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
		new: 'accent',
		qualifying: 'neutral',
		proposal_sent: 'neutral',
		won: 'success',
		lost: 'neutral',
		spam: 'danger'
	};
</script>

<SeoHead title="Дашборд — SobolDev" description="Административная панель." noindex />

<h1 class="mb-8 font-display text-[28px] tracking-[-.02em]" style="font-weight:700">Дашборд</h1>

<div class="mb-8 grid gap-4 sm:grid-cols-3">
	<Card padding="sm">
		<p class="font-mono text-[11px] tracking-[.14em] text-muted uppercase">Заявок всего</p>
		<p class="mt-2 font-display text-[28px]" style="font-weight:700">{data.stats.leads}</p>
	</Card>
	<Card padding="sm">
		<p class="font-mono text-[11px] tracking-[.14em] text-muted uppercase">Новых</p>
		<p class="mt-2 font-display text-[28px]" style="font-weight:700">{data.stats.newLeads}</p>
	</Card>
	<Card padding="sm">
		<p class="font-mono text-[11px] tracking-[.14em] text-muted uppercase">Джобов в очереди</p>
		<p class="mt-2 font-display text-[28px]" style="font-weight:700">{data.stats.openJobs}</p>
	</Card>
</div>

<Table {columns} rows={data.leads}>
	{#snippet row(lead: LeadListItem)}
		<tr class="border-t border-line">
			<td class="px-5 py-4 font-mono text-[13px]">{lead.publicId}</td>
			<td class="px-5 py-4">
				<span class="block">{lead.contactName}</span>
				<span class="block text-[13px] text-muted">{lead.goalExcerpt}</span>
			</td>
			<td class="px-5 py-4 text-muted">{LEAD_TYPE_LABELS[lead.type]}</td>
			<td class="px-5 py-4">
				<Badge tone={TONES[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
			</td>
			<td class="px-5 py-4 text-muted">{formatDate(lead.createdAt)}</td>
		</tr>
	{/snippet}

	{#snippet empty()}
		<EmptyState
			title="Заявок пока нет"
			description="Отправьте бриф с публичной формы, чтобы проверить вертикаль целиком."
			class="border-0"
		/>
	{/snippet}
</Table>
