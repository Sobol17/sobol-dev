<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/ui';

	interface Props {
		id?: string;
		eyebrow?: string;
		title?: string;
		lead?: string;
		class?: string;
		children: Snippet;
	}

	let { id, eyebrow, title, lead, class: className, children }: Props = $props();
</script>

<section {id} class={cn('py-20 md:py-28', className)}>
	<div class="container-page">
		{#if eyebrow || title || lead}
			<div class="mb-12 flex flex-col gap-5 md:mb-16 md:flex-row md:items-end md:justify-between">
				<div>
					{#if eyebrow}
						<p class="mb-4 font-mono text-[11px] tracking-[.18em] text-muted uppercase">
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
					<p class="max-w-[38ch] text-[15px] leading-relaxed text-muted">{lead}</p>
				{/if}
			</div>
		{/if}

		{@render children()}
	</div>
</section>
