# tech.md — ядро проекта `sobol-portfolio`

**Версия ядра: v3**

Changelog:
- v3 — БД переведена с PostgreSQL на SQLite (`better-sqlite3` + Drizzle). Схема переписана под sqlite-core: текстовые id, целочисленные таймстампы, json в `text({ mode: 'json' })`, енумы через `text({ enum })`. pg-boss удалён, очередь живёт в таблице `jobs` того же файла БД, воркер крутится в процессе приложения. Деплой сведён к одному процессу, бэкап — к копии файла.
- v2 — сокращён объём. Убраны LLM-черновик КП (`LlmClient`, топик `proposal.draft`) и почтовый канал (`Mailer`, SMTP). Уведомления только в Telegram. Топик `proposal.send` удалён: публикация КП стала синхронным переходом статуса, доставка клиенту ручная по публичной ссылке. `outbox_channel` сведён к одному значению.
- v1 — исходное ядро: стек, схема БД, контракты очереди, общие типы, UI-примитивы, правила кода, дорожная карта на две стадии.

Правило версии: файл меняется только append-only. Любая правка контракта (таблица, поле, payload джоба, общий тип, пропсы примитива) бампает версию и добавляет строку в changelog. Сессия нейросети этот файл не редактирует, редактирует только человек.

---

## 0. Как пользоваться файлом

Это единственный источник истины. Каждая сессия читает его первым и подчиняется дословно. Контракты не выдумываются: нет нужного типа, поля или топика — сессия выдаёт блок `CONTRACT GAP` (раздел 16) и останавливается.

Роль одна: владелец продукта, тимлид и разработчик — один человек (Sobol17). Разделения на LEAD/DEV нет, но разделение ответственности внутри работы есть: сначала каркас целиком, потом фичи вертикальными слайсами, по одному слайсу за раз.

---

## 1. Проект

**Что делает.** Продающий сайт-портфолио соло-разработчика. Публичный лендинг показывает услуги и кейсы, собирает заявки. Закрытая админка наполняет портфолио и ведёт заявки до отправленного коммерческого предложения.

**Для кого.** Заказчик, которому нужна разработка: веб-приложение, мобильное приложение (Flutter / React Native), Telegram Mini App.

**Цель.** Заявка с достаточной информацией, чтобы ответить коммерческим предложением без переписки-уточнения. Форма заявки короткая: тип проекта, три вопроса, контакт.

**Как это работает целиком.** Заявка падает в БД, владелец получает уведомление в Telegram. В админке владелец пишет КП руками по шаблону и публикует его. Публикация выдаёт ссылку с токеном, владелец отправляет её клиенту сам тем каналом, который клиент оставил. Автоматической рассылки клиенту в системе нет.

**Метрика.** Доля посетителей кейс-страниц, дошедших до отправленной формы. Время от заявки до отправленного КП.

**Не входит в объём.** Оплата на сайте, личный кабинет клиента, блог, мультиязычность, регистрация пользователей. Админ ровно один, создаётся сидом.

---

## 2. Стек

| Слой | Решение | Версия / примечание |
|---|---|---|
| Фреймворк | SvelteKit (fullstack) | стабильная линия 2.6x, Svelte 5.5x |
| Язык | TypeScript | strict, TS 6.x |
| БД | SQLite | один файл, режим WAL |
| Драйвер | `better-sqlite3` | синхронный, нативный |
| ORM | Drizzle ORM (`drizzle-orm/better-sqlite3`) | `drizzle-kit` с `dialect: 'sqlite'` |
| Очередь | своя, таблица `jobs` в том же файле | воркер-луп внутри процесса приложения |
| Валидация | Valibot | одна схема на клиент и сервер |
| Стили | Tailwind CSS v4 | токены через `@theme` в `app.css` |
| UI-база | shadcn-svelte (bits-ui) | примитивы копируются в репо, не пишутся с нуля |
| Хеш пароля | `@node-rs/argon2` | argon2id |
| Уведомления | Telegram Bot API (`fetch`, без SDK) | за интерфейсом `Notifier`, единственный канал |
| Рантайм | Node 22 LTS, `adapter-node` | |
| Прокси | Caddy | TLS, статика, заголовки безопасности |
| Тесты | Vitest, Playwright, fast-check | |
| Линт | ESLint + Prettier + svelte-check | |

**Про версии SvelteKit.** SvelteKit 3 существует только в `@next`-превью, конфиг там переезжает в `vite.config.js`. Проект сидит на стабильной линии 2.6x и не прыгает на превью. Remote functions включаются флагами `kit.experimental.remoteFunctions` и `compilerOptions.experimental.async`; версии `@sveltejs/kit` и `svelte` пиньтся точно (без `^`), апгрейд — отдельный PR с прогоном e2e.

---

## 3. Структура папок

```
src/
  app.css                     design tokens + tailwind
  app.d.ts                    App.Locals, App.PageData
  hooks.server.ts             session, auth guard, security headers, request id
  lib/
    types/                    общие TS-типы, единственное место (раздел 7)
      index.ts
      lead.ts  project.ts  proposal.ts  jobs.ts
    schemas/                  valibot-схемы, общие для клиента и сервера
      lead.ts  project.ts  proposal.ts  auth.ts
    ui/                       примитивы (раздел 9), без бизнес-логики
      button/  input/  field/  select/  radio-cards/  textarea/
      badge/  card/  dialog/  table/  toast/  tabs/  pagination/
      file-drop/  stepper/  empty-state/  skeleton/
      index.ts
    components/               общие композиты публичной части
      seo-head.svelte  project-card.svelte  section.svelte
    state/                    клиентское состояние, классы с рунами
      toast.svelte.ts  lead-form.svelte.ts
    utils/                    чистые функции, без импортов сервера
      slug.ts  format.ts  markdown.ts
    server/
      config.ts               единый конфиг, читает env один раз
      container.ts            композиционный корень, сборка сервисов
      db/
        index.ts              подключение, PRAGMA, миграции на старте
        schema.ts  migrations/
      repositories/           доступ к данным, по одному классу на агрегат
        lead.repository.ts  project.repository.ts  media.repository.ts
        proposal.repository.ts  outbox.repository.ts  session.repository.ts
      domain/                 бизнес-логика, классы, без знания HTTP
        lead.service.ts  project.service.ts  media.service.ts
        proposal.service.ts  auth.service.ts  rate-limit.service.ts
      clients/                внешний мир за интерфейсами + фейки
        notifier.ts  notifier.telegram.ts  notifier.fake.ts
        storage.ts  storage.fs.ts  storage.fake.ts
      queue/
        topics.ts             имена топиков, единственное место
        queue.ts              JobQueue: публикация и захват джобов
        runner.ts             цикл воркера, ретраи, backoff
        scheduler.ts          постановка периодических джобов
        handlers/             по файлу на джоб
      security/
        password.ts  session.ts  csp.ts  ip.ts
  routes/
    (public)/
      +layout.svelte
      +page.svelte                    лендинг
      cases/+page.svelte              список кейсов
      cases/[slug]/+page.svelte       кейс
      lead/+page.svelte               эталонный слайс: форма заявки
      lead/lead.remote.ts
      thanks/+page.svelte
      p/[token]/+page.svelte          публичная страница КП
      sitemap.xml/+server.ts
      robots.txt/+server.ts
    (admin)/
      +layout.server.ts               гард авторизации
      +layout.svelte                  навигация админки (данными, не разметкой)
      admin/+page.svelte              дашборд
      admin/projects/...              слайс S1
      admin/media/...                 слайс S2
      admin/leads/...                 слайс S6
      admin/proposals/...             слайс S7
    login/+page.svelte
    kitchen-sink/+page.svelte         витрина примитивов, только dev
static/
tests/
  unit/  contract/  property/  e2e/
scripts/
  seed.ts  create-admin.ts
```

