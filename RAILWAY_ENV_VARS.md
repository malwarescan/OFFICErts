# Railway Environment Variables

This document lists all the environment variables required for each service.

## Database Service (PostgreSQL)

Railway will automatically provision this. The `DATABASE_URL` will be automatically set for services that reference it.

## Redis Service

Railway will automatically provision this. The `REDIS_URL` will be automatically set for services that reference it.

## API Service (`@office-rts/api`)

Required environment variables:

- `PORT` - Automatically set by Railway (default: 3001 in code)
- `DATABASE_URL` - Reference the PostgreSQL database service
- `REDIS_URL` - Reference the Redis service
- `JWT_SECRET` - Set to a secure random string (min 32 characters)
  - Generate with: `openssl rand -base64 32`
- `CORS_ORIGIN` - Set to your frontend URL or `*` for development
- `REALTIME_URL` - Set to your realtime service URL (e.g., `wss://your-realtime-service.railway.app`)
- `APP_URL` - Set to your web app URL (e.g., `https://your-web-app.railway.app`)

## Realtime Service (`@office-rts/realtime`)

Required environment variables:

- `PORT` - Automatically set by Railway (default: 3002 in code)
- `REDIS_URL` - Reference the Redis service

## Web Service (`@office-rts/web`)

Required environment variables:

- `PORT` - Automatically set by Railway
- `NEXT_PUBLIC_API_URL` - Set to your API service URL (e.g., `https://your-api-service.railway.app`)
- `NEXT_PUBLIC_WS_URL` - Set to your realtime service URL (e.g., `wss://your-realtime-service.railway.app`)

## Worker Service (`@office-rts/worker`)

Required environment variables:

- `DATABASE_URL` - Reference the PostgreSQL database service
- `REDIS_URL` - Reference the Redis service

## Setup Order

1. **Create services in this order:**
   - PostgreSQL database
   - Redis
   - API service
   - Realtime service
   - Worker service
   - Web service

2. **Configure service references:**
   - Link PostgreSQL to: API, Worker
   - Link Redis to: API, Realtime, Worker

3. **Set manual environment variables:**
   - Generate and set `JWT_SECRET` for API
   - After deploying services, update cross-service URLs (CORS_ORIGIN, REALTIME_URL, APP_URL, etc.)

## Generating Secure Secrets

```bash
# JWT_SECRET (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Railway Service Configuration

Each service should be configured to build from the monorepo root with the specific start command for that service. The `railway.json` files in each app directory handle this automatically.
