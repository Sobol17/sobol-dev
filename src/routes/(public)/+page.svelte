<script lang="ts">
	import ProjectCard from '$lib/components/project-card.svelte';
	import Section from '$lib/components/section.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button, cn } from '$lib/ui';
	import type { ProjectCategory } from '$lib/types';
	import type { PageProps } from './$types';
	import { DIRECTIONS, FAQ, FAQ_INTRO, FINAL_CTA, HERO, PROCESS } from './landing-content';

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

	const HERO_FRAME_LABELS: { id: ProjectCategory; meta: string }[] = [
		{ id: 'web', meta: 'в браузере' },
		{ id: 'mobile', meta: 'на устройстве' },
		{ id: 'tma', meta: 'в Telegram' }
	];

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
	title="SobolDev — веб-сервисы и Telegram Mini Apps для бизнеса"
	description="Проектирование и разработка веб-сервисов и Telegram Mini Apps для малого и среднего бизнеса: продажи, запись, клиентский сервис и интеграции."
	image="/og-home.png"
	{jsonLd}
/>

<section id="top" class="relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
	<div class="hero-wash pointer-events-none absolute inset-0"></div>
	<div class="hero-grid pointer-events-none absolute inset-0"></div>

	{#each HERO_FRAME_LABELS as direction (direction.id)}
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
			class="mx-auto max-w-[20ch] text-center font-sans text-[40px] leading-[1.02] tracking-[-.035em] sm:text-[58px] md:text-[76px]"
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
					<dt class="font-sans text-[30px] tracking-[-.02em]" style="font-weight:700">
						{fact.value}
					</dt>
					<dd class="mt-2 text-[14px] leading-relaxed text-muted">{fact.label}</dd>
				</div>
			{/each}
		</dl>
	</div>
</section>

{#if data.featured.length > 0}
	<Section
		id="cases"
		tone="dark"
		eyebrow="Выбор работ"
		title="Проекты"
		lead="Задача и решение — в каждом кейсе. Показываем то, что уже сделано."
	>
		<ul class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.featured as project (project.id)}
				<li><ProjectCard {project} tone="dark" /></li>
			{/each}
		</ul>
		<div class="mt-8">
			<a
				href="/cases"
				class="inline-flex items-center gap-2 border-b border-accent-bright pb-1 text-[14px] font-medium text-accent-bright hover:text-white"
			>
				Все работы <span aria-hidden="true">↗</span>
			</a>
		</div>
	</Section>
{/if}

<Section
	id="services"
	eyebrow="Что делаем"
	title="Два формата. Одна задача — польза для бизнеса."
	lead="Выбираем формат под ваш сценарий и аудиторию, а не под моду."
	class="border-t border-line bg-surface"
>
	<div class="grid border-t border-line md:grid-cols-2">
		{#each DIRECTIONS as direction (direction.id)}
			<article
				class="border-b border-line py-8 md:px-8 md:py-10 md:first:pl-0 md:last:border-l md:last:pl-10"
			>
				<p class="text-[12px] font-semibold tracking-[.08em] text-accent uppercase">
					{direction.meta}
				</p>
				<h3
					class="mt-6 font-display text-[28px] leading-[1.15] font-semibold tracking-[-.035em] sm:text-[34px]"
				>
					{direction.title}
				</h3>
				<p class="mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
					{direction.description}
				</p>
				<ul class="mt-7 grid gap-2 text-[14px] text-ink">
					{#each direction.bullets as bullet (bullet)}
						<li class="flex gap-3">
							<span class="text-accent" aria-hidden="true">—</span>{bullet}
						</li>
					{/each}
				</ul>
				<a
					href="/lead?type={direction.id}"
					class="mt-9 inline-flex items-center gap-2 border-b border-accent pb-1 text-[14px] font-medium text-accent hover:text-ink"
				>
					Обсудить задачу <span aria-hidden="true">↗</span>
				</a>
			</article>
		{/each}
	</div>
</Section>

<Section
	id="process"
	eyebrow="Как работаем"
	title="От задачи до запуска"
	lead="Каждый этап понятен заранее. По ходу работы показываем не отчёты, а сам продукт."
>
	<ol class="grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
		{#each PROCESS as step (step.number)}
			<li class="border-t border-line pt-5">
				<span class="text-[12px] font-semibold text-accent">{step.number}</span>
				<h3 class="mt-5 text-[19px] leading-[1.25] font-semibold tracking-[-.02em]">
					{step.title}
				</h3>
				<p class="mt-3 text-[14px] leading-[1.6] text-muted">{step.text}</p>
			</li>
		{/each}
	</ol>
</Section>

<Section id="faq" class="border-t border-line bg-surface">
	<div class="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-16">
		<div class="md:sticky md:top-28 md:self-start">
			<p class="mb-4 text-[12px] font-semibold tracking-[.08em] text-accent uppercase">
				{FAQ_INTRO.eyebrow}
			</p>
			<h2
				class="font-display text-[36px] leading-[1.1] font-semibold tracking-[-.035em] sm:text-[44px]"
			>
				{FAQ_INTRO.title}
			</h2>
			<p class="mt-5 max-w-[36ch] text-[15px] leading-[1.6] text-muted">{FAQ_INTRO.text}</p>
			<a
				href={FAQ_INTRO.contactHref}
				target="_blank"
				rel="noopener"
				class="mt-6 inline-block border-b border-accent pb-1 text-[14px] font-medium text-accent hover:text-ink"
				>{FAQ_INTRO.contactLabel}</a
			>
		</div>
		<div class="border-t border-line">
			{#each FAQ as item (item.question)}
				<details name="faq" class="details-reveal group border-b border-line">
					<summary
						class="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[16px] leading-[1.4] font-medium hover:text-accent [&::-webkit-details-marker]:hidden"
					>
						{item.question}
						<span class="shrink-0 text-[18px] text-accent group-open:rotate-45" aria-hidden="true"
							>+</span
						>
					</summary>
					<p class="max-w-[62ch] pb-6 text-[15px] leading-[1.6] text-muted">{item.answer}</p>
				</details>
			{/each}
		</div>
	</div>
</Section>

<Section id="brief" class="border-t border-line">
	<div class="grid gap-7 border-t-2 border-accent pt-8 md:grid-cols-[1fr_auto] md:items-end">
		<div>
			<p class="mb-5 text-[12px] font-semibold tracking-[.08em] text-accent uppercase">
				Начнём с разговора
			</p>
			<h2
				class="max-w-[20ch] font-display text-[36px] leading-[1.1] font-semibold tracking-[-.04em] sm:text-[48px]"
			>
				{FINAL_CTA.title}
			</h2>
			<p class="mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-muted">{FINAL_CTA.text}</p>
		</div>
		<Button href="/lead" size="lg" class="w-full md:w-auto"
			>{FINAL_CTA.button} <span aria-hidden="true">↗</span></Button
		>
	</div>
</Section>
