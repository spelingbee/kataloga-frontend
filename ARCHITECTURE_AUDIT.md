# Полный Архитектурный Аудит Frontend-приложения Kataloga

> **Стек:** Nuxt 3, Vue 3 Composition API, Pinia, TailwindCSS, Telegram WebApp SDK
>
> Этот документ объединяет результаты всех аудитов и обсуждений архитектурных проблем фронтенда:
> архитектурный SSR-аудит, полный технический и UX-аудит, а также ревью senior-архитектора
> (циклические зависимости, побочные эффекты, утечки навигации).
>
> Часть проблем уже была исправлена (помечены ✅ ИСПРАВЛЕНО).

---

## ОГЛАВЛЕНИЕ

1. [🔴 КРИТИЧЕСКИЕ: SSR и Production-безопасность](#1--критические-ssr-и-production-безопасность)
2. [🔴 КРИТИЧЕСКИЕ: Архитектура состояния (Pinia)](#2--критические-архитектура-состояния-pinia)
3. [🔴 КРИТИЧЕСКИЕ: Данные и безопасность для MVP](#3--критические-данные-и-безопасность-для-mvp)
4. [🟡 ВАЖНЫЕ: Структурная целостность и Overengineering](#4--важные-структурная-целостность-и-overengineering)
5. [🟡 ВАЖНЫЕ: Производительность](#5--важные-производительность)
6. [🟡 ВАЖНЫЕ: UX — Флоу владельца магазина (админка)](#6--важные-ux--флоу-владельца-магазина-админка)
7. [🟡 ВАЖНЫЕ: UX — Флоу клиента (Telegram Mini App)](#7--важные-ux--флоу-клиента-telegram-mini-app)
8. [📋 СПИСОК ФАЙЛОВ К УДАЛЕНИЮ](#8--список-файлов-к-удалению)
9. [💡 РЕКОМЕНДАЦИИ ПО РЕФАКТОРИНГУ (с примерами кода)](#9--рекомендации-по-рефакторингу-с-примерами-кода)
10. [🏆 ТОП-10 ПРОБЛЕМ ДО ПЕРВОГО КЛИЕНТА](#10--топ-10-проблем-до-первого-клиента)

---

## 1. 🔴 КРИТИЧЕСКИЕ: SSR и Production-безопасность

Эти проблемы **гарантированно сломают** приложение при многопользовательской нагрузке в production.

---

### 1.1 Утечка памяти и кросс-пользовательское загрязнение состояния в SSR

**Проблемные файлы:** `services/menu.service.ts`, `services/tenant-resolver.service.ts`, `services/user.service.ts` и другие сервисы.

**Суть проблемы:** Каждый сервис в папке `services` реализован как синглтон на уровне модуля (module-level singleton):

```typescript
// services/menu.service.ts (Строка 561)
let menuService: MenuService | null = null
export function useMenuService(): MenuService {
  if (!menuService) menuService = new MenuService()
  return menuService
}
```

**Почему это сломает приложение:** В среде Nuxt SSR сервер Node.js загружает модули *только один раз*. Переменная на уровне модуля (`let menuService = null`) становится общей для **ВСЕХ** входящих пользовательских запросов. Поскольку сервисы (`MenuService`, `TenantResolverService`) содержат свойства класса для хранения данных, например `private cache = new Map()`, данные Пользователя А (и конфигурация тенанта) кэшируются глобально и могут быть случайно отданы Пользователю Б. Это является **огромной брешью в безопасности** и гарантированной утечкой памяти.

**Правило:** Никогда не используйте stateful-синглтоны (синглтоны с состоянием) в среде SSR.

---

### 1.2 Небезопасное извлечение контекста Nuxt в асинхронных действиях

**Проблемные файлы:** `stores/cart.ts` (L215, L368...), `stores/tenant.ts`, `stores/auth.ts` — найдено **27 совпадений**.

**Суть проблемы:** Динамическое извлечение контекста Nuxt через `const nuxtApp = useNuxtApp()` происходит прямо внутри асинхронных действий (actions).

**Почему это сломает приложение:** В Nuxt 3 функция `useNuxtApp()` теряет свой контекст после первого `await`, если она не вызвана синхронно во время фазы Vue `setup` или в хуке плагина. Вызов этой функции глубоко внутри асинхронного действия хранилища приведёт к случайным падениям приложения с ошибками вида `"Nuxt instance is unavailable"`.

---

### 1.3 Прямой доступ к LocalStorage внутри менеджера состояния

**Проблемные файлы:** `stores/cart.ts`, `stores/tenant.ts`, `stores/favorites.ts`, `stores/user.ts` — всего **54 совпадения**.

**Суть проблемы:** Действия Pinia напрямую взаимодействуют с `localStorage.setItem` и `localStorage.getItem`.

**Почему это сломает приложение:** `localStorage` — это API браузера, которого **не существует на сервере** (в Node.js). Вызов его внутри действий хранилища:
- Вызывает ошибки гидратации SSR (hydration mismatches).
- Роняет процесс Node.js, если вызов не обёрнут в `if (process.client)`.
- Жёстко связывает доменную логику с побочным эффектом (side effect).

---

### 1.4 Самописные механизмы кэширования (опасны в SSR)

**Проблемные файлы:** `utils/tenant-performance.ts`, `services/tenant-resolver.service.ts`

**Суть проблемы:** Используются кастомные классы `AdaptiveCache` и ручная логика дедупликации запросов внутри сервисов.

**Риск:** Nuxt 3 / Nitro предоставляет встроенные, высокооптимизированные примитивы: `useDataCache`, `useAsyncData` и `defineCachedEventHandler`. Кастомные слои кэширования в SSR приводят к багам с устаревшими данными (stale data) и излишнему потреблению памяти, особенно в сочетании с проблемой 1.1 (модульные синглтоны).

---

## 2. 🔴 КРИТИЧЕСКИЕ: Архитектура состояния (Pinia)

Проблемы, которые ломают тестируемость, мультитенантность и стабильность при масштабировании.

---

### 2.1 Утечка логики маршрутизации (Router) в Pinia

**Проблемные файлы:** `stores/tenant.ts`, `stores/error.ts`, `stores/auth.ts`

**Суть проблемы:** Действия (actions) внутри Pinia напрямую управляют маршрутизацией — вызывают `navigateTo('/login')`, `useRouter()`.

**Последствия:**
- Нарушает принцип разделения ответственности (Separation of Concerns).
- Делает невозможным тестирование хранилища в изоляции (нужен mock роутера).
- Делает невозможным переиспользование хранилища в других контекстах (middleware, фоновая синхронизация).

**Решение:** Пусть хранилище выбрасывает ошибку или обновляет флаг (`isAuthenticated = false`). Маршрутизацию обрабатывать в глобальном middleware `auth.global.ts`.

---

### 2.2 Загрязнение предметной области платформо-зависимыми сайд-эффектами

**Проблемные файлы:** `stores/cart.ts` (строки 98, 116, 141)

**Суть проблемы:** Хранилище корзины напрямую импортирует и выполняет `useTelegramHaptic()` внутри действий `addItem` и `removeItem`.

```typescript
// stores/cart.ts — НЕПРАВИЛЬНО
addItem(item) {
   this.items.push(item);
   useTelegramHaptic().cartActions.addToCart(); // Жёсткая привязка к Telegram
}
```

**Риск:** Бизнес-логика (Корзина) жёстко привязана к платформе (Telegram). Если приложение развернуть в обычном вебе — хранилище сломается или даст «тихие» ошибки. Побочные эффекты должны реагировать на изменения состояния на уровне компонентов или плагинов, а не запускаться из состояния домена.

**Решение (из Senior Architect):** Создать отдельный `haptic.service.ts`. Обрабатывать тактильный отклик в UI-компонентах или через `watch` за массивом товаров корзины в Layout/Plugin.

---

### 2.3 Циклические зависимости между сторами

**Источник:** Senior Architect review

**Суть проблемы:** Сторы импортируют друг друга напрямую через dynamic imports, что создаёт хрупкие связи. В частности, `tenant.ts` содержит `clearTenantData()`, который чистит другие сторы по одному через dynamic import — хрупко и может «забыть» стор.

```typescript
// stores/tenant.ts (строки 549-651) — НЕПРАВИЛЬНО
async clearTenantData() {
  const { useCartStore } = await import('./cart')   // Циклическая зависимость
  const { useMenuStore } = await import('./menu')   // Хрупко — легко забыть стор
  useCartStore().$reset()
  useMenuStore().$reset()
}
```

**Решение (из Senior Architect):**
- Создать событийную шину (event bus) или выделенный оркестрационный слой.
- `tenant.ts` эмитирует `tenant:changed`, остальные сторы подписываются на него.
- Единый реестр сторов для `$reset()` при смене тенанта.

---

### 2.4 Утечка состояния между тенантами (мультитенантность)

**Проблемные файлы:** `stores/favorites.ts`, `stores/menu.ts`, `stores/order.ts`

**Суть проблемы:** `cartStore` использует `useTenantStorage` для изоляции ✅, но **не все сторы** используют tenant-aware storage. При переключении тенанта данные могут смешаться.

| Стор | Tenant-изоляция | Статус |
|---|---|---|
| `cart.ts` | `useTenantStorage` ✅ | Правильно |
| `favorites.ts` | `useTenantStorage` ✅ | Правильно |
| `menu.ts` | Нет | ⚠️ Данные могут смешаться |
| `order.ts` | Нет | ⚠️ Данные могут смешаться |

**Решение:** Проверить все сторы на использование `useTenantStorage`. Добавить `$reset()` при смене тенанта через единый реестр (см. 2.3).

---

### 2.5 Дублирование состояния аутентификации

**Проблемные файлы:** `stores/auth.ts`, `stores/user.ts`, `app/app.vue`

**Суть проблемы:** Два отдельных стора хранят `user`, `isAuthenticated`, и оба инициализируются в `app.vue`. `userStore.initializeUser()` и `authStore.initializeAuth()` делают одно и то же.

**Решение:** Объединить в один стор. `user.ts` удалить, перенести `detectPlatform()` и `initializeTelegramUser()` в `auth.ts`.

---

## 3. 🔴 КРИТИЧЕСКИЕ: Данные и безопасность для MVP

Проблемы, которые напрямую **обманут** первого реального клиента.

---

### 3.1 Mock-данные в production-коде

**Проблемные файлы:** `pages/admin/index.vue`, `pages/admin/orders/index.vue`

**Суть проблемы:** При ошибке API молча подставляются mock-данные с именами `"John Doe"`, `"Jane Smith"`, а не показывается ошибка. Владелец увидит красивые, но фейковые цифры.

**Решение:** Убрать все mock-данные из production-кода. Показывать empty state или баннер «Не удалось загрузить данные».

---

### 3.2 Захардкоженные данные пользователя

| Проблема | Файл | Решение |
|---|---|---|
| `customerInfo` = `{ name: 'Customer', phone: '' }` — во всех заказах имя будет "Customer" | [order.ts:85-88](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/order.ts#L85-L88) | Получать из API response |
| `paymentMethod` = `'CASH'` захардкожен — нельзя выбрать другой метод оплаты | [cart.ts:345](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L345) | Разрешить выбор |
| Preconnect к `api.example.com`, `cdn.example.com` — DNS-запросы к несуществующим доменам | [performance-optimization.client.ts:197](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/plugins/performance-optimization.client.ts#L197) | Удалить или заменить |

---

### 3.3 Тестовые страницы и незащищённые роуты в production

| Роут | Проблема | Серьёзность |
|---|---|---|
| `/map/test-picker` | Тестовая страница без middleware, доступна всем | 🔴 Удалить немедленно |
| `/promotions` | На mock-данных, `subscribeNewsletter` делает `alert()` | 🟡 Скрыть |
| `/notifications` | Нет middleware, может показать чужие данные | 🟡 Добавить auth |
| `/orders/**` | `ssr: false` но middleware не указан | 🟡 Добавить auth |
| `/delivery` | `checkDeliveryAvailability` делает `Math.random()` | 🟡 Скрыть |

**Решение:** Добавить `definePageMeta({ middleware: 'auth' })` на все страницы, требующие авторизации. `map/test-picker.vue` — удалить файл.

---

### 3.4 ✅ ИСПРАВЛЕНО: `console.log(items)` в production getter

**Файл:** `stores/menu.ts:48`

Вызывался при каждом ре-рендере каталога, спамил в консоль. **Удалён.**

---

### 3.5 ✅ ИСПРАВЛЕНО: Telegram MainButton и BackButton

- MainButton интегрирован в `checkout.vue` lifecycle.
- BackButton подключён к browser history в `cart.vue`.
- Утечка памяти `timeoutPromise` в checkout исправлена.

---

## 4. 🟡 ВАЖНЫЕ: Структурная целостность и Overengineering

---

### 4.1 Масштаб избыточности

Кодовая база радикально переинженерена для MVP:

| Категория | Кол-во | Уровень для MVP |
|---|---|---|
| Composables | **51** | Enterprise с 50+ разработчиками |
| Utils | **20** | Большинство не используются |
| Плагины (client) | **19** | Блокируют первый рендер |
| Stores | **13** | 4 дублируют друг друга |
| Image-компоненты | **4** (LazyImage, OptimizedImage, ResponsiveImage, BaseImage) | Достаточно `<NuxtImg>` |

---

### 4.2 Фичи, не нужные для MVP

| Фича | Файлы | Почему не нужна |
|---|---|---|
| PWA + Offline sync | `useOfflineCart.ts` (19KB), `useOfflineCheckout.ts`, `usePWA.ts`, `stores/offline.ts`, `plugins/pwa.client.ts`, `plugins/offline.client.ts`, `components/pwa/*` | Telegram Mini App не нуждается в PWA. Оффлайн-синхронизация корзины через IndexedDB + localStorage + серверная синхронизация (3 слоя) — overengineering |
| Push Notifications | `usePushNotifications.ts`, `usePlatformNotifications.ts`, `useTelegramNotifications.ts`, `services/notification.service.ts` | В Telegram уведомления идут через бот |
| Geolocation + Maps | `useGeolocation.ts`, `useMap.ts`, `stores/location.ts`, `services/map.service.ts`, `plugins/maps.client.ts`, `pages/map/*`, `pages/delivery/*` | Доставка на карте — не MVP |
| Accessibility (dev) | `useAccessibility.ts` (18KB), `plugins/accessibility-dev.client.ts` (10.8KB), `utils/accessibility-testing.ts` | Dev-only тулинг, утяжеляет бандл |
| WebSocket | `services/websocket.service.ts`, `plugins/websocket.client.ts` | Для MVP достаточно polling |

---

### 4.3 Дублирование кода

| Что дублируется | Дубликаты | Решение |
|---|---|---|
| Состояние аутентификации | `stores/auth.ts` + `stores/user.ts` | Объединить в один стор |
| Offline-логика | `useOfflineCart.ts` + `stores/offline.ts` + `stores/error.ts` — три независимых слушателя `online/offline` | Один источник правды |
| Notifications | `useNotification.ts` + `useNotifications.ts` + `stores/notification.ts` + `stores/user.ts` (все хранят `notifications[]`) | Оставить один стор + один composable |
| Performance monitoring | `usePerformance.ts` + `usePerformanceMonitoring.ts` + `plugins/performance.client.ts` + `plugins/performance-optimization.client.ts` | Удалить дубликаты |
| Loading state | `stores/loading.ts` (глобальный) vs per-store `loading: ref(false)` | Удалить глобальный стор, использовать локальные |
| Error state | `stores/error.ts` (глобальный) vs per-store `error` | Удалить глобальный стор |
| Image компоненты | `LazyImage.vue`, `OptimizedImage.vue`, `ResponsiveImage.vue`, `BaseImage.vue` | Использовать `<NuxtImg>` |
| SkipLinks | `components/base/SkipLinks.vue` + `components/layout/SkipLinks.vue` | Удалить один |

---

### 4.4 Избыточные обёртки

**Файл:** `composables/useTenant.ts` — **863 строки**

Composable просто оборачивает и переэкспортирует каждое свойство, геттер и действие из `useTenantStore`. Дублирует документацию, типы и логику, удорожая любые изменения в два раза, но не предоставляя никакой новой абстрактной ценности. Хранилища Pinia уже реактивны.

---

### 4.5 God Object: CheckoutFlow.vue

**Файл:** `components/checkout/CheckoutFlow.vue` — **636 строк**

Компонент одновременно:
- Обрабатывает валидацию форм (`validateForm`)
- Формирует DTO для API (`CreateOrderDto`)
- Оркестрирует Telegram UI-эффекты (`telegram.showMainButton`)
- Обрабатывает маппинг ошибок
- Выполняет вызов API (`useOrders().createOrder()`)

Бизнес-логика безнадёжно переплетена с UI. Невозможно протестировать логику оформления заказа без монтирования компонента.

---

## 5. 🟡 ВАЖНЫЕ: Производительность

---

### 5.1 ✅ ЧАСТИЧНО ИСПРАВЛЕНО: View Transitions API

**Файл:** `nuxt.config.ts`

`experimental.viewTransition = true` вызывал 2.63s фриз навигации — браузер делал полный скриншот DOM до и после перехода. **Отключен.**

---

### 5.2 ✅ ЧАСТИЧНО ИСПРАВЛЕНО: Waterfall загрузки данных

**Файл:** `app/app.vue`

`onMounted` вызывал последовательные API-запросы. Заменено на `Promise.all` для параллельной загрузки `userStore.initializeUser` и `cartStore.restoreCart`.

---

### 5.3 Блокировка первого рендера

**Файл:** `app/app.vue`

`app.vue` инициализирует **6 сторов + 4 composable** при каждом старте, включая `useOfflineCart`, `useAnimations`, `useResponsive` — всё блокирует первый рендер. `initializeOfflineCart` вызывается, но результат не используется.

**Решение:** Лениво инициализировать некритичные сторы. `useAnimations` и `useResponsive` — только при необходимости.

---

### 5.4 19 client-side плагинов при каждом старте

Большинство не нужны для Telegram Mini App:

| Плагин | Действие |
|---|---|
| `accessibility-dev.client.ts` | Только в dev-режиме |
| `performance.client.ts` | Удалить (дубликат) |
| `performance-optimization.client.ts` | Удалить — preload `example.com`, 30-сек polling |
| `pwa.client.ts` | Удалить — Telegram Mini App ≠ PWA |
| `maps.client.ts` | Lazy import только на страницах с картой |
| `keyboard-navigation.client.ts` | Не нужен в Telegram |

---

### 5.5 Лишние ре-рендеры и вычисления

| Проблема | Файл | Решение |
|---|---|---|
| `filteredItems` геттер — просто алиас для `filteredMenuItems` | [menu.ts:114-116](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L114-L116) | Удалить дублирующий геттер |
| `subtotal` вычисляется в 4 разных геттерах | [cart.ts:55-80](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/cart.ts#L55-L80) | Вычислять один раз в computed |
| `fetchMenu` — всегда два вызова (cache + API) | [menu.ts:120-211](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts#L120-L211) | Cache → рендер → фоновый refresh |
| `filteredMenuItems` пересчитывается при `loading` и `error` | [menu.ts](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/menu.ts) | Вынести фильтрацию в `computed` компонента |

---

### 5.6 Шрифты

Загружаются два шрифта (Inter + Poppins) с 5 весами каждый — лишние 200-400ms на медленном интернете.

**Решение:** Один шрифт, 3 веса. Для Mini App можно использовать системный шрифт.

---

### 5.7 SSR vs CSR для Telegram Mini App

| Часть | Настройка | Рекомендация |
|---|---|---|
| `/admin/**` | `ssr: false` ✅ | Правильно |
| `/auth/**` | `ssr: false` ✅ | Правильно |
| `/menu`, `/dish/**` | `ssr: true` | ⚠️ Для Mini App SSR бесполезен — TG WebView не кэширует SSR |
| `/` (homepage) | `ssr: true` | Редирект на `/menu` → SSR бессмысленен |

---

## 6. 🟡 ВАЖНЫЕ: UX — Флоу владельца магазина (админка)

---

### 6.1 Нет онбординга

Нет страницы настроек магазина. В сайдбаре только Dashboard → Menu → Orders → Analytics. Новый владелец зарегистрируется и **не поймёт, что делать дальше**.

**Решение:** Создать 3-шаговый wizard:
1. «Назовите свой магазин» → создание tenant
2. «Добавьте первый товар» → упрощённая форма (название, цена, фото)
3. «Ваш магазин готов! Вот ссылка: `t.me/KatalogaBot?start=SLUG`» → кнопка «Скопировать»

Добавить страницу `/admin/settings` с данными магазина, ссылкой на бот, настройками доставки.

---

### 6.2 Заказы без real-time и подтверждений

| Проблема | Файл | Решение |
|---|---|---|
| Смена статуса заказа через `<select>` без confirm-диалога | `admin/orders/index.vue` | Confirm для CANCELLED/DELIVERED. Тост «Клиент уведомлён» |
| Нет real-time обновлений (ручной refresh) | `admin/orders/index.vue` | Polling каждые 15 сек + звуковое уведомление при новом заказе |
| Страница заказов — 27 KB, перегружена | `admin/orders/index.vue` | Упростить: таблица + бейджи + детали по клику |

---

### 6.3 Прочие проблемы админки

| Проблема | Файл | Решение |
|---|---|---|
| Аналитика — заглушка «Revenue chart would go here» | `admin/analytics/index.vue` | Убрать из навигации или показать простую таблицу |
| Кнопка 🔔 без `@click` — dead UI | `layouts/admin.vue` | Скрыть до реализации |
| Форма регистрации разделяет `firstName/lastName`, API объединяет в `name` | `stores/auth.ts:176` | Одно поле «Имя» |
| Форма создания товара — 14 KB, сложная | `admin/menu/create.vue` | Упростить: название, цена, фото, категория |

---

## 7. 🟡 ВАЖНЫЕ: UX — Флоу клиента (Telegram Mini App)

---

### 7.1 Главная страница без брендинга

**Файл:** `pages/index.vue`

Клиент открывает Mini App и видит generic «Welcome to Menu Ordering» — безликая страница без названия магазина, логотипа, персонализации.

**Решение:** Показывать название и брендинг тенанта из `tenantStore.tenantBranding`.

*(Частично исправлено: добавлен fallback «Welcome to Menu Ordering», но брендинг тенанта всё ещё не отображается.)*

---

### 7.2 Страница товара — 6 подроутов

**Файл:** `pages/dish/[id]/` — 6 подстраниц (`caloric-content`, `change-ingredients`, `change-quantity`, `ingredients`, `subcategory`, `waiting-time`)

В Telegram Mini App навигация между ними ломает BackButton и создаёт плохой UX.

**Решение:** Bottom sheet / modal поверх каталога (паттерн Яндекс Еды, Delivery Club). Клиент нажимает на товар → снизу выезжает карточка → закрывает → остаётся на том же месте с сохранением скролла.

---

### 7.3 Чекаут без таймаута

**Файл:** `pages/checkout.vue`

При ошибке сети overlay «Creating your order...» без таймаута — пользователь заблокирован навсегда.

**Решение:** Таймаут 30 сек → возможность отмены и retry.

---

### 7.4 Отсутствие retry при ошибке API

При ошибке API — пустой экран без retry-кнопки. Пользователь не может повторить запрос.

**Решение:** Компонент `ErrorRetry.vue` с кнопкой «Попробовать снова».

---

### 7.5 `syncFavoritesToServer` — N запросов

**Файл:** [favorites.ts:191-193](file:///c:/My/Projects/Work/Kataloga/apps/frontend/app/stores/favorites.ts#L191-L193)

Отправляет **каждый** избранный item отдельным запросом (N запросов вместо одного batch).

**Решение:** Batch endpoint — один запрос со всеми ID.

---

### 7.6 Telegram Mini Apps guidelines

| Проверка | Статус |
|---|---|
| Telegram WebApp SDK | ✅ `@telegram-apps/sdk` |
| Haptic feedback | ✅ `useTelegramHaptic.ts` (но нужно вынести из сторов) |
| Theme adaptation | ✅ `plugins/theme.client.ts` |
| MainButton для чекаута | ✅ ИСПРАВЛЕНО |
| BackButton | ✅ ИСПРАВЛЕНО |
| Viewport rules | ✅ `meta viewport` в `app.vue` |

---

## 8. 📋 СПИСОК ФАЙЛОВ К УДАЛЕНИЮ

### Composables (10 файлов, ~50 KB)

- `useVirtualScroll.ts` — нигде не импортируется
- `useCodeSplitting.ts` — нигде не импортируется
- `useGracefulDegradation.ts` — нигде не импортируется
- `useErrorRecovery.ts` — нигде не импортируется
- `useTouchInteractions.ts` — нигде не импортируется
- `useDebouncedSearch.ts` — нигде не импортируется
- `useLoadingState.ts` — нигде не импортируется
- `useGlobalErrorHandler.ts` — только в `examples/`
- `usePerformance.ts` — дублирует `usePerformanceMonitoring`
- `useColorMode.ts` — не нужен для MVP
- `useNotification.ts` — дубликат `useNotifications.ts`

### Utils (5 файлов, ~45 KB)

- `bundle-analyzer.ts` — нигде не импортируется
- `design-token-validation.ts` — нигде не импортируется
- `css-tree-shaking.ts` — только в себе
- `accessibility-testing.ts` — dev-only
- `color-contrast.ts` — dev-only

### Stores (3 файла, ~14 KB)

- `loading.ts` — дублирует per-store loading, mock-методы с `setTimeout`
- `error.ts` — дублирует per-store error
- `user.ts` — объединить с `auth.ts`

### Плагины

- `accessibility-dev.client.ts` — dev-only, 10.8 KB
- `performance.client.ts` — дубликат
- `performance-optimization.client.ts` — preload `example.com`
- `pwa.client.ts` — Telegram ≠ PWA

### Компоненты и страницы

- `components/examples/*` (3 файла) — demo-компоненты
- `components/layout/SkipLinks.vue` — дубликат `base/SkipLinks.vue`
- `components/base/OptimizedImage.vue`, `LazyImage.vue`, `ResponsiveImage.vue` — оставить только `<NuxtImg>`
- `examples/error-handler-usage.ts`
- `pages/map/test-picker.vue` — тестовая страница в production
- `pages/promotions.vue` — mock-данные, `alert()` в Telegram
- `pages/notifications.vue` — не нужна для MVP
- `pages/favourites.vue` — не нужна для MVP

### PWA и оффлайн-стек (~50+ KB)

- `useOfflineCart.ts` (19 KB)
- `useOfflineCheckout.ts`
- `usePWA.ts`
- `stores/offline.ts`
- `plugins/pwa.client.ts`
- `plugins/offline.client.ts`
- `components/pwa/*`
- `useNetworkStatus.ts`
- `plugins/network-status.client.ts`

> **Итого к удалению:** ~160+ KB мёртвого / дублирующего / не-MVP кода.

---

## 9. 💡 РЕКОМЕНДАЦИИ ПО РЕФАКТОРИНГУ (с примерами кода)

### 9.1 Исправление SSR-синглтонов (Сервисы)

Предоставлять сервисы через плагины Nuxt в контексте каждого запроса:

**БЫЛО (Неправильно):**
```typescript
// services/menu.service.ts
let menuService = null;
export function useMenuService() {
  if (!menuService) menuService = new MenuService();
  return menuService; // Шарится между ВСЕМИ пользователями сервера!
}
```

**СТАЛО (Правильно):**
```typescript
// plugins/services.ts
export default defineNuxtPlugin((nuxtApp) => {
  // Создаётся новый экземпляр на каждый входящий запрос
  const menuService = new MenuService(nuxtApp.$apiClient);
  return {
    provide: { menuService }
  }
});

// Использование:
const { $menuService } = useNuxtApp();
$menuService.getMenuItems();
```

---

### 9.2 Исправление контекста хранилищ и утечек LocalStorage

Использовать плагины для инъекции зависимостей и `pinia-plugin-persistedstate` для localStorage:

**БЫЛО (Неправильно):**
```typescript
// stores/cart.ts
actions: {
  async fetchCart() {
    const apiClient = (useNuxtApp() as any).$apiClient; // Риск потери контекста
    const data = await apiClient.get('/cart');
    localStorage.setItem('cart', JSON.stringify(data)); // Риск падения SSR
  }
}
```

**СТАЛО (Правильно):**
```typescript
// stores/cart.ts
actions: {
  async fetchCart() {
    // $apiClient инжектируется через Nuxt-плагин
    const data = await this.$apiClient.get('/cart');
    this.items = data.items;
  }
}
// '@pinia-plugin-persistedstate/nuxt' в nuxt.config.ts
// для автоматической и безопасной работы с localStorage/cookies.
```

---

### 9.3 Событийная архитектура (Senior Architect)

Заменить циклические зависимости между сторами на события:

**БЫЛО (Неправильно):**
```typescript
// stores/tenant.ts
async clearTenantData() {
  const { useCartStore } = await import('./cart')
  const { useMenuStore } = await import('./menu')
  useCartStore().$reset()
  useMenuStore().$reset()
}
```

**СТАЛО (Правильно):**
```typescript
// utils/event-bus.ts
export const eventBus = mitt<{ 'tenant:changed': string }>()

// stores/tenant.ts
async switchTenant(slug: string) {
  await this.loadTenant(slug);
  eventBus.emit('tenant:changed', slug);
}

// stores/cart.ts
const cartStore = defineStore('cart', () => {
  eventBus.on('tenant:changed', () => { items.value = []; });
  // ...
})
```

---

### 9.4 Отделение побочных эффектов

**БЫЛО (Неправильно):**
```typescript
// stores/error.ts
if (error.status === 401) navigateTo('/login');

// stores/cart.ts
addItem(item) {
   this.items.push(item);
   useTelegramHaptic().cartActions.addToCart();
}
```

**СТАЛО (Правильно):**
```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return navigateTo('/login');
});

// components/CartButton.vue
function handleAddToCart() {
  cartStore.addItem(item);
  useTelegramHaptic().cartActions.addToCart(); // Платформа в UI, не в сторе
}
```

---

### 9.5 Плагин для сервисов (Senior Architect)

```typescript
// plugins/services.ts
export default defineNuxtPlugin((nuxtApp) => {
  const hapticService = new HapticService();     // Абстракция тактильного отклика
  const storageService = new StorageService();   // Единый storage с tenant-prefix
  return {
    provide: { hapticService, storageService }
  }
});
```

---

## 10. 🏆 ТОП-10 ПРОБЛЕМ ДО ПЕРВОГО КЛИЕНТА

| # | Приоритет | Проблема | Файл(ы) |
|---|---|---|---|
| **1** | 🔴 СЛОМАЕТ | SSR-синглтоны → утечка данных между пользователями | `services/*.ts` |
| **2** | 🔴 СЛОМАЕТ | `useNuxtApp()` в async actions → "Nuxt instance unavailable" | `stores/cart.ts`, `stores/tenant.ts`, `stores/auth.ts` (27 мест) |
| **3** | 🔴 СЛОМАЕТ | `localStorage` в сторах → падение SSR / hydration mismatch | `stores/*.ts` (54 места) |
| **4** | 🔴 ОБМАНЕТ | Mock-данные "John Doe" при ошибке API | `admin/index.vue`, `admin/orders/index.vue` |
| **5** | 🔴 ОБМАНЕТ | `customerInfo` = `'Customer'` во всех заказах | `order.ts:85-88` |
| **6** | 🟡 КРИТИЧНО | Циклические зависимости между сторами / навигация в Pinia | `tenant.ts`, `error.ts`, `auth.ts` |
| **7** | 🟡 КРИТИЧНО | Telegram Haptics жёстко привязан к сторам Cart/Favorites | `cart.ts`, `favorites.ts` |
| **8** | 🟡 КРИТИЧНО | Нет онбординга для владельца магазина | `admin/` |
| **9** | 🟡 ВАЖНО | ~160 KB мёртвого кода, 19 плагинов, 51 composable | Множество файлов |
| **10** | 🟡 ВАЖНО | Чекаут без таймаута — пользователь заблокирован навсегда | `checkout.vue` |
