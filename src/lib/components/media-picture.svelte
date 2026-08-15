<script lang="ts">
	import type { MediaRef } from '$lib/types';
	import { cn } from '$lib/ui';
	import { mediaUrl, pickVariant, srcset } from '$lib/utils/media';

	interface Props {
		image: MediaRef;
		/** Widest rendered size in CSS pixels. Decides which variant the fallback `src` points at. */
		width?: number;
		sizes?: string;
		/** Set on the cover above the fold; everything below it stays lazy. */
		eager?: boolean;
		class?: string;
	}

	let { image, width = 800, sizes = '100vw', eager = false, class: className }: Props = $props();

	const fallback = $derived(pickVariant(image, width));
	const avif = $derived(srcset(image, 'avif'));
	const webp = $derived(srcset(image, 'webp'));
</script>

<!-- Intrinsic width and height are always set: without them the gallery shifts the layout. -->
{#if fallback}
	<picture>
		{#if avif}<source type="image/avif" srcset={avif} {sizes} />{/if}
		{#if webp}<source type="image/webp" srcset={webp} {sizes} />{/if}
		<img
			src={mediaUrl(fallback.key)}
			alt={image.alt ?? ''}
			width={image.width ?? undefined}
			height={image.height ?? undefined}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			class={cn('h-full w-full object-cover', className)}
		/>
	</picture>
{/if}
