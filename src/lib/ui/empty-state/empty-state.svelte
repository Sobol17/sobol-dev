<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '../cn';

	interface Props {
		title: string;
		description?: string;
		action?: Snippet;
		class?: string;
	}

	let { title, description, action, class: className }: Props = $props();
</script>

<div
	class={cn(
		'grid justify-items-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center',
		className
	)}
>
	<p class="font-display text-[20px] tracking-[-.02em]" style="font-weight:600">{title}</p>
	{#if description}
		<p class="max-w-[46ch] text-[14px] leading-relaxed text-muted">{description}</p>
	{/if}
	{#if action}
		<div class="mt-2">{@render action()}</div>
	{/if}
</div>
