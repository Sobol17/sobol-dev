<script lang="ts">
	import ProjectCard from '$lib/components/project-card.svelte';
	import Section from '$lib/components/section.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card, RadioCards, cn } from '$lib/ui';
	import { LEAD_TYPE_LABELS } from '$lib/utils/format';
	import type { LeadType, ProjectCategory } from '$lib/types';
	import type { PageProps } from './$types';
	import { DIRECTIONS, FAQ, FINAL_CTA, HERO, PROCESS, STACK } from './landing-content';

	let { data }: PageProps = $props();

	/**
	 * Hero backdrop: one outlined canvas per direction, in the proportion that direction ships in.
	 * The geometry lives here, the words stay in `landing-content.ts`.
	 */
	const HERO_FRAMES: Record<
		ProjectCategory,
		{ place: string; tilt: string; box: string; label: string; delay: string }
	> = {
		web: {
			place: 'top-[46%] left-[max(1.5rem,calc(50%-668px))]',
			tilt: '-rotate-3',
			box: 'w-[236px] aspect-[16/10] rounded-[14px]',
			label: 'text-left',
			delay: '0s'
		},
		mobile: {
			place: 'top-[40%] right-[max(1.5rem,calc(50%-650px))]',
			tilt: 'rotate-6',
			box: 'ml-auto w-[112px] aspect-[9/19] rounded-[22px]',
			label: 'text-right',
			delay: '-5s'
		},
		tma: {
			place: 'bottom-[7%] left-[max(1.5rem,calc(50%-620px))]',
			tilt: 'rotate-2',
			box: 'w-[132px] aspect-[4/5] rounded-[18px]',
			label: 'text-left',
			delay: '-10s'
		}
	};

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
	<div class="hero-wash pointer-events-none absolute inset-0"></div>
	<div class="hero-grid pointer-events-none absolute inset-0"></div>

	{#each DIRECTIONS as direction (direction.id)}
		{@const frame = HERO_FRAMES[direction.id]}
		<div
			class={cn('pointer-events-none absolute hidden select-none xl:block', frame.place)}
			aria-hidden="true"
		>
			<div class="float-slow" style="animation-delay:{frame.delay}">
				<div class={frame.tilt}>
					<div
						class={cn(
							'grid content-start gap-2 border border-line bg-surface/60 p-3 shadow-lift backdrop-blur-[2px]',
							frame.box
						)}
					>
						<span class="h-1.5 w-1/2 rounded-pill bg-line"></span>
						<span class="mt-1 h-8 rounded-[8px] bg-accent/10"></span>
						<span class="h-1.5 w-full rounded-pill bg-line"></span>
						<span class="h-1.5 w-2/3 rounded-pill bg-line"></span>
					</div>
					<p
						class={cn(
							'mt-3 font-mono text-[10px] tracking-[.16em] text-muted uppercase',
							frame.label
						)}
					>
						{direction.id} · {direction.meta}
					</p>
				</div>
			</div>
		</div>
	{/each}

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
			<Card padding="md" class="flex flex-col gap-4">
				<p class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">{direction.meta}</p>
				<h3
					class="font-display text-[19px] leading-[1.25] tracking-[-.02em] text-balance"
					style="font-weight:600"
				>
					{direction.title}
				</h3>
				<p class="text-[14px] leading-relaxed text-muted">{direction.description}</p>
				<ul class="grid gap-1.5 text-[14px]">
					{#each direction.bullets as bullet (bullet)}
						<li class="flex gap-2.5">
							<span class="mt-[9px] inline-block size-1 shrink-0 rounded-pill bg-accent"></span>
							<span>{bullet}</span>
						</li>
					{/each}
				</ul>
				<!-- `mt-auto` pins the link to the card floor, so all three line up whatever the copy runs to. -->
				<a
					href="/lead?type={direction.id}"
					class="mt-auto border-t border-line pt-4 font-mono text-[12px] text-accent transition hover:text-ink"
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
