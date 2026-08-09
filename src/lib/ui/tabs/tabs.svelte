<script lang="ts">
	import { cn } from '../cn';

	interface Item {
		value: string;
		label: string;
	}

	interface Props {
		value?: string;
		items: Item[];
		class?: string;
	}

	let { value = $bindable(''), items, class: className }: Props = $props();

	/** Roving arrow keys are what makes a tablist a tablist for keyboard users. */
	function onKeydown(event: KeyboardEvent, index: number): void {
		const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (step === 0) return;
		event.preventDefault();
		const next = items[(index + step + items.length) % items.length];
		if (next) value = next.value;
	}
</script>

<div
	role="tablist"
	class={cn(
		'inline-flex flex-wrap gap-1 rounded-pill border border-line bg-surface p-1',
		className
	)}
>
	{#each items as item, index (item.value)}
		<button
			type="button"
			role="tab"
			aria-selected={value === item.value}
			tabindex={value === item.value ? 0 : -1}
			class={cn(
				'rounded-pill px-4 py-2 text-[14px] transition',
				value === item.value ? 'bg-invert text-invert-fg' : 'text-muted hover:text-ink'
			)}
			onclick={() => (value = item.value)}
			onkeydown={(event) => onKeydown(event, index)}
		>
			{item.label}
		</button>
	{/each}
</div>
