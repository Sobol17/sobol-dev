<script lang="ts">
	import MediaPicture from '$lib/components/media-picture.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button } from '$lib/ui';
	import { PROJECT_CATEGORY_LABELS } from '$lib/utils/format';
	import { mediaUrl, pickVariant } from '$lib/utils/media';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const project = $derived(data.case);
	const coverKey = $derived(project.cover ? pickVariant(project.cover, 1600)?.key : undefined);

	const facts = $derived(
		[
			project.clientName ? { label: 'Клиент', value: project.clientName } : null,
			project.roleText ? { label: 'Роль', value: project.roleText } : null,
			project.year ? { label: 'Год', value: String(project.year) } : null,
			project.durationWeeks ? { label: 'Срок', value: `${project.durationWeeks} нед.` } : null
		].filter((fact) => fact !== null)
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: project.title,
		description: project.summary,
		datePublished: project.publishedAt ?? undefined,
		dateModified: project.updatedAt,
		keywords: project.tags.join(', '),
		author: { '@type': 'Organization', name: 'SobolDev' }
	});
</script>

<SeoHead
	title="{project.title} — кейс SobolDev"
	description={project.summary}
	image={coverKey ? mediaUrl(coverKey) : undefined}
	{jsonLd}
/>

<article class="pt-36 pb-20 md:pt-44 md:pb-28">
	<div class="container-page max-w-[880px]">
		<a
			href="/cases"
			class="font-mono text-[12px] text-muted transition hover:text-ink"
			data-sveltekit-preload-data="hover"
		>
			← Все кейсы
		</a>

		<div class="mt-6 flex flex-wrap items-center gap-2">
			<Badge tone="accent">{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
			{#each project.tags as tag (tag)}
				<Badge tone="neutral">{tag}</Badge>
			{/each}
		</div>

		<h1
			class="mt-6 font-display text-[36px] leading-[1.05] tracking-[-.035em] sm:text-[52px]"
			style="font-weight:700"
		>
			{project.title}
		</h1>
		<p class="mt-6 max-w-[54ch] text-[17px] leading-relaxed text-muted">{project.summary}</p>

		{#if facts.length > 0}
			<dl class="mt-10 grid gap-6 border-y border-line py-6 sm:grid-cols-4">
				{#each facts as fact (fact.label)}
					<div>
						<dt class="font-mono text-[11px] tracking-[.14em] text-muted uppercase">
							{fact.label}
						</dt>
						<dd class="mt-1 text-[15px]">{fact.value}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#if project.cover}
			<div class="mt-10 overflow-hidden rounded-card border border-line bg-surface">
				<MediaPicture
					image={project.cover}
					width={1600}
					sizes="(min-width: 880px) 880px, 100vw"
					eager
				/>
			</div>
		{/if}

		{#if project.metrics.length > 0}
			<ul class="mt-10 grid gap-4 sm:grid-cols-3">
				{#each project.metrics as metric (metric.label)}
					<li class="rounded-card border border-line bg-surface p-6">
						<p class="font-display text-[28px] tracking-[-.02em]" style="font-weight:700">
							{metric.value}
						</p>
						<p class="mt-2 text-[14px] text-muted">{metric.label}</p>
					</li>
				{/each}
			</ul>
		{/if}

		<!-- Markdown was sanitized in the service: the renderer escapes input and emits its own tags. -->
		<svelte:boundary>
			<div
				class="prose mt-12 max-w-none prose-neutral dark:prose-invert prose-headings:font-display prose-headings:tracking-[-.02em] prose-a:text-accent"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html project.bodyHtml}
			</div>

			{#snippet failed()}
				<p class="mt-12 text-[15px] text-muted">Текст кейса временно недоступен.</p>
			{/snippet}
		</svelte:boundary>

		{#if project.gallery.length > 0}
			<ul class="mt-12 grid gap-6">
				{#each project.gallery as image (image.id)}
					<li>
						<figure class="overflow-hidden rounded-card border border-line bg-surface">
							<MediaPicture {image} width={1600} sizes="(min-width: 880px) 880px, 100vw" />
							{#if image.caption}
								<figcaption class="px-6 py-4 text-[13px] text-muted">{image.caption}</figcaption>
							{/if}
						</figure>
					</li>
				{/each}
			</ul>
		{/if}

		{#if project.liveUrl || project.repoUrl}
			<div class="mt-12 flex flex-wrap gap-3">
				{#if project.liveUrl}
					<Button href={project.liveUrl} variant="secondary" size="md">Смотреть вживую</Button>
				{/if}
				{#if project.repoUrl}
					<Button href={project.repoUrl} variant="ghost" size="md">Исходный код</Button>
				{/if}
			</div>
		{/if}

		<div class="mt-16 rounded-card border border-accent bg-accent-soft p-8 md:p-10">
			<h2 class="font-display text-[26px] tracking-[-.02em]" style="font-weight:600">
				Нужен похожий проект?
			</h2>
			<p class="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink/70">
				Соберите бриф за пару минут. Разберу задачу и пришлю смету с фиксированной ценой.
			</p>
			<Button href="/lead" size="lg" class="mt-8">Собрать бриф</Button>
		</div>
	</div>
</article>
