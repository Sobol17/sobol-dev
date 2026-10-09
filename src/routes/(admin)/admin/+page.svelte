<script lang="ts">
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card, EmptyState, Table } from '$lib/ui';
	import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, formatDate } from '$lib/utils/format';
	import type { LeadListItem, LeadStatus } from '$lib/types';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const columns = [
		{ key: 'publicId', label: 'Номер', width: '100px' },
		{ key: 'contactName', label: 'Клиент и задача' },
		{ key: 'type', label: 'Тип проекта', width: '140px' },
		{ key: 'status', label: 'Статус', width: '140px' },
		{ key: 'createdAt', label: 'Получена', width: '140px' }
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

<SeoHead
	title={`Заявки · ${SITE.name}`}
	description="Обращения с сайта и текущие статусы заявок."
	noindex
/>

<div class="workspace-overview">
	<div>
		<h1 class="workspace-title">Заявки</h1>
		<p class="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted">
			Обращения с сайта и текущие статусы
		</p>
	</div>
	<div class="grid grid-cols-2 gap-4">
		<Card class="border-night bg-night p-4 text-white">
			<p class="text-sm text-white/75">Новые заявки</p>
			<p class="mt-3 text-3xl leading-none font-semibold tracking-[-.03em] tabular-nums">
				{data.stats.newLeads}
			</p>
		</Card>
		<Card class="p-4">
			<p class="text-sm text-muted">Всего заявок</p>
			<p class="mt-3 text-3xl leading-none font-semibold tracking-[-.03em] tabular-nums">
				{data.stats.leads}
			</p>
		</Card>
	</div>
</div>

<section aria-labelledby="recent-title" class="mt-8">
	<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 id="recent-title" class="text-lg font-semibold tracking-[-.02em]">Последние обращения</h2>
			<p class="mt-2 text-sm text-muted">Новые сверху</p>
		</div>
		<p class="text-sm text-muted">Показано {data.leads.length} из {data.stats.leads}</p>
	</div>
	{#if data.leads.length}
		<div class="hidden xl:block">
			<Table {columns} rows={data.leads} class="[&_table]:table-fixed [&_th]:px-4">
				{#snippet row(lead: LeadListItem)}
					<tr class="border-t border-line transition-colors hover:bg-accent-soft/60">
						<td class="px-4 py-4 align-top text-xs font-medium tracking-[.06em]">{lead.publicId}</td
						>
						<td class="px-4 py-4 align-top wrap-anywhere"
							><span class="block font-medium">{lead.contactName}</span><span
								class="mt-2 block max-w-[46ch] text-sm leading-relaxed wrap-anywhere text-muted"
								>{lead.goalExcerpt}</span
							></td
						>
						<td class="px-4 py-4 align-top text-sm text-muted">{LEAD_TYPE_LABELS[lead.type]}</td>
						<td class="px-4 py-4 align-top"
							><Badge tone={TONES[lead.status]} class="text-xs tracking-normal normal-case"
								>{LEAD_STATUS_LABELS[lead.status]}</Badge
							></td
						>
						<td class="px-4 py-4 align-top text-sm leading-relaxed text-muted"
							><time datetime={lead.createdAt}>{formatDate(lead.createdAt)}</time></td
						>
					</tr>
				{/snippet}
			</Table>
		</div>
		<ul class="grid gap-4 sm:grid-cols-2 xl:hidden" aria-label="Список заявок">
			{#each data.leads as lead (lead.id)}
				<li>
					<Card class="p-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<span class="text-xs font-medium tracking-[.06em]">{lead.publicId}</span><Badge
								tone={TONES[lead.status]}
								class="text-xs tracking-normal normal-case">{LEAD_STATUS_LABELS[lead.status]}</Badge
							>
						</div>
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
	{:else}
		<Card class="p-0"
			><EmptyState
				title="Заявок пока нет"
				description="Здесь появятся обращения, которые клиенты отправят через форму на сайте."
				class="border-0 py-16"
			>
				{#snippet action()}<Button href="/#brief" variant="secondary">Открыть форму на сайте</Button
					>{/snippet}
			</EmptyState></Card
		>
	{/if}
</section>
<p class="mt-6 text-sm text-muted">
	Фоновые задачи в очереди: <span class="text-ink tabular-nums">{data.stats.openJobs}</span>
</p>
