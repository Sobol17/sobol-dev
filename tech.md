# tech.md — ядро проекта `agency-site`

**Версия ядра: v4**

Changelog:
- v4 — смена концепции: сайт диджитал-агентства вместо личного портфолио. Публичная часть сведена к трём страницам: лендинг со встроенной формой заявки, «спасибо» и кастомная 404. Страницы кейсов, CMS кейсов и медиатека удалены: кейсы стали статическим контентом лендинга. Коммерческие предложения выведены из объёма, админка v1 работает только с заявками. Из схемы удалены `media`, `projects`, `tech_tags`, `project_tags`, `project_media`, `proposals` и их енумы. Удалены топики `media.process`, `media.gc`, клиент `Storage`, примитив `FileDrop`, env `UPLOADS_DIR`. Добавлен `lib/site.ts` как единственное место для бренда и контактов. Проект переименован в `agency-site`, бренд выбирается позже. Дорожная карта: стадия 2 из слайсов A1–A5.
- v3 — БД переведена с PostgreSQL на SQLite (`better-sqlite3` + Drizzle). Схема переписана под sqlite-core: текстовые id, целочисленные таймстампы, json в `text({ mode: 'json' })`, енумы через `text({ enum })`. pg-boss удалён, очередь живёт в таблице `jobs` того же файла БД, воркер крутится в процессе приложения. Деплой сведён к одному процессу, бэкап — к копии файла.
- v2 — сокращён объём. Убраны LLM-черновик КП (`LlmClient`, топик `proposal.draft`) и почтовый канал (`Mailer`, SMTP). Уведомления только в Telegram. Топик `proposal.send` удалён: публикация КП стала синхронным переходом статуса, доставка клиенту ручная по публичной ссылке. `outbox_channel` сведён к одному значению.
- v1 — исходное ядро: стек, схема БД, контракты очереди, общие типы, UI-примитивы, правила кода, дорожная карта на две стадии.

Правило версии: файл меняется только append-only. Любая правка контракта (таблица, поле, payload джоба, общий тип, пропсы примитива) бампает версию и добавляет строку в changelog. Сессия нейросети этот файл по своей инициативе не редактирует, только по прямому поручению человека.

---

## 0. Как пользоваться файлом

Это единственный источник истины. Каждая сессия читает его первым и подчиняется дословно. Контракты не выдумываются: нет нужного типа, поля или топика — сессия выдаёт блок `CONTRACT GAP` (раздел 16) и останавливается.

Роль одна: владелец продукта, тимлид и разработчик — один человек (Sobol17). Разделения на LEAD/DEV нет, но разделение ответственности внутри работы есть: сначала каркас целиком, потом фичи вертикальными слайсами, по одному слайсу за раз.

---

## 1. Проект

**Что делает.** Сайт диджитал-агентства. Публичная часть — одна продающая лендинг-страница: она объясняет, что делает агентство, показывает работы и собирает заявки через встроенную форму. Закрытая админка принимает заявки и ведёт их по статусам.

**Для кого.** Малый и средний бизнес, которому нужен цифровой продукт для продаж, записи и работы с клиентами. Основные направления — веб-приложения и Telegram Mini Apps, мобильная разработка вторична.

**Цель.** Превратить посетителя в заявку с достаточной информацией, чтобы агентство ответило по существу без переписки-уточнения. Форма короткая: тип проекта, три вопроса, контакт.

**Бренд.** Не выбран. Рабочий slug проекта `agency-site`. Имя бренда, контакты и ссылки на соцсети живут в одной константе `lib/site.ts`, смена бренда — правка одного файла.

**Страницы.**

| Путь | Что это |
|---|---|
| `/` | лендинг: предложение, работы, услуги, процесс, FAQ, форма заявки секцией по якорю `#brief` |
| `/thanks` | подтверждение успешной отправки: номер заявки и срок ответа |
| любой несуществующий | кастомная 404 в стиле сайта с выходом на главную и к форме |
| `/login`, `/admin/...` | вход и админка, закрыты от индексации |

Больше публичных страниц нет. Новая страница — решение человека с бампом ядра.

**Как это работает целиком.** Посетитель заполняет форму на лендинге и попадает на `/thanks`. Заявка падает в БД, владелец получает уведомление в Telegram со ссылкой на карточку в админке. В админке владелец меняет статус заявки и оставляет заметки. Ответ клиенту идёт вручную тем каналом, который клиент оставил. Автоматической рассылки клиенту в системе нет.

