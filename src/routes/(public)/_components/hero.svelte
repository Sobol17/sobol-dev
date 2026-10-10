<script lang="ts">
	import { Button } from '$lib/ui';
	import AutomationArt from './automation-art.svelte';
	import { COPY } from '../landing-content';
</script>

<section class="hero wrap" aria-labelledby="hero-title">
	<div class="hero-layout">
		<div class="hero-copy">
			<h1 id="hero-title" class="hero-title">
				<span>{COPY.hero.titleStart}</span> <span>{COPY.hero.titleMiddle}</span>
				<span class="hero-accent">{COPY.hero.titleAccent}</span>
			</h1>
			<p class="hero-description">{COPY.hero.description}</p>
			<div class="hero-actions">
				<Button href="#brief" size="lg" class="button button-primary"
					>{COPY.hero.primaryCta}<svg class="arrow" aria-hidden="true"><use href="#arrow" /></svg
					></Button
				><a href="#cases" class="text-link" aria-label={COPY.hero.secondaryLabel}
					>{COPY.hero.secondaryCta}<span aria-hidden="true">↓</span></a
				>
			</div>
			<p class="hero-note">{COPY.hero.note}</p>
		</div>
		<AutomationArt />
	</div>
	<div class="hero-proof">
		<span>{COPY.hero.budgetProof}</span><span>{COPY.hero.progressProof}</span><span
			>{COPY.hero.ownershipProof}</span
		>
	</div>
</section>
