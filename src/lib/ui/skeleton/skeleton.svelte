<script lang="ts">
	import { cn } from '../cn';

	interface Props {
		variant?: 'text' | 'block';
		lines?: number;
		class?: string;
	}

	let { variant = 'text', lines = 3, class: className }: Props = $props();
</script>

{#if variant === 'block'}
	<div class={cn('h-40 animate-pulse rounded-card bg-line', className)} aria-hidden="true"></div>
{:else}
	<div class={cn('grid gap-2', className)} aria-hidden="true">
		{#each { length: lines }, index (index)}
			<div
				class="h-3 animate-pulse rounded-pill bg-line"
				style={index === lines - 1 ? 'width:60%' : undefined}
			></div>
		{/each}
	</div>
{/if}
