# Multi-stage Docker build for production optimization
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
# Copy pnpm-lock.yaml if it exists, otherwise skip
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm config set node-linker hoisted && pnpm install

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build

# Set build arguments
ARG NUXT_PUBLIC_API_BASE_URL
ARG NUXT_PUBLIC_TENANT_SLUG
ARG NUXT_PUBLIC_WEBSOCKET_URL

# Set environment variables for build process
ENV NUXT_PUBLIC_API_BASE_URL=${NUXT_PUBLIC_API_BASE_URL}
ENV NUXT_PUBLIC_TENANT_SLUG=${NUXT_PUBLIC_TENANT_SLUG}
ENV NUXT_PUBLIC_WEBSOCKET_URL=${NUXT_PUBLIC_WEBSOCKET_URL}

# Copy source code
COPY . .

# Build the application
RUN pnpm run build:production

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nuxt -u 1001

# Copy built application
COPY --from=build --chown=nuxt:nodejs /app/.output /app/.output
COPY --from=build --chown=nuxt:nodejs /app/package.json /app/package.json

# Set environment variables
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", ".output/server/index.mjs"]