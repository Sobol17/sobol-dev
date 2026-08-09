<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '../cn';

	type Padding = 'sm' | 'md' | 'lg';

	interface Props {
		padding?: Padding;
		href?: string;
		class?: string;
		children: Snippet;
	}

	let { padding = 'md', href, class: className, children }: Props = $props();

	const PADDINGS: Record<Padding, string> = {
		sm: 'p-5',
		md: 'p-7',
		lg: 'p-10'
	};

	const classes = $derived(
		cn('block rounded-card border border-line bg-surface transition', PADDINGS[padding], className)
	);
</script>

{#if href}
	<a {href} class={cn(classes, 'hover:-translate-y-1 hover:shadow-lift')}>
		{@render children()}
	</a>
{:else}
	<div class={classes}>
		{@render children()}
	</div>
{/if}
