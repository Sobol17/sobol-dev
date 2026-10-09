<script lang="ts">
	import { SITE } from '$lib/site';
	import { Card } from '$lib/ui';
	import { COPY } from '../landing-content';
	import LeadForm from '../_lead/lead-form.svelte';
	import type { LeadType } from '$lib/types';
	let { initialType }: { initialType?: LeadType } = $props();
</script>

<section id="brief" class="contact-section" aria-labelledby="brief-title">
	<div class="wrap contact-grid">
		<div class="reveal">
			<h2 id="brief-title" class="contact-title">
				{COPY.brief.titleStart}<br />{COPY.brief.titleMiddle}<br /><em>{COPY.brief.titleAccent}</em>
			</h2>
			<p class="body-copy mt-8 max-w-sm">{COPY.brief.description}</p>
			<div class="mt-10 flex flex-col items-start gap-4">
				<a href={`mailto:${SITE.email}`} class="contact-link">{SITE.email} ↗</a><a
					href={SITE.telegram.href}
					class="text-link"
					>{COPY.brief.telegramCta}<svg class="arrow text-accent" aria-hidden="true"
						><use href="#arrow" /></svg
					></a
				>
			</div>
		</div>
		<Card class="brief-panel reveal border-0 p-6 sm:p-8"><LeadForm {initialType} /></Card>
	</div>
</section>
