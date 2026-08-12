import {
	ImageDecodeError,
	type ImageDimensions,
	type ImageProcessor,
	type VariantFormat
} from './image-processor';

export interface FakeProcessedCall {
	width: number;
	format: VariantFormat;
}

/**
 * In-memory double. It records what was asked of it and can fail on demand, so the media
 * slice is built and tested without waiting for a real encoder.
 */
export class FakeImageProcessor implements ImageProcessor {
	readonly calls: FakeProcessedCall[] = [];
	size: ImageDimensions = { width: 2000, height: 1200 };
	/** Set to make every call throw the way a corrupt file does. */
	decodeFails = false;

	async dimensions(_data: Uint8Array): Promise<ImageDimensions> {
		this.guard();
		return this.size;
	}

	async resize(data: Uint8Array, width: number, format: VariantFormat): Promise<Uint8Array> {
		this.guard();
		this.calls.push({ width, format });
		return new Uint8Array([...data.slice(0, 4), width & 0xff]);
	}

	async blurhash(_data: Uint8Array): Promise<string> {
		this.guard();
		return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
	}

	reset(): void {
		this.calls.length = 0;
		this.decodeFails = false;
	}

	private guard(): void {
		if (this.decodeFails) throw new ImageDecodeError('fake decode failure');
	}
}