**Метрика.** Доля посетителей лендинга, отправивших форму. Время от заявки до первого ответа клиенту.

**Не входит в объём.** Отдельные страницы кейсов и CMS для них, коммерческие предложения в системе, блог, оплата на сайте, личный кабинет клиента, мультиязычность, регистрация пользователей. Админ ровно один, создаётся сидом. Команда в админке появится с расширением агентства и отдельным контрактом.

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
    site.ts                   бренд, контакты, соцсети, единственное место
    types/                    общие TS-типы, единственное место (раздел 7)
      index.ts
      lead.ts  jobs.ts
    schemas/                  valibot-схемы, общие для клиента и сервера
      lead.ts  auth.ts  common.ts
    ui/                       примитивы (раздел 9), без бизнес-логики
      button/  input/  field/  select/  radio-cards/  textarea/  checkbox/
      badge/  card/  dialog/  table/  toast/  tabs/  pagination/
      stepper/  empty-state/  skeleton/
      index.ts  nav-items.ts
    components/               общие композиты публичной части
      seo-head.svelte  section.svelte  logo.svelte
    state/                    клиентское состояние, классы с рунами
      toast.svelte.ts  lead-form.svelte.ts
    utils/                    чистые функции, без импортов сервера
      format.ts  spam.ts  public-id.ts  seo.ts  errors.ts
    server/
      config.ts               единый конфиг, читает env один раз
      container.ts            композиционный корень, сборка сервисов
      db/
        index.ts              подключение, PRAGMA, миграции на старте
        schema.ts  migrations/
      repositories/           доступ к данным, по одному классу на агрегат
        lead.repository.ts  outbox.repository.ts  session.repository.ts
      domain/                 бизнес-логика, классы, без знания HTTP
        lead.service.ts  auth.service.ts  rate-limit.service.ts
      clients/                внешний мир за интерфейсами + фейки
        notifier.ts  notifier.telegram.ts  notifier.fake.ts
      queue/
        topics.ts             имена топиков, единственное место
        queue.ts              JobQueue: публикация и захват джобов
        runner.ts             цикл воркера, ретраи, backoff
        scheduler.ts          постановка периодических джобов
        handlers/             по файлу на джоб
      security/
        password.ts  session.ts  csp.ts  ip.ts
  routes/
    +error.svelte                     кастомная 404 и нейтральная 500
    (public)/
      +layout.svelte
      +page.svelte                    лендинг, форма заявки секцией #brief
      landing-content.ts              тексты и кейсы лендинга, единственное место
      _components/                    секции лендинга, карточка кейса
      _lead/                          эталонная вертикаль: форма заявки без своего роута
        lead.remote.ts  lead-form.svelte  constants.ts
      thanks/+page.svelte
      sitemap.xml/+server.ts
      robots.txt/+server.ts
    (admin)/
      +layout.server.ts               гард авторизации
      +layout.svelte                  навигация админки (данными, не разметкой)
      admin/+page.server.ts           редирект на admin/leads
      admin/leads/...                 слайс A4
    login/+page.svelte
    healthz/+server.ts
    kitchen-sink/+page.svelte         витрина примитивов, только dev
static/
  cases/                      обложки кейсов, avif + webp в трёх ширинах
tests/
  unit/  contract/  property/  e2e/
scripts/
  seed.ts  create-admin.ts
```

Правила расположения:
- всё серверное лежит под `lib/server`, импорт оттуда в клиентский код запрещён физически (SvelteKit падает на сборке, не отключать);
- слайс живёт целиком в своей папке: домен + репозиторий + роут + локальные компоненты;
- локальный компонент фичи лежит рядом с роутом (`admin/leads/_components/`), в `lib/ui` и `lib/components` попадает только то, что используют два и более слайса;
- в `_lead/` нет `+page`, поэтому своего URL у формы нет, она живёт рядом с лендингом. Префикс `_` помечает такие папки явно, как у `_components/`.

---

## 4. Архитектура

Три слоя, зависимости идут только вниз:

```
routes (+page.server.ts, *.remote.ts)   транспорт: валидация входа, авторизация, коды ответов
        ↓
lib/server/domain (сервисы, классы)     бизнес-правила, не знают о HTTP и Request
        ↓
