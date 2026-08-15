<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/logo.svelte';
	import { ADMIN_NAV, cn } from '$lib/ui';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<div class="min-h-screen">
	<header class="border-b border-line bg-surface">
		<div class="container-page flex flex-wrap items-center justify-between gap-4 py-4">
			<a href="/admin" class="flex items-center gap-2.5">
				<Logo class="size-5 text-ink" />
				<span class="font-display text-[16px] tracking-[-.02em]" style="font-weight:700">
					Админка
				</span>
			</a>

			<nav class="order-3 w-full md:order-none md:w-auto">
				<ul class="flex flex-wrap gap-1">
					{#each ADMIN_NAV as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={page.url.pathname === item.href ? 'page' : undefined}
								class={cn(
									'rounded-pill px-4 py-2 text-[14px] transition',
									page.url.pathname === item.href
										? 'bg-invert text-invert-fg'
										: 'text-muted hover:text-ink'
								)}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="flex items-center gap-3">
				<span class="text-[14px] text-muted">{data.user.displayName}</span>
				<form method="POST" action="/logout">
					<button type="submit" class="text-[14px] text-muted transition hover:text-ink">
						Выйти
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="container-page py-10">
		{@render children()}
	</main>
</div>