Правила расположения:
- всё серверное лежит под `lib/server`, импорт оттуда в клиентский код запрещён физически (SvelteKit падает на сборке, не отключать);
- слайс живёт целиком в своей папке: домен + репозиторий + роут + локальные компоненты;
- локальный компонент фичи лежит рядом с роутом (`admin/leads/_components/`), в `lib/ui` попадает только то, что используют два и более слайса.

---

## 4. Архитектура

Три слоя, зависимости идут только вниз:

```
routes (+page.server.ts, *.remote.ts)   транспорт: валидация входа, авторизация, коды ответов
        ↓
lib/server/domain (сервисы, классы)     бизнес-правила, не знают о HTTP и Request
        ↓
lib/server/repositories (классы)        SQL через Drizzle, не знают о бизнес-правилах
lib/server/clients (интерфейсы)         Telegram, файловое хранилище
```

**ООП и внедрение зависимостей.** Сервис — класс с зависимостями в конструкторе, без глобальных импортов инфраструктуры:

```ts
// lib/server/domain/lead.service.ts
export class LeadService {
  constructor(
    private readonly leads: LeadRepository,
    private readonly queue: JobQueue,
    private readonly clock: Clock
  ) {}

  /** Persists a lead and schedules owner notification. Rejects duplicates by idempotency key. */
  async submit(input: LeadInput, meta: RequestMeta): Promise<Lead> { /* ... */ }
}
```

Сборка один раз в `lib/server/container.ts`, роуты берут готовый сервис оттуда. В тестах подставляются фейки через тот же конструктор, без моков модулей.

**Интерфейс + фейк на каждый внешний сервис.** Внешних сервисов два: `Notifier` (Telegram) и `Storage` (файлы). Фейк пишется в один день с интерфейсом, живёт в репо, пишет вызовы в память и умеет возвращать ошибку по флагу. Разработка не ждёт токена бота и домена.

**Клиентское состояние.** Классы в `.svelte.ts` с полями `$state`, не разрозненные переменные и не сторы (раздел 11).

**Чистая доменная логика отдельно.** Расчёт вилки цены, срока, скоринг заявки — чистые функции в `lib/utils` или методы без побочек. На них property-based тесты.

---

## 5. Схема БД (Drizzle + SQLite)

Файл `lib/server/db/schema.ts`. Ниже контракт, менять только с бампом версии ядра.

**Соглашения по типам под SQLite.** Нативных `uuid`, `timestamptz`, `jsonb`, массивов и енумов здесь нет, поэтому:
- идентификатор — `text` с UUID v4 из `crypto.randomUUID()`, генерится приложением через `$defaultFn`;
- время — `integer({ mode: 'timestamp_ms' })`, в JS это `Date`, в файле миллисекунды UTC. Строковых дат в схеме нет;
- булево — `integer({ mode: 'boolean' })`;
- структура — `text({ mode: 'json' })` с `$type<...>()`. Поиск по такому полю не делается, только чтение целиком;
- перечисление — `text({ enum: [...] })` с массивом-константой, он же источник TS-типа в `lib/types`. Дубля списка значений нет.

```ts
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// ---------- enums as const tuples (single source for schema and types) ----------
export const PROJECT_CATEGORIES = ['web', 'mobile', 'tma'] as const;
export const PUBLISH_STATUSES   = ['draft', 'published', 'archived'] as const;
export const MEDIA_STATUSES     = ['pending', 'ready', 'failed'] as const;
export const LEAD_TYPES         = ['web', 'mobile', 'tma', 'other'] as const;
export const LEAD_STATUSES      = ['new', 'qualifying', 'proposal_sent', 'won', 'lost', 'spam'] as const;
export const BUDGET_RANGES      = ['under_3k', '3k_10k', '10k_30k', 'over_30k', 'unknown'] as const;
export const TIMELINE_RANGES    = ['asap', 'under_1m', '1_3m', 'over_3m', 'unknown'] as const;
export const PROPOSAL_STATUSES  = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'] as const;
export const OUTBOX_CHANNELS    = ['telegram'] as const;   // second channel is an append-only change
export const OUTBOX_STATUSES    = ['pending', 'sent', 'failed'] as const;
export const JOB_STATUSES       = ['pending', 'active', 'done', 'failed'] as const;

const id = () => text('id').primaryKey().$defaultFn(() => randomUUID());
const createdAt = () => integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date());
const updatedAt = () => integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date());

// ---------- auth ----------
export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: createdAt()
}, (t) => ({ emailUq: uniqueIndex('users_email_uq').on(t.email) }));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),                     // sha256 of the raw cookie token
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: createdAt()
}, (t) => ({ userIdx: index('sessions_user_idx').on(t.userId) }));

export const authAttempts = sqliteTable('auth_attempts', {
  id: id(),
  ipHash: text('ip_hash').notNull(),
  email: text('email'),
  succeeded: integer('succeeded', { mode: 'boolean' }).notNull(),
  createdAt: createdAt()
}, (t) => ({ ipIdx: index('auth_attempts_ip_idx').on(t.ipHash, t.createdAt) }));

// ---------- media ----------
export const media = sqliteTable('media', {
  id: id(),
  storageKey: text('storage_key').notNull(),
  mime: text('mime').notNull(),
  width: integer('width'),
  height: integer('height'),
  sizeBytes: integer('size_bytes').notNull(),
  alt: text('alt'),
  blurhash: text('blurhash'),
  variants: text('variants', { mode: 'json' }).$type<MediaVariant[]>().notNull().$defaultFn(() => []),
  status: text('status', { enum: MEDIA_STATUSES }).notNull().default('pending'),
  createdAt: createdAt()
}, (t) => ({ keyUq: uniqueIndex('media_storage_key_uq').on(t.storageKey) }));

// ---------- portfolio ----------
export const projects = sqliteTable('projects', {
  id: id(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  category: text('category', { enum: PROJECT_CATEGORIES }).notNull(),
  summary: text('summary').notNull(),
  body: text('body').notNull(),                    // markdown, sanitized on render
  clientName: text('client_name'),
  roleText: text('role_text'),
  year: integer('year'),
  durationWeeks: integer('duration_weeks'),
  liveUrl: text('live_url'),
  repoUrl: text('repo_url'),
  coverMediaId: text('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
  metrics: text('metrics', { mode: 'json' }).$type<ProjectMetric[]>().notNull().$defaultFn(() => []),
  status: text('status', { enum: PUBLISH_STATUSES }).notNull().default('draft'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull().default(0),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (t) => ({
  slugUq: uniqueIndex('projects_slug_uq').on(t.slug),
  listIdx: index('projects_list_idx').on(t.status, t.position)
}));

export const techTags = sqliteTable('tech_tags', {
  id: id(),
  slug: text('slug').notNull(),
  name: text('name').notNull()
}, (t) => ({ slugUq: uniqueIndex('tech_tags_slug_uq').on(t.slug) }));

export const projectTags = sqliteTable('project_tags', {
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => techTags.id, { onDelete: 'cascade' })
}, (t) => ({ pk: primaryKey({ columns: [t.projectId, t.tagId] }) }));

export const projectMedia = sqliteTable('project_media', {
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  mediaId: text('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  caption: text('caption')
}, (t) => ({ pk: primaryKey({ columns: [t.projectId, t.mediaId] }) }));

// ---------- leads ----------
export const leads = sqliteTable('leads', {
  id: id(),
  publicId: text('public_id').notNull(),                       // short human-readable ref
  type: text('type', { enum: LEAD_TYPES }).notNull(),
  goal: text('goal').notNull(),
  budget: text('budget', { enum: BUDGET_RANGES }).notNull().default('unknown'),
  timeline: text('timeline', { enum: TIMELINE_RANGES }).notNull().default('unknown'),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email'),
  contactTelegram: text('contact_telegram'),
  status: text('status', { enum: LEAD_STATUSES }).notNull().default('new'),
  utm: text('utm', { mode: 'json' }).$type<UtmParams>().notNull().$defaultFn(() => ({})),
  referrer: text('referrer'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  spamScore: integer('spam_score').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (t) => ({
  publicUq: uniqueIndex('leads_public_id_uq').on(t.publicId),
  statusIdx: index('leads_status_idx').on(t.status, t.createdAt),
  // At least one contact channel must be present.
  contactCk: check('leads_contact_ck',
    sql`${t.contactEmail} is not null or ${t.contactTelegram} is not null`)
}));

export const leadNotes = sqliteTable('lead_notes', {
  id: id(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  createdAt: createdAt()
}, (t) => ({ leadIdx: index('lead_notes_lead_idx').on(t.leadId, t.createdAt) }));

// ---------- proposals ----------
export const proposals = sqliteTable('proposals', {
  id: id(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  publicToken: text('public_token').notNull(),
  title: text('title').notNull(),
  bodyMd: text('body_md').notNull(),
  scope: text('scope', { mode: 'json' }).$type<ProposalScopeItem[]>().notNull().$defaultFn(() => []),
  priceFrom: integer('price_from'),
  priceTo: integer('price_to'),
  currency: text('currency').notNull().default('EUR'),
  timelineWeeks: integer('timeline_weeks'),
  status: text('status', { enum: PROPOSAL_STATUSES }).notNull().default('draft'),
  validUntil: integer('valid_until', { mode: 'timestamp_ms' }),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  viewedAt: integer('viewed_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (t) => ({
  tokenUq: uniqueIndex('proposals_token_uq').on(t.publicToken),
  leadIdx: index('proposals_lead_idx').on(t.leadId)
}));

// ---------- outbox ----------
export const outboxMessages = sqliteTable('outbox_messages', {
  id: id(),
  channel: text('channel', { enum: OUTBOX_CHANNELS }).notNull(),
  templateKey: text('template_key').notNull(),
  recipient: text('recipient').notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  dedupeKey: text('dedupe_key').notNull(),
  status: text('status', { enum: OUTBOX_STATUSES }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt()
}, (t) => ({ dedupeUq: uniqueIndex('outbox_dedupe_uq').on(t.dedupeKey) }));

// ---------- queue ----------
export const jobs = sqliteTable('jobs', {
  id: id(),
  topic: text('topic').notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  uniqueKey: text('unique_key'),                   // null means no deduplication
  status: text('status', { enum: JOB_STATUSES }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(5),
  runAt: integer('run_at', { mode: 'timestamp_ms' }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  lastError: text('last_error'),
  createdAt: createdAt()
}, (t) => ({
  claimIdx: index('jobs_claim_idx').on(t.status, t.runAt),
  // Deduplication applies only to work that has not finished yet.
  uniqueOpenUq: uniqueIndex('jobs_unique_open_uq').on(t.uniqueKey)
    .where(sql`unique_key is not null and status in ('pending','active')`)
}));
```

