<script lang="ts">
	import type { ProjectCard } from '$lib/types';
	import { Badge, Card } from '$lib/ui';
	import { PROJECT_CATEGORY_LABELS } from '$lib/utils/format';
	import MediaPicture from './media-picture.svelte';

	interface Props {
		project: ProjectCard;
		eager?: boolean;
	}

	let { project, eager = false }: Props = $props();
</script>

<Card href="/cases/{project.slug}" padding="sm" class="group grid gap-5 overflow-hidden">
	<div class="aspect-[16/10] overflow-hidden rounded-field bg-paper">
		{#if project.cover}
			<MediaPicture
				image={project.cover}
				width={800}
				sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
				{eager}
				class="duration-slow transition group-hover:scale-[1.03]"
			/>
		{:else}
			<div class="grid h-full place-items-center font-mono text-[12px] text-muted">
				{PROJECT_CATEGORY_LABELS[project.category]}
			</div>
		{/if}
	</div>

	<div class="grid gap-3 px-1 pb-1">
		<div class="flex flex-wrap items-center gap-2">
			<Badge tone="accent">{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
			{#if project.featured}
				<Badge tone="neutral">избранное</Badge>
			{/if}
		</div>

		<h3 class="font-display text-[22px] tracking-[-.02em]" style="font-weight:600">
			{project.title}
		</h3>
		<p class="text-[14px] leading-relaxed text-muted">{project.summary}</p>

		{#if project.tags.length > 0}
			<p class="font-mono text-[12px] text-muted">{project.tags.join(' · ')}</p>
		{/if}
	</div>
</Card>
