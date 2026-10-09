<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import { SITE } from '$lib/site';
	import Logo from '$lib/components/logo.svelte';
	import Arrow from '$lib/components/arrow.svelte';
	import { Button, PUBLIC_NAV } from '$lib/ui';
	import { PUBLIC_COPY as LABELS } from './public-content';
	let { children }: { children: Snippet } = $props();
	let menuOpen = $state(false);
	function close(event: KeyboardEvent) {
		if (event.key === 'Escape') menuOpen = false;
	}
</script>

<svelte:window onkeydown={close} />
<svg class="hidden" aria-hidden="true"
	><symbol id="arrow" viewBox="0 0 24 24"
		><path d="M5 19 19 5M5 5h14v14" fill="none" stroke="currentColor" stroke-width="1.5" /></symbol
	><symbol id="mark" viewBox="0 0 32 32"
		><path fill="var(--color-accent)" d="M3 3h10v10H3zM19 3h10v10H19zM3 19h10v10H3z" /><circle
			cx="24"
			cy="24"
			r="6"
			fill="var(--color-ink)"
		/></symbol
	></svg
>
<a href="#main" class="skip-link">{LABELS.skip}</a>
<header class="site-header">
	<div class="wrap flex items-center justify-between gap-8">
		<a href="/" class="brand"><Logo class="brand-mark" />{SITE.name}</a>
		<nav class="hidden items-center gap-8 lg:flex" aria-label="Основная навигация">
			{#each PUBLIC_NAV as item (item.href)}<a
					class="nav-link"
					aria-current={page.url.hash === item.href.slice(1) ? 'location' : undefined}
					href={page.url.pathname === '/' ? item.href.slice(1) : item.href}>{item.label}</a
				>{/each}
		</nav>
		<div class="flex items-center gap-4">
			<Button
				href={page.url.pathname === '/' ? '#brief' : '/#brief'}
				class="button button-primary header-cta hidden sm:inline-flex"
				>{LABELS.headerCta}<Arrow /></Button
			><Button
				variant="ghost"
				class="flex h-11 w-11 flex-col items-center justify-center gap-2 p-0 lg:hidden"
				aria-label={LABELS.menu}
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
				onclick={() => (menuOpen = !menuOpen)}
				><span class="h-px w-6 bg-ink"></span><span class="h-px w-6 bg-ink"></span></Button
			>
		</div>
	</div>
	{#if menuOpen}<nav id="mobile-menu" class="mobile-menu lg:hidden">
			{#each PUBLIC_NAV as item (item.href)}<a
					href={page.url.pathname === '/' ? item.href.slice(1) : item.href}
					onclick={() => (menuOpen = false)}>{item.label}</a
				>{/each}<a
				href={page.url.pathname === '/' ? '#brief' : '/#brief'}
				onclick={() => (menuOpen = false)}>{LABELS.headerCta}</a
			>
		</nav>{/if}
</header>
<main id="main">{@render children()}</main>
<footer class="wrap">
	<div class="footer-top">
		<div>
			<a href="/" class="brand"><Logo class="brand-mark" />{SITE.name}</a>
			<p class="mt-4 text-xs text-muted">{LABELS.tagline}</p>
		</div>
		<nav class="flex flex-wrap gap-x-8 gap-y-2" aria-label="Навигация в подвале">
			{#each PUBLIC_NAV as item (item.href)}<a
					href={page.url.pathname === '/' ? item.href.slice(1) : item.href}
					class="text-link">{item.label}</a
				>{/each}
		</nav>
	</div>
	<div class="footer-bottom">
		<p>© {new Date().getFullYear()} {SITE.name}</p>
		<details class="footer-legal">
			<summary>{LABELS.legalTitle}</summary>
			<p class="max-w-prose py-4 text-sm">{LABELS.legalText}</p>
		</details>
		<p>{LABELS.copyright}</p>
		<a href="#main">{LABELS.up}</a>
	</div>
</footer>