lib/server/repositories (классы)        SQL через Drizzle, не знают о бизнес-правилах
lib/server/clients (интерфейсы)         Telegram
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

**Интерфейс + фейк на каждый внешний сервис.** Внешний сервис один: `Notifier` (Telegram). Фейк живёт в репо, пишет вызовы в память и умеет возвращать ошибку по флагу. Разработка не ждёт токена бота и домена. Новый внешний сервис приходит вместе с фейком в одном PR.

**Клиентское состояние.** Классы в `.svelte.ts` с полями `$state`, не разрозненные переменные и не сторы (раздел 11).

**Чистая доменная логика отдельно.** Скоринг спама, генерация публичного номера заявки, парсинг UTM — чистые функции в `lib/utils` или методы без побочек. На них property-based тесты.

**Контент лендинга.** Тексты, FAQ и кейсы лежат в `routes/(public)/landing-content.ts`, типы контента описаны там же: их видит только лендинг. Бренд и контакты берутся из `lib/site.ts`. В разметке секций литералов с текстом нет.

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
import { sqliteTable, text, integer, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// ---------- enums as const tuples (single source for schema and types) ----------
export const LEAD_TYPES         = ['web', 'mobile', 'tma', 'other'] as const;
export const LEAD_STATUSES      = ['new', 'qualifying', 'proposal_sent', 'won', 'lost', 'spam'] as const;
export const BUDGET_RANGES      = ['under_3k', '3k_10k', '10k_30k', 'over_30k', 'unknown'] as const;
export const TIMELINE_RANGES    = ['asap', 'under_1m', '1_3m', 'over_3m', 'unknown'] as const;
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

`LEAD_STATUSES` не меняется: `proposal_sent` означает, что агентство отправило предложение клиенту вне системы, любым каналом.

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
- удаление заявки каскадит на `lead_notes`;
- `outbox_messages.dedupe_key` — точка идемпотентности отправки. Формат: `<channel>:<templateKey>:<entityId>`;
- `jobs.unique_key` дедуплицирует только незавершённые джобы: частичный уникальный индекс не мешает поставить ту же работу повторно после её завершения;
- писатель в БД один. Второй процесс, пишущий в тот же файл, в архитектуру не закладывается.

---

## 6. Контракты очереди (таблица `jobs`)

Внешнего брокера нет. Очередь — таблица `jobs` в том же файле БД, воркер крутится внутри процесса приложения. Причина: SQLite допускает одного писателя, поэтому второй процесс, конкурирующий за файл, добавил бы блокировки без выигрыша. Деплой от этого сводится к одному systemd-юниту.

Имена топиков живут в одном файле `lib/server/queue/topics.ts`, строковые литералы в коде запрещены.

```ts
export const TOPICS = {
  LEAD_SUBMITTED:  'lead.submitted',
  OUTBOX_DISPATCH: 'outbox.dispatch'
} as const;
```

| Топик | Payload | Что делает | Идемпотентность | Ретраи |
|---|---|---|---|---|
| `lead.submitted` | `{ leadId: string }` | Считает spamScore, создаёт outbox-запись владельцу в Telegram | `uniqueKey = 'lead.submitted:' + leadId`; outbox-вставка через `onConflictDoNothing` по `dedupeKey` | 5, exponential, старт 15 c |
| `outbox.dispatch` | `{ messageId: string }` | Отдаёт сообщение в `Notifier` | Условный UPDATE `... where status = 'pending'`; фактическая отправка только по выигранному переходу | 5, старт 30 c |

Смена статуса заявки и заметки в админке идут синхронно в `command()`, джобов у них нет.

Правила для всех хендлеров:
- хендлер принимает только идентификатор, данные читает из БД. Дублировать бизнес-данные в payload запрещено, иначе ретрай работает на устаревшем снимке;
- каждый переход состояния делается условным UPDATE с проверкой текущего статуса, а не чтением с последующей записью;
- падение внешнего клиента бросает ошибку и отдаёт джоб на ретрай, никаких проглоченных `catch`;
- исчерпан лимит ретраев — статус `failed`, текст в `jobs.last_error`, лог `error` с `jobId` и сущностью;
- джоб пишется так, чтобы держаться внутри одной короткой транзакции. Долгая работа делается вне транзакции, в БД пишется только результат: длинная транзакция держит единственного писателя и тормозит веб-запросы;
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
- `scheduler.ts` ставит периодические джобы с `uniqueKey`, включающим дату. Внешнего cron нет. В v4 периодических топиков нет, планировщик остаётся инфраструктурой каркаса;
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
// lib/types/jobs.ts
export interface LeadSubmittedPayload  { leadId: string }
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

```ts
// lib/site.ts
export interface SiteInfo {
  name: string;                                // brand in titles, header, footer, og tags
  telegram: { handle: string; href: string };
  email: string;
}

/** Brand and public contacts. The brand is not chosen yet: swap it here and nowhere else. */
export const SITE: SiteInfo = { /* ... */ };
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
- ошибки валидации возвращаются полем, а не общим текстом;
- схемы админки (фильтры списка, смена статуса, заметка) лежат в том же `lib/schemas/lead.ts`.

---

## 9. UI

**Токены.** Определяются один раз в `app.css` через `@theme`: палитра (surface, ink, accent, muted, danger), радиусы, тени, шкала типографики, ширина контейнера, длительности анимаций. Хардкод цветов и отступов в компонентах запрещён.

Направление визуала: плотный, тихий, деловой, для малого и среднего бизнеса. Один акцентный цвет, много воздуха, крупная типографика в hero. Работы агентства показываются настоящими интерфейсами, а не заглушками. Никаких градиентных заливок во весь экран и каруселей с автопрокруткой. Правила сборки экрана из токенов — раздел «Дизайн интерфейса» в `CLAUDE.md`. Входные данные для лендинга — `docs/design-review/2026-09-24/review.md`.

**Примитивы.** База — shadcn-svelte, компоненты копируются в `lib/ui` и правятся под токены. Ниже точный перечень. Эскиз пропсов фиксирован, менять с бампом версии ядра.

| Компонент | Пропсы |
|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md' \| 'lg'`, `loading?: boolean`, `disabled?`, `href?`, `children` |
| `Input` | `value = $bindable()`, `type`, `name`, `placeholder?`, `invalid?: boolean`, `autocomplete?` |
| `Textarea` | `value = $bindable()`, `name`, `rows?`, `maxlength?`, `invalid?` |
| `Field` | `label: string`, `hint?`, `error?: string`, `required?: boolean`, `children` |
| `Select` | `value = $bindable()`, `options: {value,label}[]`, `name`, `invalid?` |
| `RadioCards` | `value = $bindable()`, `options: {value,label,description?,icon?}[]`, `name`, `columns?: 2\|3\|4` |
| `Checkbox` | `checked = $bindable()`, `name`, `label` |
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
- примитив не знает о бизнес-сущностях, никаких `lead` внутри `lib/ui`;
- `kitchen-sink` роут рендерит все примитивы во всех состояниях, доступен только при `NODE_ENV !== 'production'`;
- навигация админки и якоря лендинга задаются массивами в `lib/ui/nav-items.ts`, разметка layout не правится под каждый новый раздел.

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
- `/login` и `/admin/...` отдают `noindex, nofollow` и не попадают в sitemap.

**Вход данных.**
- валидация valibot на каждой границе, включая query-параметры и параметры роутов;
- только Drizzle query builder, конкатенация SQL запрещена;
- `{@html}` без санитайза запрещён. Пользовательский текст заявки в админке выводится как текст, не как разметка.

**Ответы и заголовки.**
- CSP без `unsafe-inline` для скриптов (SvelteKit проставляет nonce/hash), `frame-ancestors 'none'`;
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` минимальный;
- CSRF: встроенная проверка Origin у SvelteKit включена, не отключать;
- 404 и 500 отдают нейтральный текст. Стек, путь к файлу и текст исключения клиенту не показываются, только `requestId`.

**Данные и приватность.**
- IP хранится только как sha256 с серверной солью;
- в логи не попадают тело заявки, email, Telegram-контакт и токены сессий;
- `/thanks` показывает только публичный номер заявки, контакты и текст цели на ней не выводятся, страница отдаёт `noindex`;
- секреты только через `$env/static/private`, `.env` в `.gitignore`, `.env.example` без значений;
- файл БД лежит вне корня статики и не раздаётся веб-сервером. Права `0600` на файл БД, владелец — пользователь сервиса. Caddy на путь к нему не смотрит;
- `*.db`, `*.db-wal`, `*.db-shm` в `.gitignore`. Боевой файл БД в репозиторий не попадает никогда.

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
// routes/(public)/_lead/lead.remote.ts
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
- `command()` для действий админки, где JS гарантированно есть (смена статуса, заметка);
- после мутации вызывать `refresh()` нужного query внутри обработчика — данные приедут в том же ответе, без второго round-trip и без `invalidateAll()`;
- авторизацию проверять внутри каждой remote-функции. `getRequestEvent()` внутри неё не годится для авторизации доступа к странице;
- версии `@sveltejs/kit` и `svelte` пиньтся точно: API за экспериментальным флагом, минорка может сломать сборку.

### 3. Правильный режим рендера на каждый роут

Лендинг — трафик и SEO, админка — интерактив. Режимы задаются явно, по умолчанию не оставляются.

```ts
// routes/(public)/+layout.ts
export const prerender = true;    // landing content is static, built to HTML
// routes/(public)/thanks/+page.ts
export const prerender = false;   // lead number arrives in the query string
// routes/(admin)/+layout.ts
export const ssr = true; export const prerender = false;
```

- лендинг не читает БД: тексты и кейсы статические, страница пререндерится целиком, форма остаётся рабочей за счёт `form()`. Если e2e без JS на пререндере падает, лендинг переходит на SSR с `cache-control: public, max-age=60, stale-while-revalidate=600`, решение фиксируется в PR;
- в `load` возвращается только то, что рисуется;
- медленный побочный кусок (например, счётчики в админке) отдаётся стримингом: возврат промиса из `load` и `{#await}` в разметке;
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
- `<svelte:boundary>` вокруг рискованных участков (встраиваемые виджеты), чтобы падение одного блока не сносило страницу;
- изображения кейсов отдаются `<picture>` с avif/webp из `static/cases/` и `loading="lazy"` ниже первого экрана, размеры проставлены всегда — иначе layout shift съедает Lighthouse.

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
- строковый литерал, встречающийся дважды (топик, ключ шаблона, роут, якорь, имя бренда), выносится в константу;
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
- `scope` — область: `landing`, `lead`, `admin`, `ui`, `db`, `queue`, `ci`, `deploy`;
- `summary` в императиве, со строчной буквы, без точки, до 50 символов, по делу;
- тело только чтобы объяснить *почему*, не *что*. Перечисление изменённых файлов не пишется.

Примеры:

```
feat(lead): embed the brief form into the landing
fix(queue): make outbox dispatch idempotent on retry
test(admin): cover lead status transitions
refactor(ui): extract field wrapper from form inputs
chore(deploy): pin node version in dockerfile
```

**Ритм коммитов.** Сессия коммитит сама по ходу работы, маленькими логическими шагами после каждого осмысленного куска, не сваливает слайс одним коммитом в конце. Каждый коммит по возможности проходит `svelte-check`.

**Ветки и PR.** Ветка `feat/landing-brief`, `fix/outbox-retry`. PR даже при работе в одиночку: он гоняет CI-гейт и хранит историю решений. Заголовок содержит ID задачи, тело короткое: что делает слайс, какие контракты затронуты, чем покрыто тестами.

**Проза.** Дисциплина `stop-slop` действует на комментарии, PR и документацию: активный залог, императив, конкретика, без em-dash, без филлеров и вводных оборотов.

---

## 14. Тесты

Тест выводится из критериев приёмки задачи, а не из реализации. Ловушка: сначала пишется код, потом тесты, подтверждающие, что код делает то, что делает, вместе с багами. Тест кодирует контракт.

Тесты привязаны к слайсу и PR. Отдельной сущности «тесты на стадию» нет. Слайс мёрджится только с тестами, гейт красный без них.

**Обязательные типы на каждый слайс:**

1. **Контрактные на стыках.** Джоб или событие слайса соответствует payload-схеме из раздела 6. Фейковый клиент — это и есть тестовый шов: валидирует вход и падает, если слайс шлёт мусор. Пример: `LeadService.submit` публикует `lead.submitted` ровно с `{ leadId }` и `uniqueKey`, равным `'lead.submitted:' + leadId`.
2. **Идемпотентность джобов.** На каждый хендлер тест, который гоняет его дважды с тем же payload и проверяет, что эффект ровно один: одна запись в outbox, один переход статуса, одно сообщение в Telegram.
3. **Путь ошибки.** Фейк возвращает 500 и таймаут: проверяется ретрай, запись `lastError`, отсутствие частичного состояния в БД.
4. **Property-based (fast-check)** на чистой логике: скоринг спама, генерация публичного номера заявки, парсинг UTM. Генерятся входы, проверяются инварианты (номер уникален и читаем, скоринг в диапазоне 0..100).
5. **E2E (Playwright)** на денежный путь: открыть лендинг, заполнить форму в секции `#brief`, увидеть страницу «спасибо» с номером, найти заявку в админке. Прогоняется на каждый PR, в том числе с выключенным JS.

Тестовая БД: свежий SQLite-файл во временном каталоге на каждый прогон, миграции применяются перед тестами. Интеграционные тесты получают свой файл на тест-кейс и удаляют его после, состояние между тестами не течёт. `:memory:` годится только там, где не проверяется поведение файла и WAL. Юнит-тесты сервисов работают на фейковых репозиториях, без БД вообще.

Отдельный обязательный тест на каждый джоб-хендлер: прогон дважды подряд и прогон после «зависания» в `active`. Раннер возвращает подвисшие джобы в работу, поэтому повторное исполнение — штатный сценарий, а не край.

---

## 15. Инфраструктура

**Миграции.** Генерируются `drizzle-kit generate` с `dialect: 'sqlite'` из `schema.ts`, руками не пишутся. Применяются автоматически при старте приложения (`migrate()` до подъёма сервера), отдельного шага деплоя не нужно. В PR-гейте прогоняются на чистом файле. Правка уже применённой миграции запрещена, только новая.

Ограничение SQLite: `ALTER TABLE` умеет мало, поэтому drizzle-kit на многие изменения генерит пересоздание таблицы с копированием данных. Перед мёржем миграции проверяй сгенерированный SQL глазами и прогоняй её на копии боевого файла, а не только на пустом.

**Сид.** `scripts/seed.ts` создаёт админа и 8 заявок: во всех статусах, всех типах, с email и с Telegram, пару с заметками, одну со `status = 'spam'`. Фейковые клиенты работают на тех же фикстурах: разработка и тесты идут на одних данных.

**Конфиг.** `lib/server/config.ts` читает `$env/static/private` один раз, валидирует valibot-схемой, падает на старте при неполном наборе. Обращений к `process.env` в коде нет.

`.env.example`:

```
DATABASE_FILE=./var/data/app.db
PUBLIC_SITE_URL=http://localhost:5173
SESSION_SECRET=
IP_HASH_SALT=
TELEGRAM_BOT_TOKEN=
TELEGRAM_OWNER_CHAT_ID=
USE_FAKE_CLIENTS=true
```

**Long-lead.** Два пункта. Первый — имя бренда: от него зависят домен, Telegram-канал агентства, почта и OG-превью. Второй — домен, DNS и сертификат. Токен Telegram-бота получается за пять минут у BotFather, но всё равно берётся в день один, чтобы `Notifier` проверялся на живом канале. До готовности домена `USE_FAKE_CLIENTS=true`, весь код пишется против фейков.

**CI (гейт на PR).** `pnpm lint`, `svelte-check`, `vitest run`, миграции на чистом файле БД, `playwright test`, `vite build`. Сервисов поднимать не нужно, гейт бежит на одном раннере без docker. Деплоя нет.

**CD (мёрдж в main).** Сборка, выкладка на VPS, рестарт одного процесса `node build/index.js` под systemd-юнитом `agency-site`. Миграции применяются самим приложением на старте. Caddy терминирует TLS, проксирует, отдаёт заголовки безопасности. Откат — предыдущая сборка.

Файл БД живёт вне каталога сборки (`/var/lib/agency-site/`), выкладка его не трогает. Перед рестартом деплой снимает бэкап: откат кода без отката данных должен оставаться безопасным.

**Бэкапы.** `VACUUM INTO '/backups/app-<date>.db'` ежедневно по таймеру systemd. Команда работает на живой БД и даёт консистентную копию, поэтому останавливать сервис не нужно. Копирование файла `cp` на работающей базе запрещено: WAL остаётся снаружи и копия бьётся.

Хранение 14 дней. Раз в месяц восстановление проверяется на локальной машине: подмена файла, старт, открытие админки.

---

## 16. CONTRACT GAP

Не хватает типа, поля, топика, таблицы или пропса примитива — **СТОП**. Код с выдуманным контрактом не пишется, схема БД по ходу задачи не расширяется.

Сессия выдаёт блок и останавливается:

```
CONTRACT GAP
Нужно: поле leads.sourceSection (text)
Зачем: слайс A2 пишет секцию лендинга, из которой ушла заявка, для отчёта по конверсии
Предлагаемая форма: sourceSection: text('source_section')
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
- [ ] экран прошёл проверку из раздела «Дизайн интерфейса» `CLAUDE.md` на 360px и на десктопе;
- [ ] чек-лист безопасности раздела 10 применён к затронутым местам;
- [ ] коммиты по конвенции раздела 13, автор Sobol17, следов ассистента нет;
- [ ] PR смёржен, автодеплой на тестовый VPS прошёл, фича проверена руками на нём.

---

## 18. Дорожная карта

### Стадия 0 — каркас (закрыта)

Каркас собран под ядра v1–v3 и лежит в `main`: конфиг, схема и миграции, примитивы и `kitchen-sink`, layout и авторизация, очередь с раннером и планировщиком, `Notifier` с фейком, `hooks.server.ts`, эталонная вертикаль формы заявки, CI-гейт. Конфигурации деплоя в репозитории нет, поэтому деплой на VPS, Caddy, systemd и таймер бэкапа входят в слайс A5.

### Стадия 1 — портфолио (закрыта, концепция заменена)

Под концепцию личного портфолио сделаны S1 (CRUD кейсов), S2 (медиа), S3 (публичные кейсы), S4 (лендинг), S5 (полная форма заявки). S6–S8 отменены вместе с концепцией. Код S1–S3 сносится слайсом A1, S4 и S5 переделываются слайсами A2 и A3.

### Стадия 2 — сайт агентства

Один слайс = одна задача = один PR. Слайсы идут по порядку.

**A1. Снос портфолио и переименование**
Удаляются: роуты `cases`, `admin/projects`, `admin/media`, `media/[...key]`; `project` и `media` сервисы и репозитории, `Storage`, `ImageProcessor`, хендлер `media.process`, топики `media.process` и `media.gc`; типы и схемы `project`, `proposal`, `media`; утилиты `slug`, `markdown`, `media`, `image-type`, `project`; примитив `FileDrop`; компоненты `project-card`, `media-picture`; их тесты и хелперы; зависимости `sharp`, `blurhash`; env `UPLOADS_DIR` из конфига, `.env.example`, CI. `schema.ts` приводится к разделу 5, миграция генерится `drizzle-kit`. Блок кейсов на лендинге перестаёт читать БД и берёт массив из `landing-content.ts`, чтобы сборка оставалась зелёной до A2.
Переименование: `package.json` → `agency-site`, имя бренда в коде только через `SITE.name` из `lib/site.ts`, литерала бренда в разметке нет.
Контракты: раздел 5 целиком, `TOPICS`, `lib/site.ts`.
Приёмка: `/cases` и `/admin/projects` отвечают 404. Навигация админки содержит только заявки. Миграция удаляет таблицы портфолио и не трогает `leads`, `lead_notes`, `outbox_messages`, `jobs`, `users`, `sessions`: проверено на копии файла с данными. Сид работает на новой схеме. Поиск по репо не находит `projects`, `media`, `proposal` вне миграций и changelog.
Тесты: миграция на чистом файле и на копии с данными (заявки и заметки пережили), контрактный на `TOPICS` (только два топика, у каждого есть хендлер), существующие тесты заявки зелёные без правок.

**A2. Лендинг агентства с формой**
Роуты: `(public)/+page.svelte`, `(public)/_lead/`, пререндер.
Контракты: `LeadInput`, `leadInputSchema`, `SITE`.
Компоненты: `Section`, `Card`, `Button`, `RadioCards`, `Badge`, `Stepper`, `Field`, `Input`, `Textarea`, `Toast`.
Приёмка:
- композиция по дизайн-ревью: предложение и реальный интерфейс → работы → услуги (веб-приложения и Telegram Mini Apps главными) → процесс → FAQ → форма заявки. На мобиле предложение, кнопка и превью работы идут раньше длинных списков;
- голос агентства во всей цепочке: главная, FAQ, форма, метаданные. Утверждения о сроках, ценах, опыте и результатах клиентов — только подтверждённые человеком;
- кейсы статические: данные в `landing-content.ts`, обложки в `static/cases/` в avif/webp с размерами. Каждый кейс показывает задачу, сделанный сценарий, роль агентства и итог;
- форма заявки встроена секцией `#brief`, отдельной страницы `/lead` нет. Все CTA ведут на якорь, выбор типа на лендинге предзаполняет форму. Шаги, валидация полем, работа без JS, антиспам и UTM из query сохраняются из S5;
- успешная отправка ведёт на `/thanks`, ошибка показывается рядом с полем без потери введённого;
- лендинг не читает БД и пререндерится, OG-теги и JSON-LD `Organization` берут имя из `SITE`, sitemap содержит только `/`. Адаптив от 360px, контраст по WCAG AA, Lighthouse на мобиле: performance и SEO не ниже 90.
Тесты: e2e на денежный путь с JS и без JS, e2e на якоря и предзаполнение типа, контрактный на публикацию `lead.submitted` из формы на лендинге, юнит на контентный модуль (каждый кейс с обложкой и размерами), проверка sitemap.

**A3. Страница «спасибо» и кастомная 404**
Роуты: `(public)/thanks`, `+error.svelte`.
Компоненты: `Button`, `Card`, `EmptyState`.
Приёмка:
- `/thanks` в стиле лендинга: подтверждение, что заявка отправлена, номер заявки, обещанный срок ответа, что будет дальше, прямой контакт из `SITE`. Кнопка возврата на главную. `noindex`;
- `/thanks` без номера или с мусором в query не падает и показывает общий текст без номера;
- 404 в стиле сайта: понятный заголовок, выход на главную и к форме `#brief`, шапка и подвал сайта на месте. Статус ответа 404;
- 500 показывает нейтральный текст и `requestId`, без деталей исключения;
- обе страницы проходят проверку дизайна на 360px и на десктопе.
Тесты: e2e на `/thanks` с номером и без, e2e на несуществующий URL (статус 404, ссылка на главную работает), юнит на разбор номера из query.

**A4. Админка: заявки**
Роуты: `admin` (редирект на `admin/leads`), `admin/leads`, `admin/leads/[id]`.
Контракты: `leads`, `lead_notes`, `LeadListItem`, `LeadStatus`.
Компоненты: `Table`, `Badge`, `Tabs`, `Pagination`, `Dialog`, `Textarea`, `Select`, `EmptyState`, `Skeleton`.
Приёмка: список с фильтром по статусу и типу, поиск по имени и тексту цели, пагинация, новые сверху. Карточка заявки показывает всё, включая UTM, источник и `spamScore`. Смена статуса через `command()` с обновлением списка в том же ответе. Заметки добавляются и не редактируются. Спам отделён в свою вкладку и возвращается из спама одним действием.
Тесты: контрактный на переходы статусов (недопустимый переход отклоняется), юнит на фильтры репозитория, авторизация каждой remote-функции (без сессии 401), e2e на путь «заявка пришла → сменил статус → фильтр показывает верно».

**A5. Уведомления в Telegram и продакшен**
Домен: `notifier.telegram.ts`, `outbox.dispatch` на боевом клиенте.
Приёмка:
- новая заявка приходит владельцу одним сообщением в Telegram: тип, бюджет, срок, имя, контакт, первые 200 символов цели, ссылка на карточку в админке;
- дубли исключены `dedupeKey`, повторный прогон джоба второго сообщения не шлёт;
- заявка со `status = 'spam'` уведомление не шлёт;
- недоступность Telegram API не теряет сообщение: строка остаётся `pending`, ретраится, после исчерпания попыток пишет `lastError` и видна в карточке заявки;
- фейк заменён на боевого бота, `USE_FAKE_CLIENTS=false` на проде, `TELEGRAM_OWNER_CHAT_ID` проверен живым сообщением;
- деплой на VPS под доменом бренда, Caddy, systemd-юнит `agency-site`, каталог данных `/var/lib/agency-site/`, таймер бэкапа;
- заголовки безопасности и CSP проверены на боевом домене, логи структурные и без PII, восстановление из бэкапа проверено, `/healthz` отвечает.
Тесты: контрактный на формат сообщения (фейк валидирует payload и падает на мусоре), идемпотентность `outbox.dispatch` при повторе, путь ошибки на 500 и таймаут Telegram API, e2e smoke на прод-домене после деплоя: форма → «спасибо» → сообщение в Telegram.

---

Конец ядра v4. Изменения — только append-only, с бампом версии и строкой в changelog.
