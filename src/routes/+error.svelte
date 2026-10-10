<script lang="ts">
	import { base } from '$app/paths';
	import { SITE } from '$lib/site';
	import { page } from '$app/state';
	import PublicShell from '$lib/components/public-shell.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import Arrow from '$lib/components/arrow.svelte';
	import { Button, Card } from '$lib/ui';
	const missing = $derived(page.status === 404);
	const title = $derived(missing ? 'Такой страницы нет' : 'Не удалось открыть страницу');
</script>

<SeoHead title={`${page.status} · ${SITE.name}`} description={title} noindex />
<PublicShell>
	<section class="page-stage wrap" aria-labelledby="error-title">
		<div class="page-split">
			<div>
				<h1 id="error-title" class="page-title">{title}</h1>
				<p class="page-intro">
					{missing
						? 'Возможно, ссылка устарела или в адресе есть опечатка. На главной можно посмотреть наши решения и рассказать о своей задаче.'
						: 'Попробуйте открыть её позже. Если ошибка повторяется, напишите нам и укажите код обращения ниже.'}
				</p>
				<div class="mt-10 flex flex-wrap gap-4">
					<Button href={`${base}/`} size="lg">На главную <Arrow /></Button>
					<Button href={`${base}/#brief`} variant="secondary" size="lg">Обсудить проект</Button>
				</div>
				{#if !missing && page.error?.requestId}
					<p class="mt-8 text-sm leading-relaxed text-muted">
						Код обращения <span class="mt-2 block break-all text-ink">{page.error.requestId}</span>
					</p>
				{/if}
			</div>
			<Card
				class="flex min-h-72 flex-col justify-between border-night bg-night p-8 text-white sm:p-10"
			>
				<span class="error-number" aria-hidden="true">{page.status}</span>
				<div class="mt-8 border-t border-white/20 pt-6">
					<p class="text-lg">{missing ? 'Нужна помощь с проектом?' : 'Сообщить об ошибке'}</p>
					<a
						href={`mailto:${SITE.email}`}
						class="mt-3 inline-flex items-center gap-3 text-sm break-all text-white/75 underline underline-offset-4"
						>{SITE.email} <Arrow /></a
					>
				</div>
			</Card>
		</div>
	</section>
</PublicShell>
