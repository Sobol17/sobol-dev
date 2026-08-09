import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges conditional classes and lets a caller override a primitive's own utilities. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
