<script lang="ts">
	import { SITE } from '$lib/site';
	import { COPY, FAQ } from '../landing-content';
</script>

<section id="faq" class="wrap pb-24 md:pb-28" aria-labelledby="faq-title">
	<div class="faq-shell">
		<div class="reveal">
			<h2 id="faq-title" class="section-title">{COPY.faq.titleStart}<br />{COPY.faq.titleEnd}</h2>
			<a href={SITE.telegram.href} class="text-link mt-6"
				>{COPY.faq.cta}<svg class="arrow text-accent" aria-hidden="true"><use href="#arrow" /></svg
				></a
			>
		</div>
		<div class="reveal">
			{#each FAQ as item (item.question)}<details class="faq-item">
					<summary>{item.question}</summary>
					<p>{item.answer}</p>
				</details>{/each}
		</div>
	</div>
</section>
