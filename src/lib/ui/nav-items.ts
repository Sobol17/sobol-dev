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
	{ href: '/admin/projects', label: 'Кейсы' }
];

export const PUBLIC_NAV: NavItem[] = [{ href: '/lead', label: 'Бриф' }];
