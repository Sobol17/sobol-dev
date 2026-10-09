<script lang="ts">
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card, EmptyState, Table } from '$lib/ui';
	import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, formatDate } from '$lib/utils/format';
	import type { LeadListItem, LeadStatus } from '$lib/types';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const columns = [
		{ key: 'publicId', label: 'Номер', width: '120px' },
		{ key: 'contactName', label: 'Клиент и задача' },
		{ key: 'type', label: 'Тип проекта', width: '180px' },
		{ key: 'status', label: 'Статус', width: '160px' },
		{ key: 'createdAt', label: 'Получена', width: '180px' }
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
		<p class="mt-4 max-w-[46ch] text-base leading-relaxed text-muted">
			Обращения с сайта и текущие статусы
		</p>
	</div>
	<div class="grid grid-cols-2 gap-4">
		<Card class="border-night bg-night p-6 text-white">
			<p class="text-sm text-white/75">Новые заявки</p>
			<p class="mt-4 text-4xl leading-none font-semibold tracking-[-.03em] tabular-nums">
				{data.stats.newLeads}
			</p>
		</Card>
		<Card class="p-6">
			<p class="text-sm text-muted">Всего заявок</p>
			<p class="mt-4 text-4xl leading-none font-semibold tracking-[-.03em] tabular-nums">
				{data.stats.leads}
			</p>
		</Card>
	</div>
</div>

<section aria-labelledby="recent-title" class="mt-10">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 id="recent-title" class="text-xl font-semibold tracking-[-.02em]">Последние обращения</h2>
			<p class="mt-2 text-sm text-muted">Новые сверху</p>
		</div>
		<p class="text-sm text-muted">Показано {data.leads.length} из {data.stats.leads}</p>
	</div>
	{#if data.leads.length}
		<div class="hidden md:block">
			<Table {columns} rows={data.leads}>
				{#snippet row(lead: LeadListItem)}
					<tr class="border-t border-line transition-colors hover:bg-accent-soft/60">
						<td class="px-6 py-6 align-top text-xs font-medium tracking-[.06em]">{lead.publicId}</td
						>
						<td class="px-6 py-6"
							><span class="block font-medium">{lead.contactName}</span><span
								class="mt-2 block max-w-[46ch] text-sm leading-relaxed break-words text-muted"
								>{lead.goalExcerpt}</span
							></td
						>
						<td class="px-6 py-6 align-top text-sm text-muted">{LEAD_TYPE_LABELS[lead.type]}</td>
						<td class="px-6 py-6 align-top"
							><Badge tone={TONES[lead.status]} class="text-xs tracking-normal normal-case"
								>{LEAD_STATUS_LABELS[lead.status]}</Badge
							></td
						>
						<td class="px-6 py-6 align-top text-sm leading-relaxed text-muted"
							><time datetime={lead.createdAt}>{formatDate(lead.createdAt)}</time></td
						>
					</tr>
				{/snippet}
			</Table>
		</div>
		<ul class="grid gap-4 md:hidden" aria-label="Список заявок">
			{#each data.leads as lead (lead.id)}
				<li>
					<Card class="p-6">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<span class="text-xs font-medium tracking-[.06em]">{lead.publicId}</span><Badge
								tone={TONES[lead.status]}
								class="text-xs tracking-normal normal-case">{LEAD_STATUS_LABELS[lead.status]}</Badge
							>
						</div>
						<h3 class="mt-6 text-lg font-semibold break-words">{lead.contactName}</h3>
						<p class="mt-2 text-sm leading-relaxed break-words text-muted">{lead.goalExcerpt}</p>
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
