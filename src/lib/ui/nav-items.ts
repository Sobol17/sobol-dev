export interface NavItem {
	href: string;
	label: string;
}

/**
 * Navigation is data. A slice adds its section by appending one line here, never by
 * editing layout markup. Only routes that exist are listed: a dead link breaks prerendering.
 */
export const ADMIN_NAV: NavItem[] = [
	{ href: '/admin', label: 'Дашборд' },
	{ href: '/admin/projects', label: 'Кейсы' },
	{ href: '/admin/media', label: 'Медиа' }
];

export const PUBLIC_NAV: NavItem[] = [
	{ href: '/cases', label: 'Кейсы' },
	{ href: '/#services', label: 'Услуги' },
	{ href: '/#process', label: 'Процесс' },
	{ href: '/#faq', label: 'Вопросы' }
];