**Подключение** (`lib/server/db/index.ts`) выставляет PRAGMA один раз на старте, до первого запроса:

```ts
db.pragma('journal_mode = WAL');      // readers do not block the single writer
db.pragma('foreign_keys = ON');       // off by default in SQLite, cascades depend on it
db.pragma('busy_timeout = 5000');     // wait instead of throwing SQLITE_BUSY
db.pragma('synchronous = NORMAL');    // safe with WAL, much faster than FULL
```

Инварианты схемы:
- `leads.contactEmail` или `leads.contactTelegram` заполнен минимум один. CHECK-констрейнт в таблице плюс проверка в `LeadService`;
- `foreign_keys = ON` обязателен: без него SQLite молча игнорирует каскады и внешние ключи превращаются в комментарий;
- публичный список кейсов читает только `status = 'published'`;
- `outbox_messages.dedupe_key` — точка идемпотентности отправки. Формат: `<channel>:<templateKey>:<entityId>`;
- `jobs.unique_key` дедуплицирует только незавершённые джобы: частичный уникальный индекс не мешает поставить ту же работу повторно после её завершения;
- удаление проекта каскадит на `project_media` и `project_tags`, файлы в хранилище чистит джоб `media.gc`;
- писатель в БД один. Второй процесс, пишущий в тот же файл, в архитектуру не закладывается.

---

## 6. Контракты очереди (таблица `jobs`)

Внешнего брокера нет. Очередь — таблица `jobs` в том же файле БД, воркер крутится внутри процесса приложения. Причина: SQLite допускает одного писателя, поэтому второй процесс, конкурирующий за файл, добавил бы блокировки без выигрыша. Деплой от этого сводится к одному systemd-юниту.

Имена топиков живут в одном файле `lib/server/queue/topics.ts`, строковые литералы в коде запрещены.

```ts
export const TOPICS = {
  LEAD_SUBMITTED:  'lead.submitted',
  MEDIA_PROCESS:   'media.process',
  OUTBOX_DISPATCH: 'outbox.dispatch',
  MEDIA_GC:        'media.gc'
} as const;
```

| Топик | Payload | Что делает | Идемпотентность | Ретраи |
|---|---|---|---|---|
| `lead.submitted` | `{ leadId: string }` | Считает spamScore, создаёт outbox-запись владельцу в Telegram | `uniqueKey = 'lead.submitted:' + leadId`; outbox-вставка через `onConflictDoNothing` по `dedupeKey` | 5, exponential, старт 15 c |
| `media.process` | `{ mediaId: string }` | Ресайз в webp/avif, thumb 400/800/1600, blurhash, `status → ready` | Пропускает работу, если `status = 'ready'` и варианты на месте | 3, старт 30 c |
| `outbox.dispatch` | `{ messageId: string }` | Отдаёт сообщение в `Notifier` | Условный UPDATE `... where status = 'pending'`; фактическая отправка только по выигранному переходу | 5, старт 30 c |
| `media.gc` | `{}` | Раз в сутки в 03:00, удаляет файлы без ссылок старше 24 ч | `uniqueKey = 'media.gc:' + YYYY-MM-DD`, второй постановки за день не будет | 1 |

Публикация КП джобом не идёт. Переход `draft → sent` выполняется синхронно в `command()` админки условным UPDATE и сразу возвращает публичную ссылку. Фонового шага там нет, потому что доставку клиенту делает человек.

Правила для всех хендлеров:
- хендлер принимает только идентификатор, данные читает из БД. Дублировать бизнес-данные в payload запрещено, иначе ретрай работает на устаревшем снимке;
- каждый переход состояния делается условным UPDATE с проверкой текущего статуса, а не чтением с последующей записью;
- падение внешнего клиента бросает ошибку и отдаёт джоб на ретрай, никаких проглоченных `catch`;
- исчерпан лимит ретраев — статус `failed`, текст в `jobs.last_error`, лог `error` с `jobId` и сущностью;
- джоб пишется так, чтобы держаться внутри одной короткой транзакции. Долгая работа (ресайз изображения) делается вне транзакции, в БД пишется только результат: длинная транзакция держит единственного писателя и тормозит веб-запросы;
- хендлер не открывает вложенную транзакцию поверх уже открытой, `better-sqlite3` этого не поддерживает.

**Как работает раннер** (`lib/server/queue/runner.ts`):

```sql
-- Atomic claim: one writer, one statement, no race.
UPDATE jobs
   SET status = 'active', attempts = attempts + 1, started_at = :now
 WHERE id = (SELECT id FROM jobs
              WHERE status = 'pending' AND run_at <= :now
              ORDER BY run_at
              LIMIT 1)
RETURNING *;
```

