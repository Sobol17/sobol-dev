<script lang="ts">
	import Logo from '$lib/components/logo.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button, PUBLIC_NAV } from '$lib/ui';

	let { children } = $props();

	let menuOpen = $state(false);
</script>

<header class="fixed inset-x-0 top-0 z-40 px-4 pt-4">
	<nav
		class="mx-auto max-w-page rounded-[22px] border border-line bg-surface/80 shadow-nav backdrop-blur-xl"
	>
		<div class="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
			<a href="/" class="flex shrink-0 items-center gap-2.5">
				<Logo class="size-6 text-ink" />
				<span class="font-display text-[17px] tracking-[-.02em]" style="font-weight:700">
					SobolDev
				</span>
			</a>

			<ul class="hidden items-center gap-7 text-[14px] text-ink/75 md:flex">
				{#each PUBLIC_NAV as item (item.href)}
					<li><a class="transition hover:text-ink" href={item.href}>{item.label}</a></li>
				{/each}
			</ul>

			<div class="flex items-center gap-2">
				<ThemeToggle />
				<Button href="/lead" size="md" class="hidden sm:inline-flex">Получить КП</Button>
				<button
					type="button"
					class="grid size-10 place-items-center rounded-pill border border-line md:hidden"
					aria-label="Меню"
					aria-expanded={menuOpen}
					onclick={() => (menuOpen = !menuOpen)}
				>
					<svg
						viewBox="0 0 24 24"
						class="size-4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
					>
						<path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
					</svg>
				</button>
			</div>
		</div>

		{#if menuOpen}
			<div class="border-t border-line px-5 py-4 md:hidden">
				<ul class="grid gap-3 text-[15px]">
					{#each PUBLIC_NAV as item (item.href)}
						<li>
							<a class="block py-1" href={item.href} onclick={() => (menuOpen = false)}>
								{item.label}
							</a>
						</li>
					{/each}
					<li>
						<Button href="/lead" size="lg" class="mt-1 w-full">Получить КП</Button>
					</li>
				</ul>
			</div>
		{/if}
	</nav>
</header>

<main>
	{@render children()}
</main>

<footer class="border-t border-line py-12">
	<div class="container-page flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
		<div class="flex items-center gap-2.5">
			<Logo class="size-5 text-ink" />
			<span class="font-display text-[16px] tracking-[-.02em]" style="font-weight:700">
				SobolDev
			</span>
		</div>

		<div class="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[13px]">
			<a
				href="https://t.me/soboldev"
				target="_blank"
				rel="noopener"
				class="text-muted transition hover:text-ink">@soboldev</a
			>
			<a href="mailto:hello@soboldev.ru" class="text-muted transition hover:text-ink">
				hello@soboldev.ru
			</a>
		</div>

		<p class="font-mono text-[12px] text-muted">© 2026 SobolDev</p>
	</div>
</footer>
