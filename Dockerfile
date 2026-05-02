# Multi-stage Docker build for production optimization
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Configure pnpm to use hoisted linker (more reliable in Docker)
RUN pnpm config set node-linker hoisted

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for dependency resolution
COPY packages/api-types/package.json ./packages/api-types/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

# Install dependencies (only based on package.json files)
RUN pnpm install --frozen-lockfile --filter frontend...

# Copy the rest of the source
COPY packages/api-types ./packages/api-types
COPY apps/frontend ./apps/frontend

# Development stage
FROM base AS development
WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
# Build workspace dependencies first
WORKDIR /app
RUN pnpm --filter @kataloga/api-types build

WORKDIR /app/apps/frontend
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
COPY --from=build --chown=nuxt:nodejs /app/apps/frontend/.output /app/.output
COPY --from=build --chown=nuxt:nodejs /app/apps/frontend/package.json /app/package.json

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