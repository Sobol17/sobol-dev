<script lang="ts">
	import { page } from '$app/state';
	import { SITE } from '$lib/site';
	import Logo from '$lib/components/logo.svelte';
	import { ADMIN_NAV, Button, cn } from '$lib/ui';
	import type { LayoutData } from './$types';
	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<div class="workspace">
	<a href="#workspace-main" class="skip-link">Перейти к заявкам</a>
	<header class="border-b border-line bg-surface">
		<div class="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-6">
			<a href="/admin" class="brand"
				><Logo class="brand-mark" />{SITE.name}<span
					class="ml-2 hidden border-l border-line pl-4 text-sm font-medium tracking-normal text-muted sm:inline"
					>CRM</span
				></a
			>
			<nav class="order-3 w-full md:order-none md:w-auto" aria-label="Навигация CRM">
				<ul class="flex gap-2">
					{#each ADMIN_NAV as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={page.url.pathname === item.href ? 'page' : undefined}
								class={cn(
									'inline-flex min-h-11 items-center gap-2 rounded-pill px-6 text-sm font-medium transition-colors',
									page.url.pathname === item.href
										? 'bg-night text-white'
										: 'text-muted hover:bg-accent-soft hover:text-ink'
								)}>{item.label}</a
							>
						</li>
					{/each}
				</ul>
			</nav>
			<div class="flex items-center gap-2 sm:gap-4">
				<span class="hidden max-w-40 truncate text-sm text-muted sm:block"
					>{data.user.displayName}</span
				>
				<Button href="/" variant="ghost" size="sm" class="min-h-11">На сайт</Button>
				<form method="POST" action="/logout">
					<Button type="submit" variant="secondary" size="sm" class="min-h-11">Выйти</Button>
				</form>
			</div>
		</div>
	</header>
	<main id="workspace-main" class="workspace-main wrap">{@render children()}</main>
	<footer class="wrap border-t border-line py-6 text-sm text-muted">
		<span>{SITE.name}</span><span class="ml-4">Работа с заявками</span>
	</footer>
</div>
