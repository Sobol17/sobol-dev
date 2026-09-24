<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import ProjectCard from '$lib/components/project-card.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button, EmptyState, Pagination, Tabs } from '$lib/ui';
	import { PROJECT_CATEGORY_LABELS } from '$lib/utils/format';
	import type { ProjectCategory } from '$lib/types';
	import type { PageProps } from './$types';

	const PAGE_SIZE = 9;
	const ALL = 'all';

	let { data }: PageProps = $props();

	const filters = [
		{ value: ALL, label: 'Все' },
		...(Object.keys(PROJECT_CATEGORY_LABELS) as ProjectCategory[]).map((value) => ({
			value,
			label: PROJECT_CATEGORY_LABELS[value]
		}))
	];

	let category = $state(page.url.searchParams.get('category') ?? ALL);
	let current = $state(1);

	const filtered = $derived(
		category === ALL ? data.cases : data.cases.filter((item) => item.category === category)
	);
	const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	// Clamped instead of reset: switching the filter cannot strand the visitor on an empty page.
	const currentPage = $derived(Math.min(current, pageCount));
	const shown = $derived(
		filtered.slice((currentPage - 1) * PAGE_SIZE, (currentPage - 1) * PAGE_SIZE + PAGE_SIZE)
	);

	// Filtering happens in the browser; the address bar is the external state kept in sync.
	$effect(() => {
		const url = new URL(page.url);
		if (category === ALL) url.searchParams.delete('category');
		else url.searchParams.set('category', category);

		if (url.href !== page.url.href) replaceState(url, page.state);
	});
</script>

<SeoHead
	title="Кейсы — SobolDev"
	description="Работы SobolDev: веб-сервисы, Telegram Mini Apps и мобильные приложения. Задачи и принятые решения в каждом проекте."
/>

<section class="pt-36 pb-20 md:pt-44 md:pb-28">
	<div class="container-page">
		<p class="mb-4 text-[12px] font-semibold tracking-[.08em] text-accent uppercase">Работы</p>
		<h1
			class="max-w-[16ch] font-display text-[36px] leading-[1.05] tracking-[-.035em] sm:text-[52px]"
			style="font-weight:700"
		>
			Проекты и решения
		</h1>
		<p class="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-muted">
			В каждом проекте показываем задачу, подход и то, что было реализовано.
		</p>

		<div class="mt-10 flex flex-wrap items-center gap-4">
			<Tabs bind:value={category} items={filters} />
			<p class="font-mono text-[12px] text-muted">{filtered.length} в подборке</p>
		</div>

		{#if shown.length === 0}
			<EmptyState
				class="mt-12"
				title="В этой категории пока пусто"
				description="Соседние вкладки не пустые, а свежие проекты появляются здесь после релиза."
			>
				{#snippet action()}
					<Button href="/lead" size="md">Обсудить задачу</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<ul class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each shown as project, index (project.id)}
					<li><ProjectCard {project} eager={index < 3} /></li>
				{/each}
			</ul>

			<Pagination
				class="mt-12 justify-center"
				page={currentPage}
				{pageCount}
				onpage={(next) => (current = next)}
			/>
		{/if}
	</div>
</section>
