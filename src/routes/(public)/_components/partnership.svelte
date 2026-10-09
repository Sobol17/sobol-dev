<script lang="ts">
	import { COPY } from '../landing-content';
</script>

<section id="about" class="wrap pb-8" aria-labelledby="about-title">
	<div class="partnership">
		<div class="about-heading reveal">
			<h2 id="about-title" class="section-title">
				{COPY.about.titleStart}<br />{COPY.about.titleEnd}
			</h2>
			<p class="body-copy mt-6">{COPY.about.description}</p>
			<p class="partnership-note">{COPY.about.note}</p>
		</div>
		<div class="reveal">
			<article class="principle">
				<h3>{COPY.about.discoveryTitle}</h3>
				<p>{COPY.about.discoveryText}</p>
			</article>
			<article class="principle">
				<h3>{COPY.about.scopeTitle}</h3>
				<p>{COPY.about.scopeText}</p>
			</article>
			<article class="principle">
				<h3>{COPY.about.handoverTitle}</h3>
				<p>{COPY.about.handoverText}</p>
			</article>
		</div>
	</div>
</section>
