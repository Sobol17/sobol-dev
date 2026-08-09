<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog as BitsDialog } from 'bits-ui';
	import { cn } from '../cn';

	interface Props {
		open?: boolean;
		title: string;
		description?: string;
		class?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		class: className,
		children,
		footer
	}: Props = $props();
</script>

<BitsDialog.Root bind:open>
	<BitsDialog.Portal>
		<BitsDialog.Overlay class="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm" />
		<BitsDialog.Content
			class={cn(
				'fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2',
				'max-h-[calc(100vh-2rem)] overflow-y-auto rounded-card border border-line bg-surface p-8 shadow-lift',
				className
			)}
		>
			<BitsDialog.Title class="font-display text-[22px] tracking-[-.02em]" style="font-weight:600">
				{title}
			</BitsDialog.Title>

			{#if description}
				<BitsDialog.Description class="mt-2 text-[14px] leading-relaxed text-muted">
					{description}
				</BitsDialog.Description>
			{/if}

			<div class="mt-6">
				{@render children()}
			</div>

			{#if footer}
				<div class="mt-8 flex flex-wrap items-center justify-end gap-3">
					{@render footer()}
				</div>
			{/if}

			<BitsDialog.Close
				class="absolute top-5 right-5 grid size-9 place-items-center rounded-pill border border-line transition hover:bg-paper"
				aria-label="Закрыть"
			>
				<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</BitsDialog.Close>
		</BitsDialog.Content>
	</BitsDialog.Portal>
</BitsDialog.Root>
