<script lang="ts">
	import '../../src/app.css';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { setToastStore } from '$lib/state/toast.svelte';
	import { Button, Toast } from '$lib/ui';
	let { children } = $props();
	setToastStore();
</script>

<div class="demo-bar">
	<p>
		<strong>Демо</strong><span class="hidden sm:inline">
			· Вымышленные данные, без отправки заявок</span
		>
	</p>
	<nav aria-label="Демонстрация" class="flex gap-2">
		<Button
			href={`${base}/`}
			size="sm"
			variant="ghost"
			aria-current={page.url.pathname === `${base}/` ? 'page' : undefined}>Лендинг</Button
		>
		<Button
			href={`${base}/admin/`}
			size="sm"
			variant="secondary"
			aria-current={page.url.pathname.includes('/admin') ? 'page' : undefined}>Открыть CRM</Button
		>
	</nav>
</div>
{@render children()}
<Toast />

<style>
	.demo-bar {
		position: sticky;
		top: 0;
		z-index: 40;
		min-height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 4px 24px;
		background: var(--color-night);
		color: white;
		font-size: 12px;
	}
	.demo-bar :global(a) {
		min-height: 44px;
	}
	.demo-bar :global(a:not(.border)) {
		color: white;
	}
	.demo-bar :global(a:not(.border):hover) {
		color: var(--color-ink);
	}
	:global(.site-header) {
		top: 56px;
	}
	:global(.crm-sidebar) {
		top: 56px;
		height: calc(100dvh - 56px);
	}
	:global(.crm-shell) {
		min-height: calc(100dvh - 56px);
	}
	:global(section[id]) {
		scroll-margin-top: 152px;
	}
	@media (max-width: 600px) {
		.demo-bar {
			padding-inline: 16px;
		}
	}
</style>
