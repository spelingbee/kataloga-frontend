# 🛍️ Frontend - Kataloga Mini App

Nuxt.js приложение для клиентов - мини-приложение для Telegram с возможностью просмотра меню и оформления заказов.

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Конфигурация тенанта](#конфигурация-тенанта)
- [Структура проекта](#структура-проекта)
- [Telegram интеграция](#telegram-интеграция)
- [Тестирование](#тестирование)
- [Развертывание](#развертывание)

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- pnpm 8+
- Запущенный backend API

### Установка

```bash
# Установка зависимостей
pnpm install

# Настройка переменных окружения
cp .env.example .env.development
# Отредактируйте .env.development с настройками тенанта
```

### Запуск для конкретного тенанта

Frontend приложение работает в режиме **single-tenant** - каждый экземпляр обслуживает только одного арендатора.

#### Вариант 1: Использование готовых конфигураций

```bash
# Пиццерия "Вкусная Пицца"
cp .env.single-tenant .env.development
pnpm dev

# Или для продакшн
cp .env.production .env.production
pnpm build
pnpm start
```

#### Вариант 2: Настройка собственного тенанта

Создайте файл `.env.development`:

```env
# API Configuration
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
NUXT_PUBLIC_TENANT_SLUG=your-tenant-slug

# Tenant Specific
NUXT_PUBLIC_TENANT_NAME="Название вашего заведения"
NUXT_PUBLIC_TENANT_LOGO="/logo.png"

# Telegram Bot (опционально)
NUXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username

# Theme Colors
NUXT_PUBLIC_PRIMARY_COLOR="#FF6B35"
NUXT_PUBLIC_SECONDARY_COLOR="#2ECC71"
```

### Доступные тенанты для тестирования

После заполнения базы данных доступны следующие тенанты:

#### 🍕 Пиццерия "Вкусная Пицца"
```env
NUXT_PUBLIC_TENANT_SLUG=vkusnaya-pizza
NUXT_PUBLIC_TENANT_NAME="Вкусная Пицца"
```
- **Категории**: Пиццы, Напитки, Десерты
- **Локации**: Центральный филиал, Филиал Ала-Тоо
- **Тестовый клиент**: customer1@test.kg / password123

#### 🍜 Азиатская Кухня
```env
NUXT_PUBLIC_TENANT_SLUG=asian-kitchen
NUXT_PUBLIC_TENANT_NAME="Азиатская Кухня"
```
- **Категории**: Суши и роллы, Лапша и рис, Супы
- **Локации**: Главный ресторан
- **Тестовый клиент**: customer2@test.kg / password123

#### 🌸 Цветочный магазин "Букет"
```env
NUXT_PUBLIC_TENANT_SLUG=flower-bouquet
NUXT_PUBLIC_TENANT_NAME="Цветочный магазин Букет"
```
- **Категории**: Букеты, Розы, Комнатные растения
- **Локации**: Основной магазин
- **Тестовый клиент**: customer3@test.kg / password123

#### 🍕 Pizza Palace (FREE план)
```env
NUXT_PUBLIC_TENANT_SLUG=pizza-palace
NUXT_PUBLIC_TENANT_NAME="Pizza Palace"
```

#### 🍔 Burger King Test (PRO план)
```env
NUXT_PUBLIC_TENANT_SLUG=burger-king-test
NUXT_PUBLIC_TENANT_NAME="Burger King Test"
```

#### 🍣 Sushi Master (BUSINESS план)
```env
NUXT_PUBLIC_TENANT_SLUG=sushi-master
NUXT_PUBLIC_TENANT_NAME="Sushi Master"
```

## ⚙️ Конфигурация тенанта

### Основные настройки

```env
# Обязательные параметры
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000    # URL backend API
NUXT_PUBLIC_TENANT_SLUG=your-tenant-slug          # Slug тенанта из БД

# Брендинг
NUXT_PUBLIC_TENANT_NAME="Название заведения"      # Отображаемое название
NUXT_PUBLIC_TENANT_LOGO="/logo.png"               # Логотип (в папке public/)
NUXT_PUBLIC_TENANT_DESCRIPTION="Описание"         # Описание заведения

# Цветовая схема
NUXT_PUBLIC_PRIMARY_COLOR="#FF6B35"               # Основной цвет
NUXT_PUBLIC_SECONDARY_COLOR="#2ECC71"             # Дополнительный цвет
NUXT_PUBLIC_ACCENT_COLOR="#F39C12"                # Акцентный цвет

# Telegram интеграция
NUXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot        # Username бота (без @)
NUXT_PUBLIC_TELEGRAM_WEBAPP_URL=https://your-domain.com  # URL для Telegram WebApp
```

### Мультитенантные конфигурации

Для развертывания нескольких тенантов используйте разные файлы окружения:

```bash
# Структура файлов
.env.pizza          # Конфигурация пиццерии
.env.sushi          # Конфигурация суши-бара
.env.flowers        # Конфигурация цветочного магазина

# Запуск с конкретной конфигурацией
cp .env.pizza .env.development && pnpm dev
```

## 📁 Структура проекта

```
app/
├── assets/              # Статические ресурсы
│   ├── scss/           # SCSS стили
│   └── images/         # Изображения
├── components/         # Vue компоненты
│   ├── cart/          # Компоненты корзины
│   ├── checkout/      # Компоненты оформления заказа
│   ├── menu/          # Компоненты меню
│   ├── product/       # Компоненты товаров
│   └── ui/            # UI компоненты
├── composables/       # Композиционные функции
├── layouts/           # Макеты страниц
├── middleware/        # Middleware
├── pages/             # Страницы приложения
├── plugins/           # Плагины Nuxt
├── stores/            # Pinia хранилища
├── types/             # TypeScript типы
└── utils/             # Утилиты
```

### Основные страницы

- `/` - Главная страница с меню
- `/menu` - Полное меню
- `/menu/search` - Поиск по меню
- `/cart` - Корзина
- `/checkout` - Оформление заказа
- `/orders` - История заказов
- `/profile` - Профиль пользователя

## 📱 Telegram интеграция

### Настройка Telegram WebApp

1. **Создайте бота через @BotFather**
2. **Настройте WebApp**:
   ```
   /setmenubutton
   @your_bot_name
   Меню - https://your-domain.com
   ```

3. **Обновите конфигурацию**:
   ```env
   NUXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_name
   NUXT_PUBLIC_TELEGRAM_WEBAPP_URL=https://your-domain.com
   ```

### Telegram SDK

Приложение использует Telegram WebApp SDK для:
- Получения данных пользователя
- Управления главной кнопкой
- Тактильной обратной связи (haptic feedback)
- Управления темой приложения

### Композиционные функции для Telegram

```typescript
// Получение данных пользователя Telegram
const { user, initData } = useTelegramUser()

// Управление главной кнопкой
const { showMainButton, hideMainButton } = useTelegramMainButton()

// Тактильная обратная связь
const { impactOccurred, notificationOccurred } = useTelegramHaptic()
```

## 🛒 Функциональность

### Корзина

- Добавление/удаление товаров
- Изменение количества
- Сохранение в localStorage
- Синхронизация между вкладками

### Оформление заказа

- Выбор способа оплаты (наличные/перевод)
- Указание контактных данных
- Подтверждение заказа
- Отправка уведомлений

### Поиск

- Поиск по названию товара
- Фильтрация по категориям
- Быстрый доступ к популярным товарам

## 🧪 Тестирование

### Юнит тесты

```bash
# Запуск тестов
pnpm test

# Тесты с покрытием
pnpm test:coverage

# Тесты в режиме наблюдения
pnpm test:watch
```

### E2E тесты

```bash
# Интеграционные тесты
pnpm test:e2e
```

### Тестовые файлы

- `test-animations.html` - Тестирование анимаций
- `test-base-components.html` - Тестирование базовых компонентов
- `test-cart-functionality.html` - Тестирование корзины
- `test-theme-system.html` - Тестирование темы
- `test-typography.html` - Тестирование типографики

## 🎨 Кастомизация

### Темы

Настройте цветовую схему в `assets/scss/abstracts/_variables.scss`:

```scss
:root {
  --primary-color: #{$primary-color};
  --secondary-color: #{$secondary-color};
  --accent-color: #{$accent-color};
}
```

### Компоненты

Создайте собственные компоненты в папке `components/`:

```vue
<template>
  <div class="custom-component">
    <!-- Ваш контент -->
  </div>
</template>

<script setup lang="ts">
// Логика компонента
</script>

<style scoped>
.custom-component {
  /* Стили компонента */
}
</style>
```

## 🚀 Развертывание

### Статическая генерация

```bash
# Генерация статического сайта
pnpm generate

# Файлы будут в папке .output/public/
```

### SSR развертывание

```bash
# Сборка для SSR
pnpm build

# Запуск продакшн сервера
pnpm start
```

### Docker

```bash
# Сборка образа
docker build -t kataloga-frontend .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env kataloga-frontend
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 API Integration

### Standardized API Client

The frontend uses a standardized API client that provides type-safe communication with the backend:

```typescript
// Initialize API client
const apiClient = useApiClient()

// Simple GET request (returns clean data)
const users = await apiClient.get<User[]>('/users')

// GET request with full response (includes metadata)
const response = await apiClient.getRaw<User[]>('/users')
console.log(response.meta.requestId) // For debugging

// POST request with error handling
try {
  const newUser = await apiClient.post<User>('/users', userData)
} catch (error: ApiError) {
  if (error.code === 'VALIDATION_ERROR') {
    // Handle validation errors
    console.log(error.details) // Field-specific errors
  }
}
```

### Service Layer Pattern

All API calls are encapsulated in service classes:

```typescript
// Menu Service example
export class MenuService {
  async getCategories(): Promise<Category[]> {
    return this.apiClient.get<Category[]>('/categories')
  }
  
  async getMenuItems(params?: MenuParams): Promise<PaginatedResult<MenuItem>> {
    const response = await this.apiClient.getRaw<MenuItem[]>('/menu', { params })
    return {
      items: response.data || [],
      pagination: response.meta.pagination!
    }
  }
}
```

### Error Handling

The application provides comprehensive error handling:

```typescript
// Global error handler
const { handleApiError } = useGlobalErrorHandler()

// Form validation errors
const { fieldErrors, handleValidationError } = useApiForm()

// Automatic error handling for:
// - 401: Redirects to login
// - 403: Shows access denied message  
// - 500: Shows generic error toast
// - VALIDATION_ERROR: Maps to form fields
```

### Request Tracing

Every API request includes a unique `requestId` for debugging:

```typescript
try {
  const data = await apiClient.get('/data')
} catch (error: ApiError) {
  // Log with request ID for support
  console.error(`Request ${error.requestId} failed:`, error.message)
}
```

For detailed migration information, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

## 🔧 Конфигурация окружений

### Разработка (.env.development)

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
NUXT_PUBLIC_TENANT_SLUG=vkusnaya-pizza
NUXT_PUBLIC_TENANT_NAME="Вкусная Пицца"
```

### Продакшн (.env.production)

```env
NUXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NUXT_PUBLIC_TENANT_SLUG=vkusnaya-pizza
NUXT_PUBLIC_TENANT_NAME="Вкусная Пицца"
NUXT_PUBLIC_TELEGRAM_WEBAPP_URL=https://pizza.your-domain.com
```

### Staging (.env.staging)

```env
NUXT_PUBLIC_API_BASE_URL=https://staging-api.your-domain.com
NUXT_PUBLIC_TENANT_SLUG=vkusnaya-pizza
NUXT_PUBLIC_TENANT_NAME="Вкусная Пицца (Staging)"
```

## 🐛 Устранение проблем

### Частые проблемы

1. **Ошибка "Tenant not found"**
   - Проверьте `NUXT_PUBLIC_TENANT_SLUG` в `.env`
   - Убедитесь, что тенант существует в БД

2. **Проблемы с API**
   - Проверьте `NUXT_PUBLIC_API_BASE_URL`
   - Убедитесь, что backend запущен

3. **Telegram WebApp не работает**
   - Проверьте настройки бота
   - Убедитесь, что URL доступен по HTTPS

### Отладка

```bash
# Запуск в режиме отладки
pnpm dev --debug

# Проверка сборки
pnpm build --analyze
```

## 📞 Поддержка

Для получения помощи:
1. Проверьте документацию
2. Посмотрите тестовые файлы в корне проекта
3. Обратитесь к команде разработки

## 🔄 Обновления

### Обновление зависимостей

```bash
# Проверка устаревших пакетов
pnpm outdated

# Обновление всех пакетов
pnpm update

# Обновление конкретного пакета
pnpm update package-name
```