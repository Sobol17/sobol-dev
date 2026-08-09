<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/ui';
</script>

<svelte:head><title>{page.status} — SobolDev</title></svelte:head>

<main class="grid min-h-screen place-items-center px-5">
	<div class="max-w-[420px] text-center">
		<p class="font-mono text-[13px] tracking-[.18em] text-accent uppercase">Ошибка {page.status}</p>
		<h1 class="mt-4 font-display text-[32px] tracking-[-.03em]" style="font-weight:700">
			{page.status === 404 ? 'Страница не найдена' : 'Что-то сломалось'}
		</h1>
		<p class="mt-4 text-[15px] leading-relaxed text-muted">{page.error?.message}</p>
		{#if page.error?.requestId}
			<p class="mt-2 font-mono text-[12px] text-muted">id: {page.error.requestId}</p>
		{/if}
		<Button href="/" class="mt-8">На главную</Button>
	</div>
</main>
