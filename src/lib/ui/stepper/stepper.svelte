<script lang="ts">
	import { cn } from '../cn';

	interface Props {
		step: number;
		steps: string[];
		class?: string;
	}

	let { step, steps, class: className }: Props = $props();
</script>

<ol class={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
	{#each steps as label, index (label)}
		<li class="flex items-center gap-2">
			<span
				class={cn(
					'grid size-6 place-items-center rounded-pill font-mono text-[11px]',
					index < step && 'bg-accent text-white',
					index === step && 'bg-invert text-invert-fg',
					index > step && 'border border-line text-muted'
				)}
				aria-current={index === step ? 'step' : undefined}
			>
				{index + 1}
			</span>
			<span class={cn('text-[14px]', index === step ? 'text-ink' : 'text-muted')}>{label}</span>
			{#if index < steps.length - 1}
				<span class="hidden h-px w-8 bg-line sm:block" aria-hidden="true"></span>
			{/if}
		</li>
	{/each}
</ol>