- цикл опрашивает таблицу раз в секунду и разбирает готовые джобы по одному, последовательно. Параллелизм не вводится: писатель всё равно один;
- успех — `status = 'done'`, `finished_at`. Ошибка — обратно в `pending` с `run_at = now + backoff`, где backoff растёт как `base * 2^attempts` с потолком в час;
- `attempts >= max_attempts` переводит джоб в `failed`, работа останавливается, запись остаётся для разбора;
- джобы, зависшие в `active` дольше 10 минут (падение процесса на середине), возвращаются в `pending` при старте приложения. Отсюда требование идемпотентности: перезапущенный джоб выполнится второй раз;
- `scheduler.ts` ставит периодические джобы с `uniqueKey`, включающим дату. Внешнего cron нет;
- публикация джоба и изменение бизнес-данных идут в одной транзакции. Заявка и её `lead.submitted` либо коммитятся вместе, либо не коммитятся вовсе;
- воркер стартует в `hooks.server.ts` один раз за процесс и останавливается по `SIGTERM`, дав текущему джобу доработать.

---

## 7. Общие типы

`lib/types` — единственное место для типов, которые видят два и более слайса. Дублирование типа локально в слайсе запрещено.

```ts
// lib/types/lead.ts
export type LeadType = 'web' | 'mobile' | 'tma' | 'other';
export type LeadStatus = 'new' | 'qualifying' | 'proposal_sent' | 'won' | 'lost' | 'spam';
export type BudgetRange = 'under_3k' | '3k_10k' | '10k_30k' | 'over_30k' | 'unknown';
export type TimelineRange = 'asap' | 'under_1m' | '1_3m' | 'over_3m' | 'unknown';

export interface UtmParams {
  source?: string; medium?: string; campaign?: string; content?: string; term?: string;
}

/** Client-supplied part of a lead. Server never trusts anything outside this shape. */
export interface LeadInput {
  type: LeadType;
  goal: string;
  budget: BudgetRange;
  timeline: TimelineRange;
  contactName: string;
  contactEmail?: string;
  contactTelegram?: string;
  utm?: UtmParams;
}

/** Server-derived request metadata, never accepted from the client body. */
export interface RequestMeta {
  ipHash: string | null;
  userAgent: string | null;
  referrer: string | null;
  submittedAtMs: number;
  honeypot: string;
}

export interface LeadListItem {
  id: string; publicId: string; type: LeadType; status: LeadStatus;
  contactName: string; goalExcerpt: string; createdAt: string;
}
```

```ts
// lib/types/project.ts
export type ProjectCategory = 'web' | 'mobile' | 'tma';
export type PublishStatus = 'draft' | 'published' | 'archived';

export interface MediaVariant { key: string; width: number; format: 'webp' | 'avif'; }
export interface ProjectMetric { label: string; value: string; }

export interface ProjectCard {
  id: string; slug: string; title: string; category: ProjectCategory;
  summary: string; cover: MediaRef | null; tags: string[]; featured: boolean;
}

export interface MediaRef {
  id: string; alt: string | null; width: number | null; height: number | null;
  blurhash: string | null; variants: MediaVariant[];
}
```

```ts
// lib/types/jobs.ts
export interface LeadSubmittedPayload  { leadId: string }
export interface MediaProcessPayload   { mediaId: string }
export interface OutboxDispatchPayload { messageId: string }

export interface JobQueue {
  /** Enqueues a job. Called inside the caller's transaction so data and job commit together. */
  publish<T extends object>(
    topic: Topic,
    payload: T,
    options?: { uniqueKey?: string; runAt?: Date; maxAttempts?: number }
  ): void;
}
```

Правило: тип полей БД выводится из Drizzle (`typeof leads.$inferSelect`), руками не переписывается. В `lib/types` живут DTO границы и payload-контракты, не зеркала таблиц.

---

## 8. Валидация

Одна valibot-схема на вход, используется и на клиенте (мгновенные ошибки), и на сервере (источник истины). Схема лежит в `lib/schemas`, тип выводится из неё.

```ts
// lib/schemas/lead.ts
import * as v from 'valibot';

export const leadInputSchema = v.pipe(
  v.object({
    type: v.picklist(['web', 'mobile', 'tma', 'other']),
    goal: v.pipe(v.string(), v.trim(), v.minLength(20), v.maxLength(2000)),
    budget: v.picklist(['under_3k', '3k_10k', '10k_30k', 'over_30k', 'unknown']),
    timeline: v.picklist(['asap', 'under_1m', '1_3m', 'over_3m', 'unknown']),
    contactName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
    contactEmail: v.optional(v.pipe(v.string(), v.trim(), v.email(), v.maxLength(255))),
    contactTelegram: v.optional(v.pipe(v.string(), v.trim(), v.regex(/^@?[a-zA-Z0-9_]{4,32}$/))),
    website: v.optional(v.literal(''))            // honeypot, must stay empty
  }),
  // At least one contact channel is required.
  v.forward(
    v.check((i) => Boolean(i.contactEmail || i.contactTelegram), 'contact_required'),
    ['contactEmail']
  )
);
```

Правила:
- сервер валидирует всегда, даже если клиент уже проверил;
- поля, которые задаёт сервер (`ipHash`, `status`, `spamScore`, `publicId`, любые `id`), в схему входа не попадают. Массовое присвоение из тела запроса запрещено;
- ошибки валидации возвращаются полем, а не общим текстом.

---

## 9. UI

**Токены.** Определяются один раз в `app.css` через `@theme`: палитра (surface, ink, accent, muted, danger), радиусы, тени, шкала типографики, ширина контейнера, длительности анимаций. Хардкод цветов и отступов в компонентах запрещён.

Направление визуала: плотный, тихий, деловой. Один акцентный цвет, много воздуха, крупная типографика в hero, кейсы карточками со скриншотами. Никаких градиентных заливок во весь экран и каруселей с автопрокруткой.

**Примитивы.** База — shadcn-svelte, компоненты копируются в `lib/ui` и правятся под токены. Ниже точный перечень, который собирается в каркасе до старта фич. Эскиз пропсов фиксирован, менять с бампом версии ядра.

| Компонент | Пропсы |
|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md' \| 'lg'`, `loading?: boolean`, `disabled?`, `href?`, `children` |
| `Input` | `value = $bindable()`, `type`, `name`, `placeholder?`, `invalid?: boolean`, `autocomplete?` |
| `Textarea` | `value = $bindable()`, `name`, `rows?`, `maxlength?`, `invalid?` |
| `Field` | `label: string`, `hint?`, `error?: string`, `required?: boolean`, `children` |
| `Select` | `value = $bindable()`, `options: {value,label}[]`, `name`, `invalid?` |
| `RadioCards` | `value = $bindable()`, `options: {value,label,description?,icon?}[]`, `name`, `columns?: 2\|3\|4` |
| `Checkbox` | `checked = $bindable()`, `name`, `label` |
| `FileDrop` | `accept: string`, `maxSizeMb: number`, `multiple?`, `onfiles: (f: File[]) => void` |
| `Badge` | `tone: 'neutral' \| 'success' \| 'warning' \| 'danger' \| 'accent'`, `children` |
| `Card` | `padding?: 'sm' \| 'md' \| 'lg'`, `href?`, `children` |
| `Dialog` | `open = $bindable()`, `title: string`, `description?`, `children`, `footer?: Snippet` |
| `Table` | `columns: {key,label,align?,width?}[]`, `rows: T[]`, `row: Snippet<[T]>`, `empty?: Snippet` |
| `Toast` | управляется классом `ToastStore` из `lib/state/toast.svelte.ts` |
| `Tabs` | `value = $bindable()`, `items: {value,label}[]` |
| `Pagination` | `page: number`, `pageCount: number`, `onpage: (p:number)=>void` |
| `Stepper` | `step: number`, `steps: string[]` |
| `EmptyState` | `title`, `description?`, `action?: Snippet` |
| `Skeleton` | `variant: 'text' \| 'block'`, `lines?: number` |

