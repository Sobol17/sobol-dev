<script lang="ts">
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Button } from '$lib/ui';
	import Arrow from '$lib/components/arrow.svelte';
	import { page } from '$app/state';
	import { COPY, SERVICES, LABELS } from '../landing-content';
	const briefHref = (type: string) => {
		const params = new SvelteURLSearchParams(page.url.search);
		params.delete('/remote');
		params.set('type', type);
		return `/?${params}#brief`;
	};
</script>

<section id="services" class="wrap pb-8" aria-labelledby="services-title">
	<div class="solutions-shell reveal">
		<div class="solutions-intro">
			<p class="eyebrow mb-5">{COPY.services.eyebrow}</p>
			<h2 id="services-title" class="section-title">
				{COPY.services.titleStart}<br />{COPY.services.titleEnd}
			</h2>
			<p class="body-copy">{COPY.services.description}</p>
			<Button href="#brief" variant="ghost" class="text-link mt-6 px-0"
				>{COPY.services.cta}<svg class="arrow" aria-hidden="true"><use href="#arrow" /></svg
				></Button
			>
		</div>
		<div id="services-list">
			{#each SERVICES as item (item.title)}<details class="service-item">
					<summary
						><svg class="service-icon" viewBox="0 0 32 32" aria-hidden="true"
							><path d={item.icon} /></svg
						>
						<h3>{item.title}</h3></summary
					>
					<p>{item.text}</p>
					<div class="service-formats">{item.formats}</div>
					<Button
						variant="ghost"
						href={briefHref(item.type)}
						data-type={item.type}
						class="text-link px-0">{LABELS.serviceCta} <Arrow /></Button
					>
				</details>{/each}
		</div>
	</div>
</section>
