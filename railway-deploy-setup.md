# Railway Deploy Setup for OFFICErts

## Migration Strategy

**Single Runner Migration Pattern**: `prisma migrate deploy` runs exactly once per deployment from the `api` service.

## Railway Service Configuration

### API Service (Migration Runner)
- **Build Command**: `pnpm --filter @office-rts/api build`
- **Start Command**: `sh -c "cd packages/db && pnpm prisma:migrate:deploy && cd ../../ && pnpm --filter @office-rts/api start"`

### Other Services
- **Web**: `pnpm --filter @office-rts/web build` + `pnpm --filter @office-rts/web start`
- **Realtime**: `pnpm --filter @office-rts/realtime build` + `pnpm --filter @office-rts/realtime start`
- **Worker**: `pnpm --filter @office-rts/worker build` + `pnpm --filter @office-rts/worker start`

## Environment Variables (All Services)
```
DATABASE_URL=postgresql://postgres:password@host:5432/office_rts?schema=public
REDIS_URL=redis://host:port
JWT_SECRET=your-jwt-secret
REALTIME_URL=wss://realtime-service-url.railway.app
APP_URL=https://web-service-url.railway.app
CORS_ORIGIN=https://web-service-url.railway.app
OPENAI_API_KEY=sk-... (worker only)
```

## Migration Files Applied
- `20260205033037_init`: Core schema with all models
- `20260205033113_constraints`: Message author XOR constraint

## Verification
- Migrations committed to git (no secrets)
- `prisma migrate deploy` script available in `packages/db/package.json`
- API service configured to run migrations on startup
- All services typecheck and build successfully
