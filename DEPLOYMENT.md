# Production Deployment Guide

This guide covers the deployment of the Menu Ordering App frontend to production environments.

## Prerequisites

- Node.js 20+ installed
- pnpm package manager
- Docker and Docker Compose (for containerized deployment)
- SSL certificates for HTTPS
- Domain name configured

## Environment Setup

### 1. Environment Variables

Copy and configure the production environment file:

```bash
cp .env.example .env.production
```

Update the following variables in `.env.production`:

```bash
# API Configuration
NUXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NUXT_PUBLIC_TENANT_SLUG=production
NUXT_PUBLIC_WEBSOCKET_URL=wss://api.yourdomain.com

# Telegram Configuration
NUXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_production_telegram_bot_token

# Push Notifications
NUXT_PUBLIC_VAPID_PUBLIC_KEY=your_production_vapid_public_key

# Security & Monitoring
NUXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_for_error_tracking
NUXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Performance
NUXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com
```

### 2. SSL Certificates

Place your SSL certificates in the `ssl/` directory:

```bash
mkdir ssl
# Copy your certificates
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/
```

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

1. **Build and start the containers:**

```bash
# Build production image
docker-compose build

# Start services
docker-compose up -d
```

2. **Verify deployment:**

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f frontend

# Test health endpoint
curl https://yourdomain.com/api/health
```

### Method 2: PM2 Deployment

1. **Install dependencies:**

```bash
pnpm install --frozen-lockfile
```

2. **Build the application:**

```bash
pnpm run build:production
```

3. **Start with PM2:**

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Method 3: Manual Deployment

1. **Build the application:**

```bash
pnpm install --frozen-lockfile
pnpm run build:production
```

2. **Start the server:**

```bash
pnpm start
```

## Post-Deployment Checklist

### 1. Health Checks

- [ ] Application starts without errors
- [ ] Health endpoint responds: `GET /api/health`
- [ ] All static assets load correctly
- [ ] PWA manifest is accessible: `GET /manifest.json`
- [ ] Service Worker loads: `GET /sw.js`

### 2. Functionality Tests

- [ ] Homepage loads correctly
- [ ] Menu pages render with data
- [ ] Authentication flow works
- [ ] Order placement functions
- [ ] WebSocket connections establish
- [ ] Push notifications work
- [ ] Offline functionality works

### 3. Performance Verification

- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals are green
- [ ] Images are optimized and cached
- [ ] Gzip compression is enabled
- [ ] CDN is serving static assets

### 4. Security Verification

- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] Rate limiting is active
- [ ] No sensitive data in client bundle
- [ ] CSP headers are configured

## Monitoring and Maintenance

### Application Monitoring

1. **Health Monitoring:**

```bash
# Set up health check monitoring
curl -f https://yourdomain.com/api/health || exit 1
```

2. **Log Monitoring:**

```bash
# View application logs
docker-compose logs -f frontend

# Or with PM2
pm2 logs menu-app-frontend
```

3. **Performance Monitoring:**

- Configure Sentry for error tracking
- Set up analytics tracking
- Monitor Core Web Vitals
- Set up uptime monitoring

### Backup and Recovery

1. **Database Backups:**
   - Ensure backend database is backed up regularly
   - Test restore procedures

2. **Configuration Backups:**
   - Backup environment files
   - Backup SSL certificates
   - Backup Nginx configuration

### Updates and Maintenance

1. **Application Updates:**

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build and deploy
pnpm run build:production

# Restart services
docker-compose restart frontend
# Or with PM2
pm2 restart menu-app-frontend
```

2. **Security Updates:**

```bash
# Update dependencies
pnpm update

# Audit for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Node.js version (requires 20+)
   - Verify environment variables
   - Clear cache: `rm -rf .nuxt .output node_modules/.cache`

2. **Runtime Errors:**
   - Check application logs
   - Verify API connectivity
   - Check environment variable values

3. **Performance Issues:**
   - Monitor memory usage
   - Check database connection pool
   - Verify CDN configuration

4. **SSL/HTTPS Issues:**
   - Verify certificate validity
   - Check Nginx configuration
   - Ensure proper certificate chain

### Log Locations

- **Docker:** `docker-compose logs frontend`
- **PM2:** `~/.pm2/logs/`
- **Nginx:** `/var/log/nginx/`
- **Application:** `./logs/` (if configured)

### Emergency Procedures

1. **Rollback Deployment:**

```bash
# With Docker
docker-compose down
docker-compose up -d --build

# With PM2
pm2 stop menu-app-frontend
# Deploy previous version
pm2 start menu-app-frontend
```

2. **Scale Resources:**

```bash
# Scale Docker containers
docker-compose up -d --scale frontend=3

# With PM2
pm2 scale menu-app-frontend 4
```

## Performance Optimization

### CDN Configuration

1. Configure CDN for static assets
2. Set appropriate cache headers
3. Enable image optimization
4. Use WebP format for images

### Caching Strategy

1. **Browser Caching:**
   - Static assets: 1 year
   - API responses: Based on data freshness
   - Service Worker: No cache

2. **Server Caching:**
   - Configure Redis for session storage
   - Cache API responses appropriately
   - Use HTTP cache headers

### Database Optimization

1. Ensure proper indexing
2. Monitor query performance
3. Use connection pooling
4. Configure read replicas if needed

## Security Hardening

### Server Security

1. **Firewall Configuration:**
   - Only allow necessary ports (80, 443)
   - Block direct access to application port

2. **System Updates:**
   - Keep OS updated
   - Update Docker images regularly
   - Monitor security advisories

### Application Security

1. **Environment Variables:**
   - Never commit secrets to version control
   - Use secure secret management
   - Rotate keys regularly

2. **Dependencies:**
   - Audit dependencies regularly
   - Update to latest secure versions
   - Monitor for vulnerabilities

## Support and Documentation

- **Application Logs:** Check health endpoint and logs
- **Performance Metrics:** Monitor Core Web Vitals
- **Error Tracking:** Use Sentry for error monitoring
- **Uptime Monitoring:** Set up external monitoring

For additional support, refer to:
- [Nuxt.js Documentation](https://nuxt.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)