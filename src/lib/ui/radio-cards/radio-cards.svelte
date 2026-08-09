<script lang="ts">
	import { cn } from '../cn';

	interface Option {
		value: string;
		label: string;
		description?: string;
		icon?: string;
	}

	interface Props {
		value?: string;
		options: Option[];
		name: string;
		columns?: 2 | 3 | 4;
		class?: string;
	}

	let { value = $bindable(''), options, name, columns = 2, class: className }: Props = $props();

	const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-3',
		4: 'sm:grid-cols-2 lg:grid-cols-4'
	};
</script>

<!-- Real radio inputs under the cards: keyboard, screen readers and no-JS submits all work. -->
<div class={cn('grid gap-3', COLUMN_CLASS[columns], className)} role="radiogroup">
	{#each options as option (option.value)}
		<label
			class={cn(
				'group flex cursor-pointer items-start gap-3 rounded-card border p-5 transition',
				'has-[:checked]:border-ink has-[:checked]:bg-accent-soft',
				'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
				value === option.value ? 'border-ink bg-accent-soft' : 'border-line bg-surface'
			)}
		>
			<input
				type="radio"
				{name}
				value={option.value}
				bind:group={value}
				class="mt-1 size-4 shrink-0 accent-accent"
			/>
			<span class="grid gap-1">
				<span class="flex items-center gap-2 text-[15px] font-medium text-ink">
					{#if option.icon}<span aria-hidden="true">{option.icon}</span>{/if}
					{option.label}
				</span>
				{#if option.description}
					<span class="text-[13px] leading-relaxed text-muted">{option.description}</span>
				{/if}
			</span>
		</label>
	{/each}
</div>
