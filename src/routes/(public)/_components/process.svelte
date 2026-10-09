<script lang="ts">
	import { COPY, PROCESS, LABELS } from '../landing-content';
</script>

<section id="process" class="wrap section-space" aria-labelledby="process-title">
	<div class="reveal mb-16 grid items-end gap-8 md:grid-cols-2">
		<div>
			<h2 id="process-title" class="section-title">
				{COPY.process.titleStart}<br />{COPY.process.titleEnd}
			</h2>
		</div>
		<p class="body-copy md:max-w-sm md:justify-self-end">{COPY.process.description}</p>
	</div>
	<div class="process-grid reveal">
		{#each PROCESS as item, index (item.title)}<article class="process-step">
				<span>{String(index + 1).padStart(2, '0')}</span>
				<h3>{item.title}</h3>
				<p>{item.text}</p>
				<div class="process-result">{LABELS.result} {item.result}</div>
			</article>{/each}
	</div>
</section>
