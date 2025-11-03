# Menu Ordering Frontend

Universal frontend application built with Nuxt 3 for the menu ordering system. Works as both a web application and Telegram Web App.

## Features

- 🌐 Universal: Works in web browsers and Telegram
- 🎨 Modern UI with Tailwind CSS and custom design system
- 📱 Responsive design with mobile-first approach
- 🛒 Shopping cart with local persistence
- 🔄 Real-time order tracking
- 🌍 Multi-platform support (Web + Telegram)
- 📊 State management with Pinia
- 🔧 TypeScript support
- 🎯 ESLint + Prettier for code quality

## Tech Stack

- **Framework**: Nuxt 3
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Pinia
- **Typography**: Work Sans font family
- **Code Quality**: ESLint + Prettier
- **Platform Integration**: Telegram Web App SDK

## Setup

Install dependencies:

```bash
pnpm install
```

## Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking

## Project Structure

```
app/
├── assets/css/          # Stylesheets and design system
├── components/          # Vue components
│   ├── base/           # Base UI components
│   ├── layout/         # Layout components
│   ├── menu/           # Menu-related components
│   ├── cart/           # Cart components
│   └── order/          # Order components
├── pages/              # Application pages
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
├── plugins/            # Nuxt plugins
├── composables/        # Vue composables
├── middleware/         # Route middleware
└── utils/              # Utility functions
```

## Design System

The application uses a custom design system with:

- **Colors**: Primary red (#e43a05), green (#20ab47), orange (#fea529)
- **Typography**: Work Sans font family with semantic classes
- **Components**: Consistent spacing, shadows, and border radius
- **Responsive**: Mobile-first approach with touch-friendly interactions

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Telegram Configuration
NUXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# App Configuration
NUXT_PUBLIC_APP_NAME=Menu Ordering App
```

## Platform Support

### Web Browser
- Standard web application
- PWA capabilities
- Responsive design
- Web authentication

### Telegram Web App
- Integrated with Telegram Bot
- User data from Telegram
- Native Telegram UI integration
- Seamless user experience

## Development Guidelines

- Follow the established component structure
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write semantic, accessible HTML
- Use the design system classes consistently
- Test on both web and Telegram platforms
