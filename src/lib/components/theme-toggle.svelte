<script lang="ts">
	import { ThemeStore } from '$lib/state/theme.svelte';

	const theme = new ThemeStore();
</script>

<button
	type="button"
	role="switch"
	aria-checked={theme.current === 'dark'}
	aria-label="Тёмная тема"
	class="relative h-6 w-11 shrink-0 rounded-pill border border-line bg-paper transition hover:border-ink/30"
	onclick={() => theme.toggle()}
>
	<span
		class="absolute top-[2px] left-[2px] grid size-[18px] place-items-center rounded-pill bg-invert text-invert-fg transition-transform duration-300"
		style={theme.current === 'dark' ? 'transform:translateX(20px)' : undefined}
	>
		{#if theme.current === 'dark'}
			<svg
				viewBox="0 0 24 24"
				class="size-[11px]"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
			>
				<circle cx="12" cy="12" r="4.5" />
				<path
					d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"
				/>
			</svg>
		{:else}
			<svg
				viewBox="0 0 24 24"
				class="size-[11px]"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8z" />
			</svg>
		{/if}
	</span>
</button>
