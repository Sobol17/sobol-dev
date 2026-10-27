<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { leads } from '$lib/server/db/schema';
	import { BUDGET_LABELS, TIMELINE_LABELS, LEAD_TYPE_LABELS, formatDate } from '$lib/utils/format';
	import StatusBadge from '../../../_components/lead-status-badge.svelte';
	let { lead, children }: { lead: typeof leads.$inferSelect; children?: Snippet } = $props();
	const fields = $derived([
		['Тип проекта', LEAD_TYPE_LABELS[lead.type]],
		['Бюджет', BUDGET_LABELS[lead.budget]],
		['Срок', TIMELINE_LABELS[lead.timeline]],
		['Обновлена', formatDate(lead.updatedAt)]
	]);
	const source = $derived([
		['Источник перехода', lead.referrer],
		['Оценка спама', String(lead.spamScore)],
		...Object.entries(lead.utm).map(([key, value]) => [`UTM ${key}`, value]),
		['Хеш IP', lead.ipHash],
		['Браузер', lead.userAgent]
	]);
</script>

<div class="grid gap-6">
	<section aria-label="Клиент">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<StatusBadge status={lead.status} /><time
				class="text-xs leading-5 text-muted"
				datetime={lead.createdAt.toISOString()}>{formatDate(lead.createdAt)}</time
			>
		</div>
		<h2 class="mt-4 text-2xl leading-tight font-semibold tracking-[-.03em] wrap-anywhere">
			{lead.contactName}
		</h2>
		<dl class="mt-4 grid gap-3 text-sm leading-6">
			<div>
				<dt class="text-xs text-muted">Почта</dt>
				<dd class="wrap-anywhere">{lead.contactEmail || 'Не указана'}</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">Telegram</dt>
				<dd class="wrap-anywhere">{lead.contactTelegram || 'Не указан'}</dd>
			</div>
		</dl>
	</section>
	<section class="rounded-card bg-accent-soft p-6" aria-label="Задача">
		<h3 class="text-base font-semibold">Задача</h3>
		<p class="mt-3 max-w-[62ch] text-sm leading-6 wrap-anywhere whitespace-pre-wrap">{lead.goal}</p>
	</section>
	<dl class="grid grid-cols-2 gap-6">
		{#each fields as [label, value] (label)}<div class="min-w-0">
				<dt class="text-xs leading-5 text-muted">{label}</dt>
				<dd class="mt-1 text-sm leading-6 wrap-anywhere">{value}</dd>
			</div>{/each}
	</dl>
	{#if children}<div class="border-t border-line pt-6">{@render children()}</div>{/if}
	<details class="border-t border-line pt-4">
		<summary class="cursor-pointer py-3 text-sm font-semibold"
			>Источник и технические данные</summary
		>
		<dl class="mt-4 grid gap-4">
			{#each source as [label, value] (label)}<div>
					<dt class="text-xs leading-5 text-muted">{label}</dt>
					<dd class="mt-1 text-sm leading-6 wrap-anywhere">{value || 'Не указано'}</dd>
				</div>{/each}
		</dl>
		{#if !Object.keys(lead.utm).length}<p class="mt-4 text-sm text-muted">
				UTM-метки не указаны
			</p>{/if}
	</details>
</div>
