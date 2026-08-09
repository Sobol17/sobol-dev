<script lang="ts">
	import { fly } from 'svelte/transition';
	import { getToastStore, type ToastTone } from '$lib/state/toast.svelte';
	import { cn } from '../cn';

	const store = getToastStore();

	const TONES: Record<ToastTone, string> = {
		neutral: 'border-line bg-surface text-ink',
		success: 'border-success/40 bg-surface text-ink',
		danger: 'border-danger/40 bg-surface text-ink'
	};
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-4 z-50 grid justify-items-center gap-2 px-4"
	role="status"
	aria-live="polite"
>
	{#each store.items as toast (toast.id)}
		<div
			transition:fly={{ y: 12, duration: 200 }}
			class={cn(
				'pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded-field border p-4 text-[14px] shadow-lift',
				TONES[toast.tone]
			)}
		>
			<span class="flex-1">{toast.text}</span>
			<button
				type="button"
				class="text-muted transition hover:text-ink"
				aria-label="Закрыть"
				onclick={() => store.dismiss(toast.id)}
			>
				<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</div>
	{/each}
</div>
