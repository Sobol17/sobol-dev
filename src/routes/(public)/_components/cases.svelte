<script lang="ts">
	import { building } from '$app/environment';
	import { base } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import Section from '$lib/components/section.svelte';
	import Arrow from '$lib/components/arrow.svelte';
	import { Badge, Button } from '$lib/ui';
	import { page } from '$app/state';
	import { CASES, LABELS } from '../landing-content';
	const briefHref = (type: string) => {
		const params = new SvelteURLSearchParams(building ? '' : page.url.search);
		params.delete('/remote');
		params.set('type', type);
		return `${base}/?${params}#brief`;
	};
</script>

<Section id="cases" title={LABELS.casesTitle} lead={LABELS.casesIntro} class="case-section">
	<div class="grid gap-10 md:grid-cols-2 lg:gap-12">
		{#each CASES as item (item.id)}
			<article class="project reveal">
				<div class="case-image">
					<picture
						><source
							type="image/avif"
							srcset={item.cover.avif.replaceAll('/cases/', `${base}/cases/`)}
							sizes="(max-width: 767px) 100vw, 50vw"
						/><img
							src={`${base}${item.cover.src}`}
							srcset={item.cover.webp.replaceAll('/cases/', `${base}/cases/`)}
							sizes="(max-width: 767px) 100vw, 50vw"
							alt={item.cover.alt}
							width={item.cover.width}
							height={item.cover.height}
							loading="lazy"
							decoding="async"
						/></picture
					>
				</div>
				<div class="mt-6 flex items-start justify-between gap-4">
					<div>
						<div class="mb-4 flex flex-wrap gap-2">
							<Badge>{item.category}</Badge><Badge>{LABELS.concept}</Badge>
						</div>
						<h3>{item.title}</h3>
					</div>
					<Button
						href={briefHref(item.type)}
						data-type={item.type}
						variant="ghost"
						class="service-action mt-12"
						aria-label={item.cta}><Arrow /></Button
					>
				</div>
				<p class="project-description mt-4">{item.description}</p>
				<details class="project-details">
					<summary>{LABELS.caseDetails}</summary>
					<dl class="project-description grid gap-4">
						{#each [{ label: LABELS.task, value: item.task }, { label: LABELS.scenario, value: item.scenario }, { label: LABELS.role, value: item.role }, { label: LABELS.outcome, value: item.outcome }] as detail (detail.label)}<div
							>
								<dt class="font-semibold text-ink">{detail.label}</dt>
								<dd>{detail.value}</dd>
							</div>{/each}
					</dl>
				</details>
			</article>{/each}
	</div></Section
>
