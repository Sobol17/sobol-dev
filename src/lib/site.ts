export interface SiteInfo {
	name: string;
	telegram: { handle: string; href: string };
	email: string;
}

export const SITE: SiteInfo = {
	name: 'Арко',
	telegram: { handle: '@soboldev', href: 'https://t.me/soboldev' },
	email: 'hello@soboldev.ru'
};
