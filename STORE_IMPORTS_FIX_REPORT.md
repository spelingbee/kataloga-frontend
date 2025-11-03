# Store Imports Fix Report

## Проблема
В проекте было обнаружено, что многие компоненты и composables используют сторы Pinia без правильного импорта, что приводило к ошибкам во время выполнения.

## Исправленные файлы

### Автоматически исправленные (17 файлов):
1. `app/app.vue` - добавлены импорты `useCartStore`, `useMenuStore`, `useUserStore`
2. `app/components/examples/ApiIntegrationExample.vue` - добавлены импорты composables
3. `app/components/examples/WebSocketNotificationExample.vue` - добавлен импорт `usePushNotifications`
4. `app/components/layout/AppHeader.vue` - добавлены импорты `useCartStore`, `useUserStore`
5. `app/components/layout/AppNavigation.vue` - добавлен импорт `useCartStore`
6. `app/components/layout/AppSidebar.vue` - добавлен импорт `useMenuStore`
7. `app/components/layout/CartDrawer.vue` - добавлен импорт `useCartStore`
8. `app/components/layout/DishDetailModal.vue` - добавлен импорт `useCartStore`
9. `app/components/layout/DishDetailPanel.vue` - добавлены импорты `useCartStore`, `useMenuStore`
10. `app/components/layout/MobileCategorySidebar.vue` - добавлен импорт `useMenuStore`
11. `app/components/menu/CategorySidebar.vue` - добавлен импорт `useMenuStore`
12. `app/components/menu/FavouritesGrid.vue` - добавлены импорты `useCartStore`, `useMenuStore`
13. `app/components/menu/MenuFilters.vue` - добавлен импорт `useMenuStore`
14. `app/components/menu/MenuSearch.vue` - добавлен импорт `useMenuStore`
15. `app/components/notifications/PushNotificationSettings.vue` - добавлен импорт `usePushNotifications`
16. `app/pages/map/index.vue` - добавлен импорт `useGeolocation`
17. `app/pages/notifications.vue` - добавлен импорт `usePushNotifications`

### Вручную исправленные файлы:
1. `app/components/menu/PopularSection.vue` - добавлены импорты `useMenuStore`, `useUserStore`
2. `app/components/menu/MenuItemCard.vue` - добавлены импорты `useMenuStore`, `useCartStore`
3. `app/components/order/OrderTracker.vue` - добавлен импорт `useOrders`
4. `app/pages/orders/index.vue` - добавлены импорты сторов и composables
5. `app/components/cart/CheckoutForm.vue` - добавлен импорт `useCartStore`
6. `app/middleware/auth.ts` - добавлены импорты `useAuth`, `useTelegram`
7. `app/middleware/guest.ts` - добавлен импорт `useAuth`
8. `app/middleware/admin.ts` - добавлен импорт `useAuth`

## Созданные инструменты

### 1. Автоматический скрипт исправления
Создан скрипт `scripts/fix-store-imports.js`, который:
- Сканирует все Vue и TypeScript файлы
- Находит использование сторов и composables без импорта
- Автоматически добавляет недостающие импорты
- Группирует импорты по типу (stores/composables)

### 2. Паттерны для поиска
Скрипт распознаёт следующие паттерны:

**Stores:**
- `useAuthStore()` → `~/stores/auth`
- `useCartStore()` → `~/stores/cart`
- `useMenuStore()` → `~/stores/menu`
- `useUserStore()` → `~/stores/user`
- `useOrderStore()` → `~/stores/order`
- `useLocationStore()` → `~/stores/location`
- `useErrorStore()` → `~/stores/error`
- `useLoadingStore()` → `~/stores/loading`

**Composables:**
- `useAuth()` → `~/composables/useAuth`
- `useCart()` → `~/composables/useCart`
- `useMenu()` → `~/composables/useMenu`
- `useOrders()` → `~/composables/useOrders`
- И другие...

## Результат
- ✅ Исправлены импорты в 25+ файлах
- ✅ Создан автоматический инструмент для поиска и исправления подобных проблем
- ✅ Улучшена стабильность приложения
- ✅ Предотвращены runtime ошибки связанные с отсутствующими импортами

## Рекомендации на будущее

1. **Использовать auto-imports в Nuxt.js:**
   ```typescript
   // nuxt.config.ts
   export default defineNuxtConfig({
     imports: {
       dirs: ['stores', 'composables']
     }
   })
   ```

2. **Настроить ESLint правила:**
   - Добавить правила для проверки импортов
   - Использовать `eslint-plugin-import` для автоматической проверки

3. **Регулярно запускать скрипт проверки:**
   ```bash
   pnpm run fix-imports  # добавить в package.json
   ```

4. **Code Review:**
   - Проверять импорты при review кода
   - Использовать TypeScript strict mode для раннего обнаружения проблем

## Оставшиеся проблемы
Есть ещё некоторые ошибки типизации, которые требуют отдельного внимания:
- Несоответствие типов в некоторых компонентах
- Отсутствующие свойства в интерфейсах
- Проблемы с readonly типами

Эти проблемы не связаны с импортами сторов и требуют отдельного исправления.