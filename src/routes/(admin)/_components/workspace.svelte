<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { SITE } from '$lib/site';
	import Logo from '$lib/components/logo.svelte';
	import { ADMIN_NAV, Button, Dialog, cn } from '$lib/ui';
	let {
		user,
		children,
		exit
	}: { user: { displayName: string }; children: Snippet; exit?: Snippet } = $props();
	let menuOpen = $state(false);

	afterNavigate(() => {
		menuOpen = false;
	});
	onMount(() => {
		const desktop = window.matchMedia('(min-width: 1024px)');
		const closeOnDesktop = () => {
			if (desktop.matches) menuOpen = false;
		};
		desktop.addEventListener('change', closeOnDesktop);
		return () => desktop.removeEventListener('change', closeOnDesktop);
	});
</script>

{#snippet navigation()}
	<nav aria-label="Навигация CRM">
		<ul class="grid gap-2">
			{#each ADMIN_NAV as item (item.href)}
				<li>
					<a
						href={`${base}${item.href}`}
						onclick={() => {
							menuOpen = false;
						}}
						aria-current={page.url.pathname.replace(/\/$/, '') === `${base}${item.href}`
							? 'page'
							: undefined}
						class={cn(
							'flex min-h-12 items-center gap-3 rounded-field px-4 py-3 text-sm font-medium transition-colors',
							page.url.pathname.replace(/\/$/, '') === `${base}${item.href}`
								? 'bg-night text-white'
								: 'text-muted hover:bg-accent-soft hover:text-ink'
						)}
					>
						<svg
							class="size-5 shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"><path d="M4 4h16v16H4zM4 14h5l1.5 3h3l1.5-3h5M8 8h8M8 11h5" /></svg
						>
						{item.label}
						{#if page.url.pathname.replace(/\/$/, '') === `${base}${item.href}`}<span
								class="ml-auto size-2 rounded-pill bg-accent-bright"
								aria-hidden="true"
							></span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/snippet}

{#snippet account()}
	<div class="border-t border-line pt-6">
		<div class="flex items-center gap-3 px-2">
			<span
				class="grid size-10 shrink-0 place-items-center rounded-pill bg-accent-soft text-sm font-semibold"
				aria-hidden="true">{user.displayName.trim().slice(0, 1).toUpperCase()}</span
			>
			<div class="min-w-0">
				<p class="text-sm font-medium wrap-anywhere">{user.displayName}</p>
				<p class="mt-1 text-xs text-muted">Администратор</p>
			</div>
		</div>
		{#if exit}<div class="mt-4">{@render exit()}</div>{:else}<form
				method="POST"
				action={`${base}/logout`}
				class="mt-4"
			>
				<Button
					type="submit"
					variant="ghost"
					size="sm"
					class="min-h-11 w-full justify-start px-4 text-muted"
				>
					<svg
						class="size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						aria-hidden="true"><path d="M10 4H4v16h6M9 12h11m-4-4 4 4-4 4" /></svg
					>Выйти
				</Button>
			</form>{/if}
	</div>
{/snippet}

<div class="workspace crm-shell">
	<a href="#workspace-main" class="skip-link">Перейти к заявкам</a>
	<aside class="crm-sidebar" aria-label="Боковая панель">
		<a href={`${base}/admin/`} class="brand px-2"
			><Logo class="size-8" />{SITE.name}<span
				class="ml-auto text-xs font-medium tracking-[.08em] text-muted">CRM</span
			></a
		>
		<div class="mt-10">{@render navigation()}</div>
		<div class="mt-auto pt-8">{@render account()}</div>
	</aside>
	<div class="crm-body">
		<header class="crm-toolbar">
			<div class="flex min-w-0 items-center gap-3">
				<Button
					variant="ghost"
					class="size-11 shrink-0 p-0 lg:hidden"
					aria-label="Открыть навигацию"
					aria-haspopup="dialog"
					aria-expanded={menuOpen}
					onclick={() => {
						menuOpen = true;
					}}
				>
					<svg
						class="size-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg
					>
				</Button>
				<span class="text-sm font-medium">Работа с заявками</span>
			</div>
			<Button href={`${base}/`} variant="ghost" size="sm" class="min-h-11 shrink-0"
				>На сайт<svg
					class="size-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg
				></Button
			>
		</header>
		<main id="workspace-main" class="workspace-main" tabindex="-1">{@render children()}</main>
	</div>
</div>

<Dialog
	bind:open={menuOpen}
	title="Навигация CRM"
	class="crm-drawer top-0 left-0 h-dvh max-h-dvh w-80 max-w-[calc(100vw-3rem)] translate-x-0 translate-y-0 rounded-none border-0 border-r p-6 [&>[data-dialog-title]]:text-base [&>button]:top-4 [&>button]:right-4 [&>button]:size-11"
>
	<div class="flex h-full flex-col gap-8">
		<a
			href={`${base}/admin/`}
			class="brand"
			onclick={() => {
				menuOpen = false;
			}}><Logo class="size-8" />{SITE.name}</a
		>
		{@render navigation()}
		<div class="mt-auto">{@render account()}</div>
	</div>
</Dialog>
