<script lang="ts">
	import ProjectCard from '$lib/components/project-card.svelte';
	import Section from '$lib/components/section.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card, RadioCards } from '$lib/ui';
	import { LEAD_TYPE_LABELS } from '$lib/utils/format';
	import type { LeadType } from '$lib/types';
	import type { PageProps } from './$types';
	import { DIRECTIONS, FAQ, FINAL_CTA, HERO, PROCESS, STACK } from './landing-content';

	let { data }: PageProps = $props();

	const leadTypes = (['web', 'mobile', 'tma', 'other'] as LeadType[]).map((value) => ({
		value,
		label: LEAD_TYPE_LABELS[value]
	}));

	let picked = $state<LeadType | ''>('');
	// Without JS the button still points at the form; the picked type only saves a click.
	const briefHref = $derived(picked === '' ? '/lead' : `/lead?type=${picked}`);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ProfessionalService',
		name: 'SobolDev',
		description: HERO.lead,
		areaServed: 'RU',
		serviceType: DIRECTIONS.map((direction) => direction.title)
	};
</script>

<SeoHead
	title="SobolDev — сайты, мобильные приложения и Telegram Mini Apps"
	description="Студия разработки SobolDev: fullstack-веб, мобильные приложения на Flutter и React Native, Telegram Mini Apps. Смета и коммерческое предложение в течение дня."
	{jsonLd}
/>

<section id="top" class="relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
	<div
		class="pointer-events-none absolute -top-24 -left-32 size-[420px] rounded-full bg-accent-soft blur-[90px]"
	></div>
	<div
		class="pointer-events-none absolute top-40 -right-24 size-[380px] rounded-full bg-accent-soft blur-[90px]"
	></div>

	<div class="container-page relative">
		<p
			class="mb-6 flex items-center justify-center gap-2 font-mono text-[11px] tracking-[.18em] text-muted uppercase"
		>
			<span class="inline-block size-1.5 rounded-pill bg-accent"></span>
			{HERO.eyebrow}
		</p>

		<h1
			class="mx-auto max-w-[15ch] text-center font-display text-[40px] leading-[1.02] tracking-[-.035em] sm:text-[58px] md:text-[76px]"
			style="font-weight:700"
		>
			{HERO.titleStart} <span class="text-accent">{HERO.titleAccent}</span>
		</h1>

		<p
			class="mx-auto mt-7 max-w-[52ch] text-center text-[16px] leading-relaxed text-muted md:text-[18px]"
		>
			{HERO.lead}
		</p>

		<div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<Button href="/lead" size="lg" class="w-full sm:w-auto">{HERO.primaryCta}</Button>
			<Button href="/cases" variant="secondary" size="lg" class="w-full sm:w-auto">
				{HERO.secondaryCta}
			</Button>
		</div>

		<dl class="mx-auto mt-16 grid max-w-[720px] gap-8 sm:grid-cols-3">
			{#each HERO.facts as fact (fact.label)}
				<div class="text-center">
					<dt class="font-display text-[30px] tracking-[-.02em]" style="font-weight:700">
						{fact.value}
					</dt>
					<dd class="mt-2 text-[14px] leading-relaxed text-muted">{fact.label}</dd>
				</div>
			{/each}
		</dl>
	</div>
</section>

<Section
	id="services"
	eyebrow="Направления"
	title="Три вещи, которые я делаю хорошо"
	lead="Всё остальное честно отдаю тем, кто делает это лучше меня."
>
	<div class="grid gap-6 md:grid-cols-3">
		{#each DIRECTIONS as direction (direction.id)}
			<Card padding="lg" class="grid content-start gap-5">
				<Badge tone="accent">{direction.meta}</Badge>
				<h3 class="font-display text-[22px] tracking-[-.02em]" style="font-weight:600">
					{direction.title}
				</h3>
				<p class="text-[15px] leading-relaxed text-muted">{direction.description}</p>
				<ul class="grid gap-2 text-[14px]">
					{#each direction.bullets as bullet (bullet)}
						<li class="flex gap-2.5">
							<span class="mt-2 inline-block size-1.5 shrink-0 rounded-pill bg-accent"></span>
							<span>{bullet}</span>
						</li>
					{/each}
				</ul>
				<a
					href="/lead?type={direction.id}"
					class="font-mono text-[13px] text-accent underline underline-offset-4"
				>
					Обсудить задачу →
				</a>
			</Card>
		{/each}
	</div>
</Section>

<Section
	id="process"
	eyebrow="Процесс"
	title="От брифа до релиза за четыре шага"
	lead="Никаких скрытых этапов: вы видите работающую сборку каждую неделю."
	class="bg-surface"
>
	<ol class="grid gap-6 md:grid-cols-4">
		{#each PROCESS as step (step.number)}
			<li class="grid gap-3 border-t border-line pt-6">
				<span class="font-mono text-[12px] text-accent">{step.number}</span>
				<h3 class="font-display text-[20px] tracking-[-.02em]" style="font-weight:600">
					{step.title}
				</h3>
				<p class="text-[14px] leading-relaxed text-muted">{step.text}</p>
			</li>
		{/each}
	</ol>
</Section>

<Section id="stack" eyebrow="Стек" title="На чём собираю">
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each STACK as group (group.group)}
			<Card padding="md" class="grid content-start gap-4">
				<p class="font-mono text-[11px] tracking-[.14em] text-muted uppercase">{group.group}</p>
				<ul class="flex flex-wrap gap-2">
					{#each group.items as item (item)}
						<li><Badge tone="neutral">{item}</Badge></li>
					{/each}
				</ul>
			</Card>
		{/each}
	</div>
</Section>

{#if data.featured.length > 0}
	<Section
		id="cases"
		eyebrow="Кейсы"
		title="Что уже работает"
		lead="Задача, решение и результат по каждому проекту."
	>
		<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.featured as project (project.id)}
				<li><ProjectCard {project} /></li>
			{/each}
		</ul>

		<div class="mt-10">
			<Button href="/cases" variant="secondary" size="md">Все кейсы</Button>
		</div>
	</Section>
{/if}

<Section id="faq" eyebrow="Вопросы" title="Что спрашивают чаще всего" class="bg-surface">
	<div class="grid max-w-[820px] gap-3">
		{#each FAQ as item (item.question)}
			<details class="group rounded-card border border-line bg-paper px-6 py-5">
				<summary class="flex cursor-pointer items-center justify-between gap-4 text-[16px]">
					{item.question}
					<span class="font-mono text-muted transition group-open:rotate-45">+</span>
				</summary>
				<p class="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-muted">{item.answer}</p>
			</details>
		{/each}
	</div>
</Section>

<Section id="brief">
	<div class="rounded-card border border-accent bg-accent-soft p-8 md:p-12">
		<h2
			class="max-w-[16ch] font-display text-[30px] leading-[1.1] tracking-[-.03em] sm:text-[40px]"
			style="font-weight:700"
		>
			{FINAL_CTA.title}
		</h2>
		<p class="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-ink/70">{FINAL_CTA.text}</p>

		<div class="mt-8 grid gap-6">
			<RadioCards name="landing-type" options={leadTypes} bind:value={picked} columns={4} />
			<div>
				<Button href={briefHref} size="lg">{FINAL_CTA.button}</Button>
			</div>
		</div>
	</div>
</Section>