Правила:
- новую кнопку или инпут в слайсе не пишем, берём примитив. Не хватает варианта — правим примитив одним PR и указываем это в описании;
- примитив не знает о бизнес-сущностях, никаких `lead` и `project` внутри `lib/ui`;
- `kitchen-sink` роут рендерит все примитивы во всех состояниях, доступен только при `NODE_ENV !== 'production'`;
- навигация админки задаётся массивом в `lib/ui/nav-items.ts`, разметка layout не правится под каждый новый раздел.

---

## 10. Безопасность

Требование сквозное, проверяется в каждом PR.

**Аутентификация.**
- один админ, создаётся `scripts/create-admin.ts`, публичной регистрации нет;
- пароль хешируется argon2id (`memoryCost 19456, timeCost 2, parallelism 1`);
- сессия: 32 байта случайности в cookie, в БД лежит sha256 от токена. Cookie `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`, срок 30 дней со скользящим продлением;
- логин ограничен по частоте: 5 попыток на IP за 15 минут, ответ одинаковый при неверном логине и неверном пароле;
- выход инвалидирует строку сессии, не только cookie.

**Авторизация.**
- гард в `(admin)/+layout.server.ts` плюс проверка в каждом серверном обработчике админки. Гард на layout не считается достаточным для remote-функций и `+server.ts`;
- публичные роуты не отдают черновики: фильтр `status = 'published'` живёт в репозитории, а не в компоненте.

**Вход данных.**
- валидация valibot на каждой границе, включая query-параметры и параметры роутов;
- только Drizzle query builder, конкатенация SQL запрещена;
- markdown рендерится с санитайзом (allowlist тегов), `{@html}` без санитайза запрещён;
- загрузка файлов: allowlist mime, проверка магических байт, лимит 10 МБ, случайное имя в хранилище, исходное имя только в БД. Файлы отдаются через свой роут, а не из общей статики.

**Ответы и заголовки.**
- CSP без `unsafe-inline` для скриптов (SvelteKit проставляет nonce/hash), `frame-ancestors 'none'` кроме страницы, встраиваемой в Telegram;
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` минимальный;
- CSRF: встроенная проверка Origin у SvelteKit включена, не отключать.

**Данные и приватность.**
- IP хранится только как sha256 с серверной солью;
- в логи не попадают тело заявки, email, токены сессий и КП;
- публичная страница КП — единственный канал доставки клиенту, поэтому её защита критична: токен 32 байта из `crypto.randomBytes`, сравнение по времени не важно (индекс уникальный), `noindex, nofollow`, доступ закрывается по `validUntil`, лимит 30 обращений на IP в час, токен не попадает в логи и в `Referer` (страница ставит `Referrer-Policy: no-referrer`);
- отозвать КП можно из админки: перевод в `expired` закрывает ссылку немедленно;
- секреты только через `$env/static/private`, `.env` в `.gitignore`, `.env.example` без значений;
- файл БД и каталог загрузок лежат вне корня статики и не раздаются веб-сервером. Права `0600` на файл БД, владелец — пользователь сервиса. Caddy на пути к ним не смотрит;
- `*.db`, `*.db-wal`, `*.db-shm` и каталог загрузок в `.gitignore`. Боевой файл БД в репозиторий не попадает никогда.

**Антиспам формы.** Honeypot-поле, минимальное время заполнения 3 секунды, лимит 3 заявки на IP в час, накопительный `spamScore`. При превышении заявка сохраняется со `status = 'spam'` и не шлёт уведомление.

---

## 11. SvelteKit: топ-5 практик

Пять вещей, которые дают больше всего результата на этом проекте. Соблюдать без обсуждения.

### 1. Руны вместо привычек Svelte 4

`$state`, `$derived`, `$props`, `$effect` — и почти никогда `$effect`.

```ts
// lib/state/lead-form.svelte.ts
export class LeadFormState {
  step = $state(0);
  type = $state<LeadType | null>(null);
  goal = $state('');
  contactEmail = $state('');
  contactTelegram = $state('');

  // Derived, not an effect: recomputed automatically, no sync bugs.
  readonly canSubmit = $derived(
    this.type !== null && this.goal.trim().length >= 20 &&
    (this.contactEmail.length > 0 || this.contactTelegram.length > 0)
  );

  next() { if (this.step < 2) this.step += 1; }
}
```

Правила:
- вычисляемое значение — `$derived` или `$derived.by`, не `$effect` с присваиванием. `$effect` только для синхронизации с внешним миром: подписка, таймер, DOM-измерение, аналитика;
- общее реактивное состояние — класс в `.svelte.ts`, экземпляр создаётся в компоненте или прокидывается через context. Экспорт `$state`-переменной напрямую из модуля ломает реактивность на импорте, поэтому только класс или функция-фабрика;
- `$props()` с явным интерфейсом и `$bindable()` там, где нужен двусторонний биндинг: `let { value = $bindable(), invalid = false }: Props = $props()`;
- `$state` даёт глубокий прокси. Не класть в него `File`, `Date`-инстансы под мутацию, ссылки на DOM-узлы. Для замены целиком — `$state.raw`;
- `$app/stores` не используется, только `$app/state` (`page.url`, `page.data`).

### 2. Remote functions как единственный транспорт клиент-сервер

`.remote.ts` файлы вместо ручных `+server.ts` эндпоинтов и параллельных типов. Включается в `svelte.config.js`:

```js
kit: { experimental: { remoteFunctions: true } },
compilerOptions: { experimental: { async: true } }
```

```ts
// routes/(public)/lead/lead.remote.ts
import { form, query, getRequestEvent } from '$app/server';
import { leadInputSchema } from '$lib/schemas/lead';
import { container } from '$lib/server/container';

/** Public lead submission. Progressive enhancement works without JS. */
export const submitLead = form(leadInputSchema, async (data) => {
  const event = getRequestEvent();
  const lead = await container.leads.submit(data, container.meta.from(event));
  return { publicId: lead.publicId };
});

