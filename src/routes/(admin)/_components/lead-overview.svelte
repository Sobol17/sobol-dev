<script lang="ts">
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button, Card, EmptyState } from '$lib/ui';
	import type { LeadListItem } from '$lib/types';
	import { base } from '$app/paths';
	let {
		data
	}: {
		data: { leads: LeadListItem[]; stats: { leads: number; newLeads: number } };
	} = $props();
	import LeadRows from './lead-rows.svelte';
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
		<LeadRows leads={data.leads} />
	{:else}
		<Card class="p-0"
			><EmptyState
				title="Заявок пока нет"
				description="Здесь появятся обращения, которые клиенты отправят через форму на сайте."
				class="border-0 py-16"
			>
				{#snippet action()}<Button href={`${base}/#brief`} variant="secondary"
						>Открыть форму на сайте</Button
					>{/snippet}
			</EmptyState></Card
		>
	{/if}
</section>
