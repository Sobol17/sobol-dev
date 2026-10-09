<script lang="ts">
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import Arrow from '$lib/components/arrow.svelte';
	import { Button, Card } from '$lib/ui';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<SeoHead
	title={`Бриф отправлен · ${SITE.name}`}
	description="Мы получили вашу заявку и свяжемся по указанному контакту."
	noindex
/>

<section class="page-stage wrap" aria-labelledby="thanks-title">
	<div class="page-split">
		<div>
			<div
				class="mb-8 flex size-16 items-center justify-center rounded-pill bg-accent-soft text-accent"
				aria-hidden="true"
			>
				<svg class="size-8" viewBox="0 0 32 32" fill="none"
					><path
						d="m7 16 6 6L25 9"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</div>
			<h1 id="thanks-title" class="page-title">Бриф <span class="text-accent">отправлен</span></h1>
			<p class="page-intro">
				Спасибо, что рассказали о задаче. Мы получили бриф и свяжемся с вами по указанному контакту.
			</p>
			{#if data.publicId}
				<p class="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted">
					Номер заявки <strong
						class="rounded-pill border border-line px-4 py-2 font-medium tracking-[.08em] text-ink"
						>{data.publicId}</strong
					>
				</p>
			{/if}
			<div class="mt-10 flex flex-wrap gap-4">
				<Button href="/" size="lg">На главную <Arrow /></Button>
				<Button href={SITE.telegram.href} variant="ghost" size="lg" target="_blank" rel="noopener"
					>Написать в Telegram</Button
				>
			</div>
		</div>
		<Card class="border-night bg-night p-8 text-white sm:p-10">
			<h2 class="text-3xl leading-tight tracking-[-.03em]">Что будет дальше</h2>
			<ol class="mt-8 divide-y divide-white/20">
				<li class="flex gap-4 pb-8">
					<span class="pt-1 text-sm text-accent-bright">01</span>
					<div>
						<h3 class="text-xl leading-7">Разберём задачу</h3>
						<p class="mt-3 max-w-[46ch] leading-relaxed text-white/75">
							Посмотрим, что вы хотите разработать и какие процессы нужно упростить.
						</p>
					</div>
				</li>
				<li class="flex gap-4 pt-8">
					<span class="pt-1 text-sm text-accent-bright">02</span>
					<div>
						<h3 class="text-xl leading-7">Обсудим детали с вами</h3>
						<p class="mt-3 max-w-[46ch] leading-relaxed text-white/75">
							Уточним требования и предложим состав работ, чтобы оценить стоимость проекта.
						</p>
					</div>
				</li>
			</ol>
			<p class="mt-10 border-t border-white/20 pt-6 text-sm leading-relaxed text-white/75">
				Хотите дополнить бриф? Напишите на <a
					class="break-all text-white underline underline-offset-4"
					href={`mailto:${SITE.email}`}>{SITE.email}</a
				>{#if data.publicId}
					и укажите номер заявки{/if}.
			</p>
		</Card>
	</div>
</section>
