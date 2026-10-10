<script lang="ts">
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button, Card } from '$lib/ui';
	import { BUDGET_LABELS, TIMELINE_LABELS, LEAD_TYPE_LABELS, formatDate } from '$lib/utils/format';
	import { getLead } from '../leads.remote';
	import StatusBadge from '../../../_components/lead-status-badge.svelte';
	import StatusForm from './status-form.svelte';
	import Notes from './notes.svelte';
	let { detail }: { detail: Awaited<ReturnType<typeof getLead>> } = $props();
	const lead = $derived(detail.lead);
	const fields = $derived([
		['Тип проекта', LEAD_TYPE_LABELS[lead.type]],
		['Бюджет', BUDGET_LABELS[lead.budget]],
		['Срок', TIMELINE_LABELS[lead.timeline]],
		['Почта', lead.contactEmail],
		['Telegram', lead.contactTelegram],
		['Получена', formatDate(lead.createdAt)],
		['Обновлена', formatDate(lead.updatedAt)],
		['Источник перехода', lead.referrer],
		['Оценка спама', String(lead.spamScore)],
		['Хеш IP', lead.ipHash],
		['Браузер', lead.userAgent]
	]);
</script>

<SeoHead
	title={`Заявка ${lead.publicId} · ${SITE.name}`}
	description="Карточка заявки и история работы."
	noindex
/>
<Button href="/admin/leads" variant="ghost" size="sm">← К списку заявок</Button>
<div class="mt-6 flex flex-wrap items-start justify-between gap-4">
	<div>
		<p class="text-xs tracking-[.1em] text-muted uppercase">Заявка {lead.publicId}</p>
		<h1 class="workspace-title mt-3 wrap-anywhere">{lead.contactName}</h1>
	</div>
	<div class="flex items-center gap-4">
		<StatusBadge status={lead.status} /><Button
			variant="secondary"
			size="sm"
			onclick={() => getLead(lead.id).refresh()}>Обновить</Button
		>
	</div>
</div>
<div class="mt-8 grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
	<div class="min-w-0">
		<Card padding="md"
			><h2 class="text-xl font-semibold tracking-[-.02em]">Задача</h2>
			<p class="mt-4 max-w-[62ch] text-base leading-6 wrap-anywhere whitespace-pre-wrap">
				{lead.goal}
			</p></Card
		>
		<Card padding="md" class="mt-6"
			><h2 class="mb-4 text-xl font-semibold tracking-[-.02em]">Статус заявки</h2>
			<StatusForm id={lead.id} status={lead.status} /></Card
		>
		<Notes id={lead.id} notes={detail.notes} />
	</div>
	<Card padding="md">
		<h2 class="text-xl font-semibold tracking-[-.02em]">Данные заявки</h2>
		<dl class="mt-4 grid gap-4">
			{#each fields as [label, value] (label)}
				<div>
					<dt class="text-xs leading-5 text-muted">{label}</dt>
					<dd class="mt-1 text-sm leading-6 wrap-anywhere">{value || 'Не указано'}</dd>
				</div>
			{/each}
		</dl>
		<h3 class="mt-6 border-t border-line pt-4 text-base font-semibold">UTM</h3>
		<dl class="mt-4 grid gap-4">
			{#each Object.entries(lead.utm) as [key, value] (key)}
				<div>
					<dt class="text-xs leading-5 text-muted">{key}</dt>
					<dd class="mt-1 text-sm leading-6 wrap-anywhere">{value || 'Не указано'}</dd>
				</div>
			{:else}<p class="text-sm text-muted">Метки не указаны</p>{/each}
		</dl>
	</Card>
</div>
