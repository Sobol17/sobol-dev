<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/ui';

	type Tone = 'light' | 'dark';

	interface Props {
		id?: string;
		eyebrow?: string;
		title?: string;
		lead?: string;
		/** Dark sections carry their own text colors: `text-muted` dies on a near-black ground. */
		tone?: Tone;
		class?: string;
		children: Snippet;
	}

	let { id, eyebrow, title, lead, tone = 'light', class: className, children }: Props = $props();

	const TONES: Record<Tone, { section: string; quiet: string; lead: string }> = {
		light: { section: '', quiet: 'text-muted', lead: 'text-muted' },
		dark: { section: 'bg-night text-white', quiet: 'text-white/65', lead: 'text-white/75' }
	};

	const tokens = $derived(TONES[tone]);
</script>

<section {id} class={cn('py-20 md:py-28', tokens.section, className)}>
	<div class="container-page">
		{#if eyebrow || title || lead}
			<div class="mb-12 flex flex-col gap-5 md:mb-16 md:flex-row md:items-end md:justify-between">
				<div>
					{#if eyebrow}
						<p class={cn('mb-4 font-mono text-[11px] tracking-[.18em] uppercase', tokens.quiet)}>
							{eyebrow}
						</p>
					{/if}
					{#if title}
						<h2
							class="max-w-[18ch] font-display text-[32px] leading-[1.08] tracking-[-.03em] sm:text-[44px]"
							style="font-weight:700"
						>
							{title}
						</h2>
					{/if}
				</div>
				{#if lead}
					<p class={cn('max-w-[38ch] text-[15px] leading-relaxed', tokens.lead)}>{lead}</p>
				{/if}
			</div>
		{/if}

		{@render children()}
	</div>
</section>