export const recentLeads = query(async () => {
  const { locals } = getRequestEvent();
  if (!locals.user) error(401, 'unauthorized');   // authorize inside every remote function
  return container.leads.listRecent(20);
});
```

Правила:
- `form()` для публичной формы заявки: работает без JS, даёт прогрессивное улучшение и валидацию одной схемой;
- `command()` для действий админки, где JS гарантированно есть (смена статуса, сортировка перетаскиванием);
- после мутации вызывать `refresh()` нужного query внутри обработчика — данные приедут в том же ответе, без второго round-trip и без `invalidateAll()`;
- авторизацию проверять внутри каждой remote-функции. `getRequestEvent()` внутри неё не годится для авторизации доступа к странице;
- версии `@sveltejs/kit` и `svelte` пиньтся точно: API за экспериментальным флагом, минорка может сломать сборку.

### 3. Правильный режим рендера на каждый роут

Лендинг и кейсы — трафик и SEO, админка — интерактив. Режимы задаются явно, по умолчанию не оставляются.

```ts
// routes/(public)/+layout.ts
export const prerender = true;    // landing and static sections, built to HTML
// routes/(public)/cases/[slug]/+page.ts
export const prerender = false;   // content changes from admin, SSR + cache headers
// routes/(admin)/+layout.ts
export const ssr = true; export const prerender = false;
```

- лендинг пререндерится целиком, форма остаётся рабочей за счёт `form()`;
- кейсы отдаются SSR с `cache-control: public, max-age=60, stale-while-revalidate=600`, это снимает нагрузку без инвалидации;
- в `load` возвращается только то, что рисуется. Полный `body` кейса не тянется в список карточек;
- медленный побочный кусок (например, счётчики) отдаётся стримингом: возврат промиса из `load` и `{#await}` в разметке;
- `+page.ts` только когда данные публичные. Всё, что трогает БД и секреты, лежит в `+page.server.ts` или `.remote.ts`.

### 4. Серверная граница и `hooks.server.ts` как один вход

- всё серверное только под `$lib/server`. Случайный импорт в клиентский код ломает сборку, и это защита, а не помеха;
- секреты только `$env/static/private`, читаются один раз в `lib/server/config.ts` и валидируются на старте. Приложение не поднимается с неполным env;
- `hooks.server.ts` делает ровно четыре вещи: разбирает сессию в `locals.user`, ставит `requestId`, вешает заголовки безопасности, логирует время ответа. Бизнес-логики в хуках нет;
- `handleError` пишет полную ошибку в лог с `requestId`, а клиенту отдаёт нейтральный текст и тот же `requestId`;
- типы `locals` описываются в `app.d.ts` один раз.

### 5. Сниппеты и композиция вместо копипасты разметки

- повторяющийся кусок разметки — `{#snippet}` + `{@render}`, а не третий копипаст. Сниппет передаётся пропсом там, где нужен слот: `footer?: Snippet`, `row: Snippet<[T]>`;
- `children` — тоже сниппет, типизируется `import type { Snippet } from 'svelte'`;
- анимации через `transition:`/`animate:` из `svelte/transition`, свою реализацию не писать;
- `<svelte:boundary>` вокруг рискованных участков (рендер markdown, встраиваемые виджеты), чтобы падение одного блока не сносило страницу;
- изображения кейсов отдаются `<picture>` с avif/webp и `loading="lazy"`, размеры проставлены всегда — иначе layout shift съедает Lighthouse.

---

## 12. Правила кода

**Безопасность.** Раздел 10, каждый пункт применим к каждому PR.

**ООП.**
- сервис, репозиторий и клиент — классы с зависимостями в конструкторе;
- один класс — одна ответственность. Класс, который и ходит в БД, и дёргает Telegram API, разбивается;
- внешний мир только за интерфейсом (`interface Notifier`), реализаций минимум две: боевая и фейк;
- наследование не используется для переиспользования кода, только композиция. Абстрактные базовые классы не заводятся;
- чистая доменная логика выносится в функции без состояния, чтобы её можно было бить property-based тестами.

**DRY.**
- строковый литерал, встречающийся дважды (топик, ключ шаблона, роут), выносится в константу;
- одна валидационная схема на клиент и сервер, второй копии нет;
- одна вёрстка кнопки/поля/таблицы — в `lib/ui`;
- дублирование логики между слайсами поднимается в `lib/utils` или в сервис. Правило трёх: третий копипаст запрещён, второй допустим, если абстракция ещё не видна.

**TypeScript.**
- `strict: true`, `noUncheckedIndexedAccess: true`. `any` запрещён, `unknown` с сужением допустим;
- `as` только после проверки, `as unknown as T` запрещено;
- типы данных БД выводятся из Drizzle, не переписываются руками.

**Комментарии.** На английском, кратко, объясняют *почему*. Пересказ кода запрещён. JSDoc на публичные методы сервисов и на неочевидные инварианты.

```ts
// Bad: increments the counter
// Good: retry counter drives the exponential backoff in outbox.dispatch
```

Закомментированный код в PR не остаётся. `TODO` только с привязанной задачей: `// TODO(#42): swap fake notifier for the live bot after the token is issued`.

**Прочее.** Файлы короче 300 строк, функции короче 50. Именование: классы `PascalCase`, файлы `kebab-case`, константы `SCREAMING_SNAKE`. Логи структурные (`pino`), без PII.

---

## 13. Конвенция коммитов, PR и комментариев

Язык всего технического текста — английский: коммиты, PR, комментарии, имена веток, сообщения об ошибках в логах.

**Автор коммитов фиксирован.** Настраивается один раз в репозитории:

```bash
git config user.name  "Sobol17"
git config user.email "sobolinskiii@mail.ru"
```

Коммит содержит только заголовок и, при необходимости, тело. Запрещено добавлять:
- трейлеры `Co-Authored-By`, `Co-authored-by: Claude` и любые упоминания ассистента;
- строки вида `Generated with ...`, ссылки на инструмент, эмодзи;
- подписи, которых не поставил автор.

**Формат.** Conventional Commits, всегда:

```
type(scope): summary
```

- `type` из закрытого набора: `feat | fix | test | refactor | chore | docs`;
- `scope` — область: `lead`, `projects`, `media`, `proposal`, `admin`, `ui`, `db`, `queue`, `ci`, `deploy`;
- `summary` в императиве, со строчной буквы, без точки, до 50 символов, по делу;
- тело только чтобы объяснить *почему*, не *что*. Перечисление изменённых файлов не пишется.

Примеры:

```
feat(lead): add multi-step submission form
fix(queue): make outbox dispatch idempotent on retry
test(proposal): cover send transition from draft only
refactor(ui): extract field wrapper from form inputs
chore(deploy): pin node version in dockerfile
```

**Ритм коммитов.** Сессия коммитит сама по ходу работы, маленькими логическими шагами после каждого осмысленного куска, не сваливает слайс одним коммитом в конце. Каждый коммит по возможности проходит `svelte-check`.

**Ветки и PR.** Ветка `feat/lead-form`, `fix/outbox-retry`. PR даже при работе в одиночку: он гоняет CI-гейт и хранит историю решений. Заголовок содержит ID задачи, тело короткое: что делает слайс, какие контракты затронуты, чем покрыто тестами.

**Проза.** Дисциплина `stop-slop` действует на комментарии, PR и документацию: активный залог, императив, конкретика, без em-dash, без филлеров и вводных оборотов.

---

## 14. Тесты

Тест выводится из критериев приёмки задачи, а не из реализации. Ловушка: сначала пишется код, потом тесты, подтверждающие, что код делает то, что делает, вместе с багами. Тест кодирует контракт.

Тесты привязаны к слайсу и PR. Отдельной сущности «тесты на стадию» нет. Слайс мёрджится только с тестами, гейт красный без них.

**Обязательные типы на каждый слайс:**

1. **Контрактные на стыках.** Джоб или событие слайса соответствует payload-схеме из раздела 6. Фейковый клиент — это и есть тестовый шов: валидирует вход и падает, если слайс шлёт мусор. Пример: `LeadService.submit` публикует `lead.submitted` ровно с `{ leadId }` и `singletonKey`, равным `leadId`.
2. **Идемпотентность джобов.** На каждый хендлер тест, который гоняет его дважды с тем же payload и проверяет, что эффект ровно один: одна запись в outbox, один переход статуса, один набор вариантов картинки.
3. **Путь ошибки.** Фейк возвращает 500 и таймаут: проверяется ретрай, запись `lastError`, отсутствие частичного состояния в БД.
4. **Property-based (fast-check)** на чистой логике: скоринг спама, расчёт вилки цены, генерация слага, парсинг UTM. Генерятся входы, проверяются инварианты (слаг всегда url-safe и непустой, скоринг в диапазоне 0..100).
5. **E2E (Playwright)** на денежный путь: открыть лендинг, отправить заявку, увидеть страницу благодарности, найти заявку в админке. Прогоняется на каждый PR.

Тестовая БД: свежий SQLite-файл во временном каталоге на каждый прогон, миграции применяются перед тестами. Интеграционные тесты получают свой файл на тест-кейс и удаляют его после, состояние между тестами не течёт. `:memory:` годится только там, где не проверяется поведение файла и WAL. Юнит-тесты сервисов работают на фейковых репозиториях, без БД вообще.

Отдельный обязательный тест на каждый джоб-хендлер: прогон дважды подряд и прогон после «зависания» в `active`. Раннер возвращает подвисшие джобы в работу, поэтому повторное исполнение — штатный сценарий, а не край.

---

## 15. Инфраструктура

**Миграции.** Генерируются `drizzle-kit generate` с `dialect: 'sqlite'` из `schema.ts`, руками не пишутся. Применяются автоматически при старте приложения (`migrate()` до подъёма сервера), отдельного шага деплоя не нужно. В PR-гейте прогоняются на чистом файле. Правка уже применённой миграции запрещена, только новая.

Ограничение SQLite: `ALTER TABLE` умеет мало, поэтому drizzle-kit на многие изменения генерит пересоздание таблицы с копированием данных. Перед мёржем миграции проверяй сгенерированный SQL глазами и прогоняй её на копии боевого файла, а не только на пустом.

**Сид.** `scripts/seed.ts` создаёт админа, 6 демо-кейсов (2 web, 2 mobile, 2 tma), теги, 5 заявок в разных статусах, 1 черновик КП и 1 отправленное КП с рабочим токеном. Фейковые клиенты работают на тех же фикстурах: разработка и тесты идут на одних данных.

**Конфиг.** `lib/server/config.ts` читает `$env/static/private` один раз, валидирует valibot-схемой, падает на старте при неполном наборе. Обращений к `process.env` в коде нет.

`.env.example`:

```
DATABASE_FILE=./var/data/app.db
PUBLIC_SITE_URL=http://localhost:5173
SESSION_SECRET=
IP_HASH_SALT=
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=
UPLOADS_DIR=./var/uploads
USE_FAKE_CLIENTS=true
```

**Long-lead.** После сокращения объёма остался один пункт: домен, DNS и сертификат. Токен Telegram-бота получается за пять минут у BotFather, но всё равно берётся в день один, чтобы `Notifier` проверялся на живом канале. Прогрев почтового домена, SPF/DKIM/DMARC и ключ LLM из объёма выпали вместе с почтой и LLM. До готовности домена `USE_FAKE_CLIENTS=true`, весь код пишется против фейков.

**CI (гейт на PR).** `pnpm lint`, `svelte-check`, `vitest run`, миграции на чистом файле БД, `playwright test`, `vite build`. Сервисов поднимать не нужно, гейт бежит на одном раннере без docker. Деплоя нет.

**CD (мёрдж в main).** Сборка, выкладка на VPS, рестарт одного процесса `node build/index.js` под systemd. Миграции применяются самим приложением на старте. Caddy терминирует TLS, проксирует, отдаёт заголовки безопасности. Откат — предыдущая сборка.

Файл БД и каталог загрузок живут вне каталога сборки (`/var/lib/sobol-portfolio/`), выкладка их не трогает. Перед рестартом деплой снимает бэкап: откат кода без отката данных должен оставаться безопасным.

**Бэкапы.** `VACUUM INTO '/backups/app-<date>.db'` ежедневно по таймеру systemd. Команда работает на живой БД и даёт консистентную копию, поэтому останавливать сервис не нужно. Копирование файла `cp` на работающей базе запрещено: WAL остаётся снаружи и копия бьётся.

Каталог загрузок архивируется тем же скриптом. Хранение 14 дней. Раз в месяц восстановление проверяется на локальной машине: подмена файла, старт, открытие админки.

---

## 16. CONTRACT GAP

Не хватает типа, поля, топика, таблицы или пропса примитива — **СТОП**. Код с выдуманным контрактом не пишется, схема БД по ходу задачи не расширяется.

Сессия выдаёт блок и останавливается:

```
CONTRACT GAP
Нужно: поле leads.sourcePage (varchar 255)
Зачем: слайс S5 пишет страницу, с которой ушла заявка, для отчёта по конверсии
Предлагаемая форма: sourcePage: varchar('source_page', { length: 255 })
Затрагивает: schema.ts, lib/types/lead.ts (LeadInput), lib/schemas/lead.ts
Заглушка на время ожидания: значение не пишется, поле в UI скрыто
```

Дальше человек решает: аппендит контракт в `tech.md`, бампает версию, генерирует миграцию. Сессия продолжает работу на локальной заглушке и после апдейта ядра переписывает заглушку на реальный контракт.

---

## 17. Definition of Done одной задачи

Задача закрыта, когда все пункты зелёные:

- [ ] `pnpm lint` и `prettier --check` без ошибок;
- [ ] `svelte-check` без ошибок и без новых предупреждений;
- [ ] `vite build` проходит;
- [ ] тесты по доктрине раздела 14: выведены из критериев приёмки; на каждый джоб слайса — тест идемпотентности; на стыке — контрактный тест;
- [ ] новых контрактов мимо `tech.md` нет;
- [ ] UI собран из примитивов `lib/ui`, самописных кнопок и полей нет;
- [ ] чек-лист безопасности раздела 10 применён к затронутым местам;
- [ ] коммиты по конвенции раздела 13, автор Sobol17, следов ассистента нет;
- [ ] PR смёржен, автодеплой на тестовый VPS прошёл, фича проверена руками на нём.

---

## 18. Дорожная карта

### Стадия 0 — каркас

Фичи не начинаются, пока каркас не в `main` и чек-лист не зелёный целиком.

Порядок сборки:

1. Репозиторий, `pnpm`, SvelteKit + TS + Tailwind v4, ESLint/Prettier. Внешних сервисов на локальной машине нет, БД поднимается сама файлом.
2. `lib/server/config.ts` + `.env.example`, падение на старте при неполном env.
3. Drizzle: `schema.ts` из раздела 5, `drizzle.config.ts` на `dialect: 'sqlite'`, первая миграция, подключение с PRAGMA, автоприменение миграций на старте, `scripts/seed.ts`.
4. Токены дизайна в `app.css`, примитивы из раздела 9 в `lib/ui`, роут `kitchen-sink`.
5. Layout публичной части и админки, навигация массивом, гард авторизации, страница логина, argon2 + сессии + rate limit.
6. Очередь: таблица `jobs`, `topics.ts`, `JobQueue`, раннер с захватом джоба одним UPDATE, backoff, возврат подвисших `active` при старте, планировщик периодических задач, демо-джоб.
7. Клиенты за интерфейсами + фейки: `Notifier` (Telegram), `Storage` (файлы). Фейки копят вызовы в памяти и умеют падать по флагу.
8. Общие типы `lib/types`, схемы `lib/schemas`, `app.d.ts`.
9. `hooks.server.ts`: сессия, requestId, CSP и заголовки, логирование, `handleError`.
10. **Эталонная вертикаль**: минимальная форма заявки end-to-end. `routes/(public)/lead/` + `lead.remote.ts` + `LeadService` + `LeadRepository` + джоб `lead.submitted` + outbox + фейковый `Notifier` + четыре типа тестов. Это шаблон, а не пример: каждый последующий слайс повторяет его раскладку файлов.
11. CI-гейт и CD, деплой на тестовый VPS, Caddy, systemd на один процесс, каталог данных вне сборки, таймер бэкапа.

**Чек-лист «каркас готов»** (проходить по пунктам, не на глаз):

- [ ] CI зелёный на тривиальном PR;
- [ ] layout, навигация и гард авторизации в `main`, вход в админку работает;
- [ ] все примитивы из раздела 9 отрендерены в `kitchen-sink` во всех состояниях;
- [ ] раннер разбирает демо-джоб, ретраит его при ошибке и возвращает подвисший `active` после рестарта процесса;
- [ ] фейки `Notifier` и `Storage` работают и умеют падать по флагу;
- [ ] миграции проходят на чистом файле БД в CI, сид наполняет пустую базу, PRAGMA `foreign_keys` включён и каскады реально работают;
- [ ] эталонная вертикаль (форма заявки) в `main`, заявка долетает до БД и до фейкового уведомления;
- [ ] четыре типа тестов эталонной вертикали зелёные, включая идемпотентность `lead.submitted`;
- [ ] задеплоено на тестовый VPS, форма отправляется на реальном домене;
- [ ] `git log` чистый: автор Sobol17, формат Conventional Commits, следов ассистента нет.

### Стадия 1 — фичи слайсами

Один слайс = одна задача = один PR. Слайсы идут по порядку, параллелить нечего: работа одна.

**S1. Админка: CRUD кейсов**
Домен: `project.service.ts`, `project.repository.ts`. Роуты: `admin/projects`, `admin/projects/new`, `admin/projects/[id]`.
Контракты: `projects`, `tech_tags`, `project_tags`, `ProjectCard`, `PublishStatus`.
Компоненты: `Table`, `Field`, `Input`, `Textarea`, `Select`, `Badge`, `Button`, `Dialog`, `EmptyState`.
Приёмка: создать, отредактировать, опубликовать, снять с публикации, удалить кейс. Слаг генерится из заголовка, уникален, при коллизии добавляется суффикс. Сортировка перетаскиванием сохраняет `position`. Черновик недоступен на публичных роутах.
Тесты: контрактный на форму слайса, property-based на генератор слага, путь ошибки на дубль слага, e2e на путь «создал → опубликовал → виден на публичной странице».

**S2. Медиа: загрузка и обработка**
Домен: `media.service.ts`, `Storage`, джоб `media.process`. Роуты: `admin/media`, компонент загрузки внутри редактора кейса.
Контракты: `media`, `project_media`, `MediaProcessPayload`, `MediaVariant`, `MediaRef`.
Компоненты: `FileDrop`, `Skeleton`, `Dialog`.
Приёмка: загрузка изображения проверяет mime по магическим байтам и размер, кладёт файл со случайным ключом, ставит джоб. Джоб генерит webp/avif в трёх ширинах и blurhash, переводит `status → ready`. Галерея кейса сортируется. Битый файл даёт `status = 'failed'` и понятную ошибку в UI.
Тесты: идемпотентность `media.process` (повтор не плодит варианты), путь ошибки на битый файл, контрактный на payload, юнит на валидатор загрузки.

**S3. Публичный раздел кейсов**
Роуты: `cases`, `cases/[slug]`, `sitemap.xml`, `robots.txt`.
Контракты: `ProjectCard`, `MediaRef`, `ProjectCategory`.
Компоненты: `Card`, `Badge`, `Tabs`, `Pagination`, `EmptyState`, `SeoHead`.
Приёмка: список фильтруется по категории без перезагрузки, отдаёт только опубликованное. Страница кейса рендерит санитайзенный markdown, галерею с `<picture>`, метрики, ссылки. OG-теги и JSON-LD на месте, sitemap содержит опубликованные кейсы. Lighthouse на мобиле: performance и SEO не ниже 90.
Тесты: юнит на санитайз markdown (скрипт вырезается), контрактный на `load` (черновик не попадает в выдачу), e2e на переход «список → кейс», проверка sitemap.

**S4. Лендинг**
Роуты: `(public)/+page.svelte`, пререндер.
Компоненты: `Section`, `Card`, `Button`, `RadioCards`, `Badge`.
Приёмка: блоки hero, три направления (web / mobile / tma), процесс работы, стек, избранные кейсы из БД, FAQ, финальный CTA на форму. Пререндер собирает страницу в HTML, форма остаётся рабочей. Контентные тексты лежат в одном модуле, а не размазаны по разметке. Адаптив от 360px, темы контрастны по WCAG AA.
Тесты: e2e на прохождение всех якорей и CTA, юнит на выборку избранных кейсов, snapshot-проверка контентного модуля не нужна.

**S5. Форма заявки, полная версия**
Роуты: `lead`, `thanks`. Расширение эталонной вертикали.
Контракты: `LeadInput`, `RequestMeta`, `leadInputSchema`, `leads`, `lead.submitted`.
Компоненты: `Stepper`, `RadioCards`, `Field`, `Textarea`, `Input`, `Button`, `Toast`.
Приёмка: три шага (тип → цель, бюджет, срок → контакт), состояние формы в классе с рунами, назад-вперёд не теряет введённое. Валидация полем, ошибки видны рядом с полем. Работает без JS. UTM и referrer пишутся из query, а не из тела. Антиспам: honeypot, минимальное время, лимит на IP, `spamScore`. Успех ведёт на `thanks` с номером заявки и обещанным сроком ответа.
Тесты: property-based на скоринг спама, контрактный на публикацию `lead.submitted`, путь ошибки при недоступной БД, e2e с выключенным JS.

**S6. Админка: входящие заявки**
Роуты: `admin/leads`, `admin/leads/[id]`.
Контракты: `leads`, `lead_notes`, `LeadListItem`, `LeadStatus`.
Компоненты: `Table`, `Badge`, `Tabs`, `Pagination`, `Dialog`, `Textarea`, `EmptyState`.
Приёмка: список с фильтром по статусу и типу, поиск по имени и тексту, пагинация. Карточка заявки показывает всё, включая UTM и источник. Смена статуса через `command()` с обновлением списка в том же ответе. Заметки добавляются и не редактируются. Спам отделён в свою вкладку.
Тесты: контрактный на переходы статусов (недопустимый переход отклоняется), юнит на фильтры репозитория, e2e на путь «заявка пришла → сменил статус → фильтр показывает верно».

**S7. Коммерческое предложение, ручное**
Домен: `proposal.service.ts`, `proposal.repository.ts`. Фоновых джобов у слайса нет. Роуты: `admin/proposals`, `admin/proposals/[id]`, публичная `p/[token]`.
Контракты: `proposals`, `ProposalStatus`, `ProposalScopeItem`.
Компоненты: `Field`, `Input`, `Textarea`, `Table`, `Badge`, `Button`, `Dialog`.
Приёмка:
- КП создаётся из карточки заявки, поля заявки (тип, цель, бюджет, срок) подставляются в шапку и не перепечатываются руками;
- редактор один: заголовок, markdown-тело, список работ `scope`, вилка цены, срок в неделях, `validUntil`. Стартовый текст берётся из статического шаблона на тип проекта (`web`, `mobile`, `tma`), шаблоны лежат в одном модуле;
- предпросмотр показывает ровно то, что увидит клиент;
- кнопка «Опубликовать» делает `draft → sent` условным UPDATE, ставит `sentAt`, генерит токен и возвращает готовую ссылку с кнопкой копирования. Владелец отправляет её клиенту сам;
- повторное нажатие ссылку не меняет и второй раз статус не двигает;
- публичная страница по токену рендерит санитайзенный markdown, ставит `viewedAt` один раз при первом открытии, отдаёт `noindex`, после `validUntil` показывает страницу «срок истёк» без содержимого;
- отзыв из админки переводит в `expired` и закрывает ссылку сразу;
- в списке КП виден статус и факт просмотра клиентом.

Тесты: контрактный на переходы статусов (`sent` достижим только из `draft`, повтор идемпотентен), юнит на подстановку шаблона по типу заявки, юнит на санитайз markdown КП, path-тест на истёкший и отозванный токен, e2e на «создал из заявки → опубликовал → открыл ссылку в чистом контексте → в админке виден просмотр».

**S8. Уведомления в Telegram и закрытие продакшена**
Домен: `notifier.telegram.ts`, `outbox.dispatch` на боевом клиенте, `media.gc`.
Приёмка:
- новая заявка приходит владельцу одним сообщением в Telegram: тип, бюджет, срок, имя, контакт, первые 200 символов цели, ссылка на карточку в админке;
- дубли исключены `dedupeKey`, повторный прогон джоба второго сообщения не шлёт;
- заявка со `status = 'spam'` уведомление не шлёт;
- недоступность Telegram API не теряет сообщение: строка остаётся `pending`, ретраится, после исчерпания попыток пишет `lastError` и видна в админке;
- фейк заменён на боевого бота, `USE_FAKE_CLIENTS=false` на проде, `TELEGRAM_OWNER_CHAT_ID` проверен живым сообщением;
- заголовки безопасности и CSP проверены на боевом домене, логи структурные и без PII, бэкап настроен и восстановление проверено, 404 и 500 оформлены, `/healthz` отвечает.

Тесты: контрактный на формат сообщения (фейк валидирует payload и падает на мусоре), идемпотентность `outbox.dispatch` при повторе, путь ошибки на 500 и таймаут Telegram API, e2e smoke на прод-домене после деплоя.

---

Конец ядра v1. Изменения — только append-only, с бампом версии и строкой в changelog.
