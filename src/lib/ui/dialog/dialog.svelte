<script lang="ts">
	import type { Snippet } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import { Dialog as BitsDialog } from 'bits-ui';
	import { cn } from '../cn';

	interface Props {
		open?: boolean;
		title: string;
		description?: string;
		placement?: 'center' | 'right';
		class?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		placement = 'center',
		class: className,
		children,
		footer
	}: Props = $props();
	const right = $derived(placement === 'right');
	function panelTransition(node: Element, entering: boolean) {
		const token = entering ? '--duration-base' : '--duration-fast';
		return fly(node, {
			x: right ? node.getBoundingClientRect().width : 0,
			duration: prefersReducedMotion.current
				? 0
				: parseFloat(getComputedStyle(node).getPropertyValue(token)),
			opacity: entering ? 1 : 0
		});
	}
</script>

<BitsDialog.Root bind:open>
	<BitsDialog.Portal>
		<BitsDialog.Overlay class="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm" />
		<BitsDialog.Content forceMount>
			{#snippet child({ props })}
				{#if open}
					<div
						{...props}
						in:panelTransition={true}
						out:panelTransition={false}
						class={cn(
							'fixed z-50 border border-line bg-surface shadow-lift',
							right
								? 'inset-y-0 right-0 flex h-dvh w-full max-w-2xl flex-col sm:rounded-l-card'
								: 'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card p-8',
							className
						)}
					>
						<div class={right ? 'relative shrink-0 border-b border-line p-6 pr-20' : 'pr-8'}>
							<BitsDialog.Title class="font-display text-[22px] font-semibold tracking-[-.02em]"
								>{title}</BitsDialog.Title
							>
							{#if description}<BitsDialog.Description
									class="mt-2 max-w-[46ch] text-sm leading-6 text-muted"
									>{description}</BitsDialog.Description
								>{/if}
							<BitsDialog.Close
								class="absolute top-5 right-5 grid size-11 place-items-center rounded-pill border border-line bg-surface transition hover:bg-accent-soft"
								aria-label="Закрыть"
							>
								<svg
									viewBox="0 0 24 24"
									class="size-4"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
								>
							</BitsDialog.Close>
						</div>
						<div class={right ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain p-6' : 'mt-6'}>
							{@render children()}
						</div>
						{#if footer}<div
								class={cn(
									'flex flex-wrap items-center justify-end gap-3',
									right ? 'shrink-0 border-t border-line p-6' : 'mt-8'
								)}
							>
								{@render footer()}
							</div>{/if}
					</div>
				{/if}
			{/snippet}
		</BitsDialog.Content>
	</BitsDialog.Portal>
</BitsDialog.Root>
