export type ProjectCategory = 'web' | 'mobile' | 'tma';
export type PublishStatus = 'draft' | 'published' | 'archived';
export type MediaStatus = 'pending' | 'ready' | 'failed';

export interface MediaVariant {
	key: string;
	width: number;
	format: 'webp' | 'avif';
}

export interface ProjectMetric {
	label: string;
	value: string;
}

export interface MediaRef {
	id: string;
	alt: string | null;
	width: number | null;
	height: number | null;
	blurhash: string | null;
	variants: MediaVariant[];
}

export interface ProjectCard {
	id: string;
	slug: string;
	title: string;
	category: ProjectCategory;
	summary: string;
	cover: MediaRef | null;
	tags: string[];
	featured: boolean;
}
