<script lang="ts">
	import { goto } from '$app/navigation';
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import {
		Button,
		Card,
		EmptyState,
		Field,
		Input,
		Pagination,
		Select,
		Skeleton,
		Tabs
	} from '$lib/ui';
	import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from '$lib/utils/format';
	import { leadStatusSchema, leadTypeSchema } from '$lib/schemas/lead';
	import { listLeads } from './leads.remote';
	import { listUrl } from './list-url';
	import LeadRows from '../../_components/lead-rows.svelte';
	import QuickStatus from './_components/quick-status.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const results = $derived(listLeads(data.filters));
	const statuses = [
		{ value: '', label: 'Все статусы' },
		...leadStatusSchema.options
			.filter((status) => status !== 'spam')
			.map((value) => ({ value, label: LEAD_STATUS_LABELS[value] }))
	];
	const types = [
		{ value: '', label: 'Все типы' },
		...leadTypeSchema.options.map((value) => ({ value, label: LEAD_TYPE_LABELS[value] }))
	];
</script>

<SeoHead title={`Заявки · ${SITE.name}`} description="Управление обращениями с сайта." noindex />
<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="workspace-title">Заявки</h1>
		<p class="mt-2 max-w-[46ch] text-sm leading-6 text-muted">
			Обращения с сайта, статусы и история работы
		</p>
	</div>
	<Button variant="secondary" size="sm" onclick={() => results.refresh()} disabled={results.loading}
		>Обновить</Button
	>
</div>
<div class="mt-6">
	<Tabs
		items={[
			{ value: 'active', label: 'Заявки' },
			{ value: 'spam', label: 'Спам' }
		]}
		bind:value={
			() => data.filters.view,
			(value) =>
				goto(
					listUrl({
						...data.filters,
						view: value === 'spam' ? 'spam' : 'active',
						status: '',
						page: 1
					})
				)
		}
	/>
</div>
<form
	method="GET"
	action="/admin/leads"
	class="mt-6 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto]"
>
	<input type="hidden" name="view" value={data.filters.view} />
	{#if data.filters.view !== 'spam'}
		<Field label="Статус" for="status"
			><Select name="status" value={data.filters.status} options={statuses} /></Field
		>
	{/if}
	<Field label="Тип проекта" for="type"
		><Select name="type" value={data.filters.type} options={types} /></Field
	>
	<Field label="Поиск" for="search"
		><Input
			name="search"
			type="search"
			value={data.filters.search}
			placeholder="Имя или задача"
			maxlength={120}
		/></Field
	>
	<Button type="submit" class="min-h-12">Найти</Button>
</form>
{#await results}
	<div class="mt-8"><Skeleton variant="block" /></div>
{:then result}
	<div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
		<Card padding="sm"
			><p class="text-sm text-muted">Новые заявки</p>
			<p class="mt-3 text-3xl font-semibold tabular-nums">{result.stats.fresh}</p></Card
		>
		<Card padding="sm"
			><p class="text-sm text-muted">Всего заявок</p>
			<p class="mt-3 text-3xl font-semibold tabular-nums">{result.stats.total}</p></Card
		>
		<Card padding="sm"
			><p class="text-sm text-muted">Спам</p>
			<p class="mt-3 text-3xl font-semibold tabular-nums">{result.stats.spam}</p></Card
		>
	</div>
	<section class="mt-8" aria-label="Результаты поиска">
		<div class="mb-4 flex flex-wrap justify-between gap-3 text-sm text-muted" aria-live="polite">
			<p>Найдено: {result.total}. Новые сверху</p>
			<Button href="/admin/leads" variant="ghost" size="sm">Сбросить фильтры</Button>
		</div>
		{#if result.leads.length}
			<LeadRows leads={result.leads} interactive>
				{#snippet action(lead)}<QuickStatus {lead} list={results} />{/snippet}
			</LeadRows>
		{:else}
			<Card padding="sm"
				><EmptyState
					title={data.filters.view === 'spam' ? 'Спама не найдено' : 'Заявок не найдено'}
					description="Измените фильтры или поисковый запрос."
					class="border-0"
				/></Card
			>
		{/if}
		<div class="mt-6">
			<Pagination
				page={result.page}
				pageCount={result.pageCount}
				onpage={(page) => goto(listUrl({ ...data.filters, page }))}
			/>
		</div>
	</section>
{:catch}
	<div class="mt-8">
		<EmptyState
			title="Не удалось загрузить заявки"
			description="Обновите страницу. Если сессия закончилась, войдите снова."
		>
			{#snippet action()}<Button href="/login" variant="secondary">Войти в CRM</Button>{/snippet}
		</EmptyState>
	</div>
{/await}
