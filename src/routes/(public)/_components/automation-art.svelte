<script lang="ts">
	import { COPY } from '../landing-content';
</script>

<figure class="business-scene automation-art" aria-labelledby="automation-caption">
	<div class="art-heading"><p>{COPY.graphic.heading}</p></div>
	<svg
		class="automation-canvas"
		viewBox="0 0 480 440"
		role="img"
		aria-labelledby="automation-title automation-description"
	>
		<title id="automation-title">{COPY.graphic.title}</title>
		<desc id="automation-description">{COPY.graphic.description}</desc>
		<defs
			><pattern id="art-grid" width="24" height="24" patternUnits="userSpaceOnUse"
				><circle cx="1" cy="1" r=".8" fill="#383838" /></pattern
			></defs
		>
		<rect x="24" y="16" width="432" height="288" fill="url(#art-grid)" />
		<g class="art-wires" fill="none" stroke="#525252" stroke-width="1.5">
			<path id="wire-site" d="M104 72H130Q148 72 148 90V140Q148 158 166 158H184" />
			<path id="wire-chat" d="M104 158H184" />
			<path id="wire-form" d="M104 244H130Q148 244 148 226V176Q148 158 166 158H184" />
			<path id="wire-order" d="M296 158H314Q332 158 332 140V114Q332 96 350 96H376" />
			<path id="wire-document" d="M296 158H314Q332 158 332 176V210Q332 228 350 228H376" />
		</g>
		<g fill="#ff6268" aria-hidden="true"
			><circle class="data-packet" data-wire="wire-site" cx="0" cy="0" r="4" opacity="0" /><circle
				class="data-packet"
				data-wire="wire-chat"
				cx="0"
				cy="0"
				r="4"
				opacity="0"
			/><circle class="data-packet" data-wire="wire-form" cx="0" cy="0" r="4" opacity="0" /><circle
				class="data-packet"
				data-wire="wire-order"
				cx="0"
				cy="0"
				r="4"
				opacity="0"
			/><circle class="data-packet" data-wire="wire-document" cx="0" cy="0" r="4" opacity="0" /></g
		>
		<g class="art-input" transform="translate(32 44)"
			><rect width="72" height="56" rx="16" fill="#292929" stroke="#525252" /><g
				fill="none"
				stroke="#ededed"
				stroke-width="1.5"
				><rect x="20" y="16" width="32" height="24" rx="4" /><path
					d="M20 23h32M26 19.5h2m3 0h2M26 29h12m-12 5h20"
				/></g
			></g
		>
		<g class="art-input" transform="translate(32 130)"
			><rect width="72" height="56" rx="16" fill="#292929" stroke="#525252" /><path
				d="M23 16h26a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H33l-10 7v-7a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z"
				fill="none"
				stroke="#ededed"
				stroke-width="1.5"
			/><path d="M27 24h18m-18 6h12" fill="none" stroke="#ededed" stroke-width="1.5" /></g
		>
		<g class="art-input" transform="translate(32 216)"
			><rect width="72" height="56" rx="16" fill="#292929" stroke="#525252" /><g
				fill="none"
				stroke="#ededed"
				stroke-width="1.5"
				><rect x="24" y="12" width="24" height="32" rx="4" /><path
					d="M30 20h12m-12 7h12m-12 7h7"
				/></g
			></g
		>
		<rect
			class="core-halo"
			x="172"
			y="90"
			width="136"
			height="136"
			rx="32"
			fill="none"
			stroke="#ff6268"
			stroke-opacity=".4"
		/>
		<rect x="184" y="102" width="112" height="112" rx="24" fill="#fff" />
		<use href="#mark" x="210" y="128" width="60" height="60" color="#d71920" />
		<g class="art-output" transform="translate(376 60)"
			><rect width="72" height="72" rx="16" fill="#f5f5f5" /><g
				fill="none"
				stroke="#171717"
				stroke-width="1.7"
				><path d="m21 27 15-8 15 8v19l-15 8-15-8V27Zm0 0 15 8 15-8M36 35v19m-7-31 15 8" /></g
			><circle class="output-check" cx="62" cy="8" r="10" fill="#d71920" /><path
				class="output-check"
				d="m58 8 3 3 5-6"
				fill="none"
				stroke="white"
				stroke-width="1.8"
			/></g
		>
		<g class="art-output" transform="translate(376 192)"
			><rect width="72" height="72" rx="16" fill="#f5f5f5" /><g
				fill="none"
				stroke="#171717"
				stroke-width="1.7"
				><path d="M25 17h17l9 9v29H25V17Zm17 0v10h9M31 35h14m-14 7h14m-14 7h8" /></g
			><circle class="output-check" cx="62" cy="8" r="10" fill="#d71920" /><path
				class="output-check"
				d="m58 8 3 3 5-6"
				fill="none"
				stroke="white"
				stroke-width="1.8"
			/></g
		>
		<g fill="#e5e5e5" font-size="17" font-weight="500" text-anchor="middle"
			><text x="68" y="302">{COPY.graphic.requests}</text><text x="240" y="252"
				>{COPY.graphic.system}</text
			><text x="412" y="160">{COPY.graphic.order}</text><text x="412" y="292"
				>{COPY.graphic.document}</text
			></g
		>
		<path d="M32 326h416" stroke="#414141" />
		<g fill="#bdbdbd" font-size="13"
			><text x="32" y="350">{COPY.graphic.incoming}</text><text x="292" y="350"
				>{COPY.graphic.processing}</text
			></g
		>
		<g fill="none" stroke="#383838"><path d="M32 374h216m-216 24h216m-216 24h216M292 422h156" /></g>
		<path
			class="art-chart-track"
			d="M32 408 56 408 68 389 80 402 104 402 116 374 128 396 152 396 164 384 176 408 200 408 212 380 224 396 248 396"
			fill="none"
			stroke="#666"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<path
			class="art-chart-line"
			d="M32 408 56 408 68 389 80 402 104 402 116 374 128 396 152 396 164 384 176 408 200 408 212 380 224 396 248 396"
			fill="none"
			stroke="#ff6268"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
		<g fill="#ff6268"
			><rect class="art-bar" x="292" y="398" width="12" height="24" rx="3" /><rect
				class="art-bar"
				x="316"
				y="378"
				width="12"
				height="44"
				rx="3"
			/><rect class="art-bar" x="340" y="390" width="12" height="32" rx="3" /><rect
				class="art-bar"
				x="364"
				y="370"
				width="12"
				height="52"
				rx="3"
			/><rect class="art-bar" x="388" y="386" width="12" height="36" rx="3" /><rect
				class="art-bar"
				x="412"
				y="378"
				width="12"
				height="44"
				rx="3"
			/><rect class="art-bar" x="436" y="394" width="12" height="28" rx="3" /></g
		>
	</svg>
	<figcaption id="automation-caption">{COPY.graphic.caption}</figcaption>
</figure>
