<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button } from '$lib/ui';

	const publicId = $derived(page.url.searchParams.get('id'));
</script>

<SeoHead
	title="Заявка отправлена — SobolDev"
	description="Заявка принята. Отвечу в течение рабочего дня."
	noindex
/>

<section class="pt-36 pb-20 md:pt-44 md:pb-28">
	<div class="container-page max-w-[640px]">
		<div class="rounded-card border border-accent bg-accent-soft p-8 md:p-10">
			<h1 class="font-display text-[28px] tracking-[-.02em]" style="font-weight:600">
				Бриф отправлен
			</h1>

			{#if publicId}
				<p class="mt-4 font-mono text-[13px] text-muted">
					Номер заявки: <span class="text-ink">{publicId}</span>
				</p>
			{/if}

			<p class="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink/70">
				Посмотрю задачу и вернусь с вопросами или сразу со сметой в течение рабочего дня. Если
				срочно, пишите в Telegram
				<a
					href="https://t.me/soboldev"
					target="_blank"
					rel="noopener"
					class="font-medium text-accent underline underline-offset-4">@soboldev</a
				>.
			</p>

			<Button href="/" variant="secondary" size="md" class="mt-8">На главную</Button>
		</div>
	</div>
</section>
