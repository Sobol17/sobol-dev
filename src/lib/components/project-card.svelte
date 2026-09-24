<script lang="ts">
	import type { ProjectCard } from '$lib/types';
	import { Card, cn } from '$lib/ui';
	import { PROJECT_CATEGORY_LABELS } from '$lib/utils/format';
	import MediaPicture from './media-picture.svelte';

	type Tone = 'light' | 'dark';

	interface Props {
		project: ProjectCard;
		eager?: boolean;
		/** The landing shows the featured block on a night ground, the case list stays on paper. */
		tone?: Tone;
	}

	let { project, eager = false, tone = 'light' }: Props = $props();

	const TONES: Record<
		Tone,
		{ card: string; cover: string; quiet: string; category: string; arrow: string; summary: string }
	> = {
		light: {
			card: 'h-full hover:border-ink/25',
			cover: 'bg-paper',
			quiet: 'text-muted',
			category: 'text-accent',
			summary: 'text-muted',
			arrow: 'border-line group-hover:border-accent group-hover:bg-accent group-hover:text-white'
		},
		dark: {
			card: 'h-full border-white/10 bg-night2 hover:border-white/25',
			cover: 'bg-night',
			quiet: 'text-white/65',
			category: 'text-accent-bright',
			summary: 'text-white/75',
			arrow: 'border-white/15 group-hover:border-accent group-hover:bg-accent'
		}
	};

	const tokens = $derived(TONES[tone]);
</script>

<Card
	href="/cases/{project.slug}"
	padding="sm"
	class={cn('group grid gap-5 overflow-hidden', tokens.card)}
>
	{#if project.cover}
		<div class={cn('aspect-[16/10] overflow-hidden rounded-field', tokens.cover)}>
			<MediaPicture
				image={project.cover}
				width={800}
				sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
				{eager}
				class="transition-transform duration-200 group-hover:scale-[1.02]"
			/>
		</div>
	{/if}

	<div
		class={cn(
			'flex items-start justify-between gap-4 px-1 pb-1',
			!project.cover && 'min-h-52 pt-3'
		)}
	>
		<div class="grid gap-2">
			<p class={cn('text-[11px] font-semibold tracking-[.1em] uppercase', tokens.category)}>
				{PROJECT_CATEGORY_LABELS[project.category]}
			</p>

			<h3 class="font-display text-[22px] leading-[1.2] font-semibold tracking-[-.03em]">
				{project.title}
			</h3>
			<p class={cn('text-[14px] leading-relaxed', tokens.summary)}>{project.summary}</p>
		</div>

		<span
			class={cn(
				'mt-1 grid size-9 shrink-0 place-items-center rounded-pill border transition',
				tokens.arrow
			)}
			aria-hidden="true"
		>
			<svg
				viewBox="0 0 24 24"
				class="size-4"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M7 17L17 7M9 7h8v8" />
			</svg>
		</span>
	</div>
</Card>
