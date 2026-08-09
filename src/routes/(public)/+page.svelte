<script lang="ts">
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button } from '$lib/ui';
</script>

<SeoHead
	title="SobolDev — сайты, мобильные приложения и Telegram Mini Apps"
	description="Студия разработки SobolDev: fullstack-веб, мобильные приложения на Flutter и React Native, Telegram Mini Apps. Смета и коммерческое предложение в течение дня."
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
			Студия разработки · беру 2 проекта в месяц
		</p>

		<h1
			class="mx-auto max-w-[15ch] text-center font-display text-[40px] leading-[1.02] tracking-[-.035em] sm:text-[58px] md:text-[76px]"
			style="font-weight:700"
		>
			Сайты, приложения и <span class="text-accent">Telegram Mini&nbsp;Apps</span>
		</h1>

		<p
			class="mx-auto mt-7 max-w-[52ch] text-center text-[16px] leading-relaxed text-muted md:text-[18px]"
		>
			SobolDev — небольшая студия. Веду проект от брифа до релиза: интерфейс, код, публикация в
			сторах и поддержка. Заявку разбираю в день обращения и присылаю смету с фиксированной ценой.
		</p>

		<div class="mt-9 flex justify-center">
			<Button href="/lead" size="lg" class="w-full sm:w-auto">Собрать бриф за 40 секунд</Button>
		</div>
	</div>
</section>
