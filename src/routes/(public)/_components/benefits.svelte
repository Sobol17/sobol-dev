<script lang="ts">
	import { Card } from '$lib/ui';
	import { COPY } from '../landing-content';
</script>

<section id="benefits" class="wrap section-space" aria-labelledby="benefits-title">
	<div class="benefit-heading reveal">
		<p class="eyebrow mb-5">{COPY.benefits.eyebrow}</p>
		<h2 id="benefits-title" class="section-title">
			{COPY.benefits.titleStart}<br />{COPY.benefits.titleEnd}
		</h2>
		<p class="body-copy mx-auto mt-6">{COPY.benefits.description}</p>
	</div>
	<div class="benefit-grid">
		<Card class="benefit-card reveal border-night bg-night p-8 text-white"
			><div class="benefit-visual" aria-hidden="true">
				<div class="time-stack">
					<span>{COPY.benefits.visualCopy}</span><span>{COPY.benefits.visualReminder}</span><span
						>{COPY.benefits.visualDone}</span
					>
				</div>
			</div>
			<h3>{COPY.benefits.efficiencyTitleStart}<br />{COPY.benefits.efficiencyTitleEnd}</h3>
			<p>{COPY.benefits.efficiencyText}</p>
			<div class="benefit-meta">{COPY.benefits.efficiencyMeta}</div></Card
		><Card class="benefit-card reveal bg-accent-soft p-8"
			><div class="benefit-visual" aria-hidden="true">
				<svg
					class="benefit-icon"
					viewBox="0 0 64 64"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><rect x="15" y="5" width="34" height="54" rx="10" /><path
						d="M26 11h12M25 32l5 5 11-12M28 52h8"
					/><circle cx="45" cy="20" r="11" fill="#f5f5f5" /><path d="m40 20 3 3 7-7" /></svg
				>
			</div>
			<h3>{COPY.benefits.selfServiceTitleStart}<br />{COPY.benefits.selfServiceTitleEnd}</h3>
			<p>{COPY.benefits.selfServiceText}</p>
			<div class="benefit-meta">{COPY.benefits.selfServiceMeta}</div></Card
		><Card class="benefit-card reveal bg-surface p-8"
			><div class="benefit-visual" aria-hidden="true">
				<svg
					class="benefit-icon"
					viewBox="0 0 64 64"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><rect x="5" y="11" width="54" height="42" rx="8" /><path
						d="M5 23h54M16 33h10m-10 7h10m8-1 7-7 7 4 7-8"
					/><circle cx="13" cy="17" r="1" fill="currentColor" /><circle
						cx="19"
						cy="17"
						r="1"
						fill="currentColor"
					/></svg
				>
			</div>
			<h3>{COPY.benefits.visibilityTitleStart}<br />{COPY.benefits.visibilityTitleEnd}</h3>
			<p>{COPY.benefits.visibilityText}</p>
			<div class="benefit-meta">{COPY.benefits.visibilityMeta}</div></Card
		>
	</div>
	<div class="measurement reveal">
		<div>
			<h3>{COPY.benefits.measureTitle}</h3>
			<p>{COPY.benefits.measureDescription}</p>
		</div>
		<div class="measure-list">
			<span>{COPY.benefits.timeMetric}</span><span>{COPY.benefits.ordersMetric}</span><span
				>{COPY.benefits.unansweredMetric}</span
			>
		</div>
	</div>
</section>
