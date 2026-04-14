// audit from antigravity
# Kataloga Frontend — Полный Технический и UX Аудит

> Аудит проведён по кодовой базе `apps/frontend`. Стек: Nuxt 3, Vue 3 Composition API, Pinia, TailwindCSS, Telegram WebApp SDK.

---

## 1. ИЗБЫТОЧНОСТЬ И МЁРТВЫЙ КОД

### СТАТУС: КРИТИЧНО

Кодовая база радикально переинженерена для MVP: **51 composable**, **20 utils**, **19 плагинов**, **13 stores** — это уровень enterprise-приложения с 50+ разработчиками, а не MVP.

---

#### Неиспользуемые composables (можно удалить прямо сейчас)

| Composable | Размер | Используется только в собственном файле |
|---|---|---|
| [useVirtualScroll.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useVirtualScroll.ts) | 4 KB | ✅ Нигде не импортируется |
| [useCodeSplitting.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useCodeSplitting.ts) | 3.6 KB | ✅ Нет импортов нигде |
| [useGracefulDegradation.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useGracefulDegradation.ts) | 8.7 KB | ✅ Нигде не импортируется |
| [useErrorRecovery.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useErrorRecovery.ts) | 2.7 KB | ✅ Нигде не импортируется |
| [useTouchInteractions.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useTouchInteractions.ts) | 8 KB | ✅ Нигде не импортируется |
| [useDebouncedSearch.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useDebouncedSearch.ts) | 3 KB | ✅ Нигде не импортируется |
| [useLoadingState.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useLoadingState.ts) | 4.2 KB | ✅ Нигде не импортируется |
| [useGlobalErrorHandler.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useGlobalErrorHandler.ts) | 7.6 KB | Только в `examples/error-handler-usage.ts` |
| [usePerformance.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/usePerformance.ts) | 3.9 KB | Дублирует `usePerformanceMonitoring` |
| [useColorMode.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/composables/useColorMode.ts) | 1.6 KB | Только `ThemeSwitcher.vue` (не нужен для MVP) |

#### Неиспользуемые utils

| Util | Размер | Статус |
|---|---|---|
| [bundle-analyzer.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/utils/bundle-analyzer.ts) | 3.4 KB | Нигде не импортируется |
| [design-token-validation.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/utils/design-token-validation.ts) | 9.9 KB | Нигде не импортируется |
| [css-tree-shaking.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/utils/css-tree-shaking.ts) | 8 KB | Только в собственном файле |
| [accessibility-testing.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/utils/accessibility-testing.ts) | 19.9 KB | Только в `accessibility-dev.client.ts` ← dev-only |
| [color-contrast.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/utils/color-contrast.ts) | 4.2 KB | Dev-only util |

#### Мёртвые страницы и компоненты

