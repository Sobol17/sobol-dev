import type { LeadListItem } from '../src/lib/types';

export const leads: LeadListItem[] = [
	{
		id: 'demo-1',
		publicId: 'DEMO01',
		type: 'web',
		status: 'new',
		contactName: 'Демо · Интернет-магазин',
		goalExcerpt: 'Объединить заказы с сайта и обращения из мессенджеров в одном рабочем окне',
		createdAt: '2026-10-09T04:30:00.000Z'
	},
	{
		id: 'demo-2',
		publicId: 'DEMO02',
		type: 'tma',
		status: 'qualifying',
		contactName: 'Демо · Студия занятий',
		goalExcerpt: 'Сделать запись на занятия в Telegram с выбором времени и напоминаниями',
		createdAt: '2026-10-08T08:00:00.000Z'
	},
	{
		id: 'demo-3',
		publicId: 'DEMO03',
		type: 'other',
		status: 'proposal_sent',
		contactName: 'Демо · Сервисная компания',
		goalExcerpt:
			'Автоматически готовить документы по заказам и передавать данные в учётную систему',
		createdAt: '2026-10-07T02:20:00.000Z'
	},
	{
		id: 'demo-4',
		publicId: 'DEMO04',
		type: 'mobile',
		status: 'won',
		contactName: 'Демо · Служба доставки',
		goalExcerpt: 'Приложение для курьеров со списком доставок и подтверждением выполнения',
		createdAt: '2026-10-06T06:10:00.000Z'
	}
];
