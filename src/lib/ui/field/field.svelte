<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '../cn';

	interface Props {
		label: string;
		/** Wire the control's id here so the label points at it. */
		for?: string;
		hint?: string;
		error?: string;
		required?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		label,
		for: forId,
		hint,
		error,
		required = false,
		class: className,
		children
	}: Props = $props();
</script>

<div class={cn('grid gap-2', className)}>
	<label class="text-[14px] font-medium text-ink" for={forId}>
		{label}
		{#if required}<span class="text-accent" aria-hidden="true">*</span>{/if}
	</label>

	{@render children()}

	{#if error}
		<p class="text-[13px] text-danger" role="alert">{error}</p>
	{:else if hint}
		<p class="text-[13px] text-muted">{hint}</p>
	{/if}
</div>