| Файл | Причина |
|---|---|
| [components/examples/*](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/components/examples) (3 файла) | Demo/example компоненты, не используются в приложении |
| [examples/error-handler-usage.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/examples/error-handler-usage.ts) | Пример использования, не является частью приложения |
| [pages/map/test-picker.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/map/test-picker.vue) | Тестовая страница, доступна в production |
| [pages/promotions.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/promotions.vue) | 19 KB — полноценная страница промоакций, не нужна для MVP |
| [pages/favourites.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/favourites.vue) | Избранное — не нужно для MVP (каталог+корзина+заказ достаточно) |
| [pages/notifications.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/notifications.vue) | Страница уведомлений — излишество для MVP |

#### Фичи, не нужные для MVP

| Фича | Файлы | Почему не нужна |
|---|---|---|
| PWA + Offline sync | `useOfflineCart.ts` (19KB), `useOfflineCheckout.ts`, `usePWA.ts`, `stores/offline.ts`, `plugins/pwa.client.ts`, `plugins/offline.client.ts`, `components/pwa/*` | Telegram Mini App не нуждается в PWA. Offline-синхронизация корзины — overengineering |
| Push Notifications | `usePushNotifications.ts`, `usePlatformNotifications.ts`, `useTelegramNotifications.ts`, `services/notification.service.ts` | В Telegram уведомления идут через бот, а не через Push API |
| Geolocation + Maps | `useGeolocation.ts`, `useMap.ts`, `stores/location.ts`, `services/map.service.ts`, `plugins/maps.client.ts`, `pages/map/*`, `pages/delivery/*` | Доставка на карте — не MVP, достаточно текстового адреса |
| Accessibility (dev) | `useAccessibility.ts` (18KB), `plugins/accessibility-dev.client.ts` (10.8KB), `utils/accessibility-testing.ts` | Dev-only тулинг, утяжеляет бандл |
| Sentry + Analytics | `plugins/sentry.client.ts`, `pages/admin/analytics/*` | Можно добавить позже |
| WebSocket | `services/websocket.service.ts`, `plugins/websocket.client.ts` | Для MVP достаточно polling |

> **РЕШЕНИЕ**: Удалить ~100 KB мёртвого кода. Это уменьшит бандл, ускорит сборку, и снизит когнитивную нагрузку.

---

## 2. UX — ФЛОУ ВЛАДЕЛЬЦА МАГАЗИНА (веб-админка)

### СТАТУС: ВАЖНО

#### Путь: Регистрация → Магазин → Первый товар → Бот

| Шаг | Проблема | Решение |
|---|---|---|
| Регистрация | Форма разделяет `firstName`/`lastName`, а API объединяет в `name` ([auth.ts:176](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/auth.ts#L176)). Лишнее поле | Одно поле "Имя" |
| После регистрации | Нет onboarding-флоу. Пользователь попадает... куда? Нет redirect на создание магазина | Wizard: регистрация → создание магазина → добавление товара → ссылка на бот |
| Добавление товара | Форма создания товара ([admin/menu/create.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/admin/menu/create.vue)) — 14 KB, сложная, без подсказок | Упростить до: название, цена, фото, категория. Остальное — доп. настройки |
| Получение ссылки на бот | Нет видимого места где владелец получает ссылку на бот для своих клиентов | Добавить в дашборд крупную секцию "Ваша ссылка: t.me/..." с кнопкой копирования |

#### Путь: Просмотр заказа → Смена статуса → Уведомление клиента

| Шаг | Проблема | Решение |
|---|---|---|
| Список заказов | Страница заказов ([admin/orders/index.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/admin/orders/index.vue)) — 27 KB(!), перегружена фичами | Упростить: таблица с бейджами статуса, клик → детали |
| Смена статуса | Нет реального времени. Владелец не узнает о новом заказе без ручного обновления | Добавить звуковое уведомление + polling каждые 15 сек для новых заказов |
| Уведомление клиента | В `order.ts` store — `customerInfo` захардкожен как `name: 'Customer', phone: ''` ([order.ts:85-88](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/order.ts#L85-L88)) | Получать customerInfo из API ответа, не хардкодить |

---

## 3. UX — ФЛОУ КЛИЕНТА МАГАЗИНА (Telegram Mini App)

### СТАТУС: ВАЖНО

#### Путь: Mini App → Каталог → Корзина → Заказ → Подтверждение

| Шаг | Проблема | Решение |
|---|---|---|
| Открытие Mini App | Запускается tenant-resolver с API-запросом + monitoring + URL watcher. Слишком долго для первого render | Убрать monitoring, упростить resolver. Tenant slug передавать через start_param бота |
| Каталог | `console.log(items)` в геттере `filteredMenuItems` ([menu.ts:48](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L48)) — вызывается при КАЖДОМ ре-рендере | Удалить `console.log` |
| Корзина | Работает оффлайн через IndexedDB + localStorage + серверную синхронизацию. Три слоя хранения для MVP | Оставить только localStorage + серверную синхронизацию для авторизованных |
| Оформление заказа | `paymentMethod` захардкожен как `'CASH'` ([cart.ts:345](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L345)) | Разрешить выбор метода оплаты |
| Подтверждение | После успешного заказа корзина очищается ([cart.ts:361](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L361)) ✅ Это правильно | — |

#### Оффлайн-синхронизация корзины

Текущая реализация:
- `useOfflineCart.ts` (19 KB!) с IndexedDB
- `stores/offline.ts` — отдельный store
- `useNetworkStatus.ts` (8 KB) — мониторинг сети
- `plugins/offline.client.ts`, `plugins/network-status.client.ts`

> **Для MVP**: Оффлайн-синхронизация **НЕ НУЖНА**. Telegram Mini App всегда требует интернет. Достаточно localStorage.

#### Telegram Mini Apps guidelines

| Проверка | Статус |
|---|---|
| Используется Telegram WebApp SDK | ✅ `@telegram-apps/sdk` |
| Haptic feedback | ✅ `useTelegramHaptic.ts` |
| Theme adaptation | ✅ `plugins/theme.client.ts`, `useTheme.ts` |
| MainButton для чекаута | ❓ Не проверено (нужно проверить `useTelegram.ts`) |
| BackButton | ❓ Не проверено |
| Viewport rules | ✅ `meta viewport` в `app.vue` |

---

## 4. ПРОИЗВОДИТЕЛЬНОСТЬ

### СТАТУС: КРИТИЧНО

#### Лишние ре-рендеры

| Проблема | Файл | Решение |
|---|---|---|
| `console.log(items)` в геттере `filteredMenuItems` | [menu.ts:48](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L48) | **Удалить немедленно**. Вызывается при каждом доступе к filtered items |
| `filteredItems` геттер — просто алиас для `filteredMenuItems` | [menu.ts:114-116](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L114-L116) | Удалить дублирующий геттер |
| `subtotal` вычисляется в 4 разных геттерах (`subtotal`, `total`, `canCheckout`, `remainingForMinimum`) | [cart.ts:55-80](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L55-L80) | Перенести subtotal в computed и использовать из одного места |

#### Лишние API-запросы

| Проблема | Файл | Решение |
|---|---|---|
| `performance-optimization.client.ts` — preload `example.com` images + preconnect к `api.example.com`, `cdn.example.com`, `analytics.example.com` | [performance-optimization.client.ts:103-222](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/plugins/performance-optimization.client.ts#L103-L222) | **Удалить весь плагин** или заменить URL-заглушки на реальные |
| 30-секундный performance polling interval | [performance-optimization.client.ts:120-151](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/plugins/performance-optimization.client.ts#L120-L151) | Удалить. Логирование memory/cache каждые 30 сек бессмысленно в production |
| `fetchMenu` сначала грузит из cache, потом из API — **всегда два вызова** | [menu.ts:120-211](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L120-L211) | Показать cache → фоновый refresh. Не блокировать рендер |

#### SSR/CSR

| Часть | Текущая настройка | Правильно? |
|---|---|---|
| `/admin/**` | `ssr: false` ✅ | Да |
| `/auth/**` | `ssr: false` ✅ | Да |
| `/menu`, `/menu/**`, `/dish/**` | `ssr: true` | ⚠️ Для Mini App SSR не даёт преимущества — Telegram WebView не кеширует SSR. Для веб-витрины — правильно |
| `/` (homepage) | `ssr: true` | Редирект на `/menu` через middleware ⚠️ SSR бессмысленен |

#### Lazy loading изображений

- `@nuxt/image` настроен с `loading: 'lazy'` ✅
- `useLazyImage.ts`, `useLazyLoading.ts`, `LazyImage.vue`, `OptimizedImage.vue` — **четыре** реализации lazy loading 🚨
- **Решение**: Использовать только `<NuxtImg>` с встроенным lazy loading

---

## 5. СОСТОЯНИЕ И PINIA

### СТАТУС: ВАЖНО

#### Stores с данными, которые лучше держать локально

| Store | Проблема | Решение |
|---|---|---|
| [loading.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/loading.ts) (5.4 KB) | Глобальный loading state — каждый store уже имеет свой `loading` | Удалить, использовать `loading` из конкретного store |
| [error.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/error.ts) (7.2 KB) | Глобальный error store — каждый store уже имеет свой `error` | Удалить, использовать `error` из конкретного store |
| [offline.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/offline.ts) (1.8 KB) | Дублирует `useNetworkStatus` composable | Выбрать одно из двух |
| [notification.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/notification.ts) (5.3 KB) | Для MVP toast-уведомления лучше через inject/provide | Упростить |

#### Утечки состояния между магазинами (мультитенантность)

| Проблема | Файл | Решение |
|---|---|---|
| `clearTenantData()` чистит stores по одному через dynamic import — хрупко, может "забыть" store | [tenant.ts:549-651](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/tenant.ts#L549-L651) | Использовать `store.$reset()` для всех stores через единый registry |
| `favorites` используют `useTenantStorage` (с prefix tenant) ✅ | [favorites.ts:40-42](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/favorites.ts#L40-L42) | Правильная реализация |
| `cart` использует `useTenantStorage` ✅ | [cart.ts:87-94](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L87-L94) | Правильная реализация |
| `syncFavoritesToServer` отправляет **каждый** избранный item отдельным запросом — N запросов | [favorites.ts:191-193](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/favorites.ts#L191-L193) | Batch endpoint: один запрос со всеми ID |

#### Сброс корзины после заказа

- ✅ `clearCart()` вызывается после успешного `createOrder` ([cart.ts:361](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L361))
- ✅ Корзина НЕ очищается при ошибке ([cart.ts:396](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L396))
- Поведение **корректное**

---

## 6. КРИТИЧЕСКИЕ ПРОБЛЕМЫ ДЛЯ MVP

### СТАТУС: КРИТИЧНО

#### Что сломается у первого реального клиента

| # | Проблема | Серьёзность | Файл |
|---|---|---|---|
| 1 | `console.log(items)` в геттере — в production console будет заспамлен массивом товаров | 🔴 Критично | [menu.ts:48](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L48) |
| 2 | `customerInfo` захардкожен как `'Customer'` — во всех заказах имя будет "Customer" | 🔴 Критично | [order.ts:85-88](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/order.ts#L85-L88) |
| 3 | Preconnect к `api.example.com` — лишние DNS-запросы к несуществующему домену | 🔴 Критично | [performance-optimization.client.ts:197](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/plugins/performance-optimization.client.ts#L197) |
| 4 | `paymentMethod: 'CASH'` захардкожен — нельзя выбрать другой способ оплаты | 🟡 Важно | [cart.ts:345](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L345) |
| 5 | Страница `map/test-picker.vue` доступна в production | 🟡 Важно | [map/test-picker.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/map/test-picker.vue) |

#### Медленный мобильный интернет

- Performance optimization плагин запускает **preload изображений** + **30-сек polling** + **web vitals monitoring** при старте — увеличивает время загрузки
- 51 composable авто-импортируются Nuxt (если не tree-shaken) — большой бандл
- Десятки `console.log` в stores и plugins (не удаляются terser'ом если не `console.log` а `console.warn`/`console.error`)

#### Незащищённые роуты

| Роут | Middleware | Проблема |
|---|---|---|
| `/admin/**` | `admin.ts` middleware | ✅ Но нужно проверить что middleware действительно проверяет роль |
| `/map/test-picker` | Нет | 🔴 Тестовая страница без защиты |
| `/promotions` | Нет | ⚠️ Доступна всем |
| `/notifications` | Нет | ⚠️ Может показать чужие уведомления? |
| `/orders/**` | `ssr: false` но middleware не указан | ⚠️ Нужен `auth` middleware |

#### Поведение при ошибке сети

- `useNetworkStatus.ts` (8 KB) — детектирует оффлайн ✅
- `NetworkStatusIndicator` в `app.vue` — показывает баннер ✅
- `pages/offline.vue` — есть страница ✅
- **Проблема**: При ошибке API нет retry-кнопки на уровне компонентов. Пользователь видит пустой экран или ошибку без возможности повторить

---

## ТОП-5 ПРОБЛЕМ ДО ПЕРВОГО КЛИЕНТА

| # | Проблема | Действие | Файл |
|---|---|---|---|
| **1** | `console.log(items)` в production getter | Удалить строку | [menu.ts:48](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L48) |
| **2** | Preconnect к `example.com` доменам | Удалить или заменить на реальные домены | [performance-optimization.client.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/plugins/performance-optimization.client.ts) |
| **3** | `customerInfo` = `'Customer'` во всех заказах | Получать из API response | [order.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/order.ts) |
| **4** | Тестовая страница `map/test-picker` в production | Удалить файл | [map/test-picker.vue](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/pages/map/test-picker.vue) |
| **5** | ~100 KB мёртвого кода (composables, utils, examples) | Удалить файлы из списка ниже | Множество файлов |

---

## СПИСОК К УДАЛЕНИЮ ПРЯМО СЕЙЧАС

### Composables (10 файлов, ~50 KB)
- `useVirtualScroll.ts`
- `useCodeSplitting.ts`
- `useGracefulDegradation.ts`
- `useErrorRecovery.ts`
- `useTouchInteractions.ts`
- `useDebouncedSearch.ts`
- `useLoadingState.ts`
- `useGlobalErrorHandler.ts`
- `usePerformance.ts` (дублирует `usePerformanceMonitoring`)
- `useColorMode.ts` (не нужен для MVP)

### Utils (4 файла, ~41 KB)
- `bundle-analyzer.ts`
- `design-token-validation.ts`
- `css-tree-shaking.ts`
- `color-contrast.ts`

### Stores (2 файла, ~12 KB)
- `loading.ts` (дублирует per-store loading)
- `error.ts` (дублирует per-store error)

### Компоненты и страницы
- `components/examples/*` (3 файла)
- `examples/error-handler-usage.ts`
- `pages/map/test-picker.vue`
- `pages/promotions.vue` (не нужна для MVP)
- `pages/notifications.vue` (не нужна для MVP)
- `pages/favourites.vue` (не нужна для MVP)

---

## ОДИН ГЛАВНЫЙ UX-МОМЕНТ

> **Onboarding wizard для владельца магазина**

Сейчас после регистрации владелец попадает в пустую админку без подсказок, без пошагового мастера, без ссылки на бот.

**Создать 3-шаговый wizard**:
1. "Назовите свой магазин" → создание tenant
2. "Добавьте первый товар" → упрощённая форма (название, цена, фото)
3. "Ваш магазин готов! Вот ссылка для клиентов: `t.me/KatalogaBot?start=SLUG`" → кнопка "Скопировать"

Это **единственная** вещь, которая превратит "техническое демо" в "продукт, который можно показать первому клиенту".















// audit from kiro
Сначала соберу контекст по фронтенду — это большой проект, нужно понять структуру.

I'll systematically explore the frontend application structure. Let me start by gathering all the directory listings and then read the key files.

Now let me read the key configuration and main files, plus all stores and composables:

Now let me read the key pages and layouts:

Let me now read some key composables and services to complete the picture:

Perfect! Now let me create a comprehensive summary document:

Now let me provide the final response with all the key files:

Теперь углублюсь в конкретные файлы для более точного аудита.

Теперь у меня достаточно данных для полного аудита. Пишу детальный отчёт.

---

# ТЕХНИЧЕСКИЙ И UX АУДИТ — KATALOGA MVP

---

## 1. ИЗБЫТОЧНОСТЬ И МЁРТВЫЙ КОД

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** Дублирование состояния аутентификации — есть два отдельных стора `auth.ts` и `user.ts`, которые оба хранят `user`, `isAuthenticated`, и оба инициализируются в `app.vue`. `userStore.initializeUser()` и `authStore.initializeAuth()` делают одно и то же.
**ФАЙЛ:** `app/stores/auth.ts`, `app/stores/user.ts`, `app/app.vue`
**РЕШЕНИЕ:** Объединить в один стор. `user.ts` — удалить, перенести `detectPlatform()` и `initializeTelegramUser()` в `auth.ts`.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** Дублирование offline-логики — `useOfflineCart.ts` (composable), `stores/offline.ts` и `stores/error.ts` все слушают `window.addEventListener('online'/'offline')` независимо. Три разных источника правды об одном состоянии.
**ФАЙЛ:** `app/composables/useOfflineCart.ts`, `app/stores/offline.ts`, `app/stores/error.ts`
**РЕШЕНИЕ:** Один источник — `stores/offline.ts`. Остальные читают из него через `storeToRefs`.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `useNotification.ts` и `useNotifications.ts` — два composable с похожими именами. Плюс `stores/notification.ts` и `stores/user.ts` оба хранят `notifications[]`. Полная путаница.
**ФАЙЛ:** `app/composables/useNotification.ts`, `app/composables/useNotifications.ts`, `app/stores/notification.ts`, `app/stores/user.ts`
**РЕШЕНИЕ:** Оставить только `stores/notification.ts` + один composable `useNotifications.ts`.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `usePerformance.ts` и `usePerformanceMonitoring.ts` — два composable для одного и того же. Плюс `plugins/performance.client.ts` и `plugins/performance-optimization.client.ts` — два плагина производительности.
**ФАЙЛ:** `app/composables/`, `app/plugins/`
**РЕШЕНИЕ:** Удалить дубликаты, оставить по одному.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `stores/loading.ts` содержит методы `loadMenu()`, `createOrder()`, `syncData()` с захардкоженными `setTimeout` — это mock-код, который никогда не вызывается реально. Стор перегружен несвязанной логикой.
**ФАЙЛ:** `app/stores/loading.ts`
**РЕШЕНИЕ:** Удалить методы `loadMenu`, `createOrder`, `syncData` из стора. Оставить только `startTask/finishTask/withGlobalLoading`.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** Страницы-заглушки с хардкоженными mock-данными, которые не подключены к API:
- `pages/promotions.vue` — полностью на mock-данных, `subscribeNewsletter` делает `alert()`
- `pages/orders/repeat.vue` — mock-данные, `favoriteCombos` захардкожены
- `pages/map/test-picker.vue` — тестовая страница, не должна быть в продакшне
- `pages/admin/analytics/index.vue` — чарты — это placeholder `"Revenue chart would go here"`
- `pages/delivery/index.vue` — `checkDeliveryAvailability` делает `Math.random()`

**ФАЙЛ:** Указаны выше
**РЕШЕНИЕ:** `map/test-picker.vue` — удалить немедленно. Остальные — либо подключить к API, либо скрыть из навигации до готовности.

---

**СТАТУС: РЕКОМЕНДАЦИЯ**
**ПРОБЛЕМА:** `components/examples/` — три компонента-примера (`ApiIntegrationExample.vue`, `PaginationExample.vue`, `WebSocketNotificationExample.vue`) лежат в `app/components/examples/`. Это dev-артефакты.
**ФАЙЛ:** `app/components/examples/`
**РЕШЕНИЕ:** Удалить папку целиком.

---

**СТАТУС: РЕКОМЕНДАЦИЯ**
**ПРОБЛЕМА:** Дублирование image-компонентов: `LazyImage.vue`, `OptimizedImage.vue`, `ResponsiveImage.vue`, `BaseImage.vue` — четыре компонента для показа картинок. При этом есть `@nuxt/image` в зависимостях.
**ФАЙЛ:** `app/components/base/`
**РЕШЕНИЕ:** Использовать `<NuxtImg>` из `@nuxt/image` везде. Удалить кастомные дубликаты.

---

**СТАТУС: РЕКОМЕНДАЦИЯ**
**ПРОБЛЕМА:** `SkipLinks.vue` существует в двух местах: `components/base/SkipLinks.vue` и `components/layout/SkipLinks.vue`.
**ФАЙЛ:** `app/components/base/SkipLinks.vue`, `app/components/layout/SkipLinks.vue`
**РЕШЕНИЕ:** Удалить один из них.

---

## 2. UX — ФЛОУ ВЛАДЕЛЬЦА МАГАЗИНА (веб-админка)

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** Нет страницы настроек магазина и онбординга. В сайдбаре `admin.vue` есть только Dashboard → Menu → Orders → Analytics. Нет: настройки профиля магазина, получения ссылки на Telegram-бот, управления категориями. Новый владелец зарегистрируется и не поймёт, что делать дальше.
**ФАЙЛ:** `app/layouts/admin.vue`, `app/pages/admin/`
**РЕШЕНИЕ:** Добавить страницу `/admin/settings` с: данными магазина, ссылкой на бот, настройками доставки. Добавить welcome-баннер на дашборде для новых пользователей.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** В `admin/orders/index.vue` смена статуса заказа происходит через `<select>` прямо в таблице без подтверждения (кроме отмены). Владелец может случайно переключить статус. При этом нет уведомления клиента после смены статуса — нет никакой обратной связи о том, что клиент оповещён.
**ФАЙЛ:** `app/pages/admin/orders/index.vue`
**РЕШЕНИЕ:** Добавить confirm-диалог для критичных переходов (CANCELLED, DELIVERED). Показывать тост "Клиент уведомлён" после смены статуса.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** Дашборд при ошибке API молча падает в mock-данные (`stats.value = { todayOrders: 24, ... }`). Владелец видит красивые цифры, которые не реальные. Нет индикатора "данные недоступны".
**ФАЙЛ:** `app/pages/admin/index.vue`
**РЕШЕНИЕ:** При ошибке API показывать явный баннер "Не удалось загрузить данные. Показаны тестовые значения." Убрать mock-данные из продакшн-кода.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** Нет real-time обновлений в списке заказов. Владелец должен вручную обновлять страницу, чтобы увидеть новые заказы. Для ресторана это критично.
**ФАЙЛ:** `app/pages/admin/orders/index.vue`
**РЕШЕНИЕ:** Подключить WebSocket (сервис уже есть — `websocket.service.ts`) для автообновления списка заказов. Добавить звуковое уведомление при новом заказе.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** Страница аналитики — это полная заглушка. Чарты — placeholder-блоки с текстом "Revenue chart would go here". Для MVP это приемлемо, но страница доступна в навигации и создаёт ощущение сломанного продукта.
**ФАЙЛ:** `app/pages/admin/analytics/index.vue`
**РЕШЕНИЕ:** Либо убрать Analytics из навигации до готовности, либо показать простую таблицу вместо пустых блоков.

---

**СТАТУС: РЕКОМЕНДАЦИЯ**
**ПРОБЛЕМА:** В `admin.vue` layout кнопка уведомлений (колокольчик) не имеет обработчика — `@click` отсутствует. Это dead UI.
**ФАЙЛ:** `app/layouts/admin.vue`
**РЕШЕНИЕ:** Подключить к `NotificationCenter` или временно скрыть кнопку.

---

## 3. UX — ФЛОУ КЛИЕНТА (Telegram Mini App)

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** `index.vue` (главная страница) — это generic "Welcome to Menu Ordering" с хардкоженным английским текстом. Клиент открывает Mini App и видит безликую страницу без брендинга магазина. Нет названия магазина, нет логотипа, нет персонализации под конкретный тенант.
**ФАЙЛ:** `app/pages/index.vue`
**РЕШЕНИЕ:** Главная страница должна сразу показывать название и брендинг текущего тенанта из `tenantStore.tenantBranding`.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** `useOfflineCart` реализует IndexedDB + localStorage + pending orders + conflict resolution — это overengineering для MVP. Для Telegram Mini App пользователь всегда онлайн (открывает через Telegram). Сложность этого кода создаёт риски багов.
**ФАЙЛ:** `app/composables/useOfflineCart.ts`
**РЕШЕНИЕ:** Для MVP — простой localStorage без IndexedDB и conflict resolution. Offline-sync можно добавить в v2.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** В `checkout.vue` есть `CheckoutFlow` компонент, но нет явной интеграции с Telegram `MainButton`. По гайдлайнам Telegram Mini Apps кнопка "Оформить заказ" должна быть нативной `MainButton` внизу экрана, а не кастомной кнопкой внутри страницы.
**ФАЙЛ:** `app/pages/checkout.vue`, `app/components/checkout/CheckoutFlow.vue`
**РЕШЕНИЕ:** Использовать `window.Telegram.WebApp.MainButton` для финального CTA в чекауте.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `menuStore.filteredMenuItems` содержит `console.log(items)` в геттере — это будет спамить в консоль при каждом рендере каталога.
**ФАЙЛ:** `app/stores/menu.ts`
**РЕШЕНИЕ:** Удалить `console.log(items)` немедленно.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** Страница `/dish/[id]` разбита на 6 отдельных под-страниц (`caloric-content`, `change-ingredients`, `change-quantity`, `ingredients`, `subcategory`, `waiting-time`). Это создаёт 6 отдельных роутов для одного товара. В Telegram Mini App навигация между ними будет ломать BackButton и создавать плохой UX.
**ФАЙЛ:** `app/pages/dish/[id]/`
**РЕШЕНИЕ:** Объединить в один компонент с табами/шагами. Использовать `BackButton` Telegram для возврата к каталогу.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `cart.vue` использует `router.go(-1)` для кнопки "назад" — это ненадёжно в Telegram Mini App, где история навигации может быть пустой.
**ФАЙЛ:** `app/pages/cart.vue`
**РЕШЕНИЕ:** Заменить на `router.push('/menu')` или использовать Telegram `BackButton`.

---

**СТАТУС: РЕКОМЕНДАЦИЯ**
**ПРОБЛЕМА:** `nuxt.config.ts` не настроен для CSR-only режима для Telegram Mini App. SSR включён по умолчанию, но Telegram Mini App не нуждается в SSR — это только замедляет первый рендер и усложняет деплой.
**ФАЙЛ:** `apps/frontend/nuxt.config.ts`
**РЕШЕНИЕ:** Добавить `ssr: false` или настроить route rules: `routeRules: { '/admin/**': { ssr: false }, '/**': { ssr: false } }`.

---

## 4. ПРОИЗВОДИТЕЛЬНОСТЬ

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** `app.vue` инициализирует 6 сторов + 4 composable при каждом старте приложения, включая `useOfflineCart`, `useAnimations`, `useResponsive` — всё это блокирует первый рендер. `initializeOfflineCart` вызывается но результат не используется.
**ФАЙЛ:** `app/app.vue`
**РЕШЕНИЕ:** Лениво инициализировать некритичные сторы. `useAnimations` и `useResponsive` — только при необходимости.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** 19 client-side плагинов загружаются при каждом старте: `performance.client.ts`, `performance-optimization.client.ts`, `keyboard-navigation.client.ts`, `accessibility-dev.client.ts`, `maps.client.ts` — большинство не нужны для Telegram Mini App.
**ФАЙЛ:** `app/plugins/`
**РЕШЕНИЕ:** `accessibility-dev.client.ts` — только в dev-режиме. `maps.client.ts` — lazy import только на страницах с картой. `keyboard-navigation.client.ts` — не нужен в Telegram.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** Загружаются два шрифта (Inter + Poppins) с 5 весами каждый через Google Fonts. Для Telegram Mini App это лишние 200-400ms на медленном интернете.
**ФАЙЛ:** `nuxt.config.ts`
**РЕШЕНИЕ:** Оставить один шрифт (Inter), 3 веса (400, 500, 600). Telegram использует системный шрифт — можно вообще убрать кастомный шрифт для Mini App.

---

**СТАТУС: РЕКОМЕНДАЦИЯ**
**ПРОБЛЕМА:** `menuStore.filteredMenuItems` — геттер пересчитывается при любом изменении стора, включая `loading` и `error`. Фильтрация по calories, dietary, priceRange — это сложные операции на каждый рендер.
**ФАЙЛ:** `app/stores/menu.ts`
**РЕШЕНИЕ:** Вынести фильтрацию в `computed` внутри компонента или использовать `shallowRef` для items.

---

## 5. СОСТОЯНИЕ И PINIA

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** Утечка состояния между тенантами. `cartStore` использует `useTenantStorage` для изоляции, но `favoritesStore`, `menuStore`, `orderStore` — не все используют tenant-aware storage. При переключении тенанта данные могут смешаться.
**ФАЙЛ:** `app/stores/favorites.ts`, `app/stores/menu.ts`
**РЕШЕНИЕ:** Проверить все сторы на использование `useTenantStorage`. Добавить `$reset()` при смене тенанта в `tenant-routing.global.ts`.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** Корзина НЕ сбрасывается после успешного заказа явно в коде `checkout.vue`. `handleOrderComplete` вызывает `handleContinueShopping` или `handleViewOrders`, но нет явного `cartStore.clearCart()` в success-флоу.
**ФАЙЛ:** `app/pages/checkout.vue`
**РЕШЕНИЕ:** После успешного создания заказа вызывать `cartStore.clearCart()` перед редиректом.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `stores/loading.ts` — глобальный стор для loading-состояний, но большинство компонентов используют локальный `const loading = ref(false)`. Стор не используется консистентно.
**ФАЙЛ:** `app/stores/loading.ts`
**РЕШЕНИЕ:** Либо использовать стор везде, либо удалить его и оставить локальные `ref`. Для MVP — удалить стор, использовать локальные состояния.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `stores/delivery.ts` и `stores/location.ts` — хранят данные которые нужны только на конкретных страницах (`/delivery`, `/map`). Эти сторы инициализируются глобально и занимают память даже когда не нужны.
**ФАЙЛ:** `app/stores/delivery.ts`, `app/stores/location.ts`
**РЕШЕНИЕ:** Использовать локальное состояние в компонентах страниц. Для MVP доставка через Telegram не требует отдельного стора.

---

## 6. КРИТИЧЕСКИЕ ПРОБЛЕМЫ ДЛЯ MVP

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** Незащищённые роуты — `middleware/admin.ts` существует, но страницы `/promotions`, `/delivery`, `/map`, `/notifications`, `/favourites` не имеют middleware. Любой пользователь может открыть их напрямую и увидеть mock-данные или сломанный UI.
**ФАЙЛ:** `app/pages/promotions.vue`, `app/pages/delivery/index.vue`, `app/pages/map/index.vue`
**РЕШЕНИЕ:** Добавить `definePageMeta({ middleware: 'auth' })` на все страницы требующие авторизации.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** `admin/index.vue` и `admin/orders/index.vue` при ошибке API молча подставляют mock-данные с реальными именами (`John Doe`, `Jane Smith`). Это попадёт в продакшн и введёт владельца в заблуждение.
**ФАЙЛ:** `app/pages/admin/index.vue`, `app/pages/admin/orders/index.vue`
**РЕШЕНИЕ:** Убрать все mock-данные из продакшн-кода. Показывать empty state при ошибке.

---

**СТАТУС: КРИТИЧНО**
**ПРОБЛЕМА:** `map/test-picker.vue` — тестовая страница доступна в продакшне по URL `/map/test-picker`. Это dev-артефакт.
**ФАЙЛ:** `app/pages/map/test-picker.vue`
**РЕШЕНИЕ:** Удалить файл.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** При ошибке сети в чекауте показывается overlay "Creating your order..." без таймаута. Если запрос завис — пользователь заблокирован на этом экране навсегда.
**ФАЙЛ:** `app/pages/checkout.vue`
**РЕШЕНИЕ:** Добавить таймаут 30 секунд с возможностью отмены и retry.

---

**СТАТУС: ВАЖНО**
**ПРОБЛЕМА:** `promotions.vue` использует `alert()` для подтверждения подписки на newsletter. `alert()` в Telegram Mini App блокирует весь интерфейс и выглядит как системная ошибка.
**ФАЙЛ:** `app/pages/promotions.vue`
**РЕШЕНИЕ:** Заменить на toast-уведомление. Вообще убрать newsletter из MVP.

---

## ТОП-5 ПРОБЛЕМ ДО ПЕРВОГО КЛИЕНТА

1. **Mock-данные в продакшне** — `admin/index.vue` и `admin/orders/index.vue` показывают "John Doe" при ошибке API. Первый реальный клиент увидит чужие данные.

2. **Корзина не сбрасывается после заказа** — клиент оформит заказ, вернётся в каталог, и увидит старые товары в корзине. Оформит повторно.

3. **Главная страница без брендинга тенанта** — "Welcome to Menu Ordering" вместо названия магазина. Клиент не поймёт, чей это магазин.

4. **`console.log(items)` в геттере menuStore** — спамит в консоль при каждом рендере каталога, замедляет производительность.

5. **`map/test-picker.vue` в продакшне** — тестовая страница доступна по прямому URL.

---

## СПИСОК ДЛЯ УДАЛЕНИЯ ПРЯМО СЕЙЧАС

**Страницы:**
- `app/pages/map/test-picker.vue`

**Компоненты:**
- `app/components/examples/` (вся папка — 3 файла)
- `app/components/layout/SkipLinks.vue` (дубликат `base/SkipLinks.vue`)
- `app/components/base/OptimizedImage.vue` или `LazyImage.vue` или `ResponsiveImage.vue` (оставить один)

**Сторы (или сильно упростить):**
- `app/stores/loading.ts` — методы `loadMenu`, `createOrder`, `syncData` с `setTimeout`
- `app/stores/user.ts` — объединить с `auth.ts`

**Composables:**
- `app/composables/useNotification.ts` (дубликат `useNotifications.ts`)
- `app/composables/usePerformance.ts` или `usePerformanceMonitoring.ts` (один из двух)

**Плагины:**
- `app/plugins/accessibility-dev.client.ts` — только dev
- `app/plugins/performance.client.ts` или `performance-optimization.client.ts` (один из двух)

---

## ОДИН ГЛАВНЫЙ UX-МОМЕНТ ДЛЯ КОНВЕРСИИ

Убрать страницу `/dish/[id]` с 6 под-роутами и заменить на **bottom sheet / modal** прямо поверх каталога.

Сейчас клиент: нажимает на товар → переходит на новую страницу → читает → нажимает "назад" → снова видит каталог с потерянной позицией скролла.

С bottom sheet: нажимает на товар → снизу выезжает карточка с деталями и кнопкой "В корзину" → закрывает → остаётся на том же месте в каталоге.

Это стандартный паттерн для Telegram Mini Apps (Яндекс Еда, Delivery Club) и он напрямую увеличивает конверсию добавления в корзину, потому что убирает лишний шаг навигации.
