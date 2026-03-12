# TokenHouse Port Configuration

## Current Port Setup

- **Gateway Server**: http://localhost:8187
- **Chat UI**: http://localhost:6181

## Quick Start

```bash
./start-demo.sh
```

Then open: http://localhost:6181

## Test URLs

### Gateway Health Check
```bash
curl http://localhost:8187/
```

### Authentication
```bash
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{"org_id":"org_demo123","org_secret":"ths_demo_secret_xyz789"}'
```

### Chat UI
Open in browser: http://localhost:6181

## Configuration Files

Ports are configured in:
- `gateway/src/index.ts` → Line: `.listen(8187)`
- `examples/simple-chat/vite.config.ts` → `server.port: 6181`
- `examples/simple-chat/src/App.tsx` → `baseUrl: 'http://localhost:8187'`

## Change Ports

To use different ports:

1. **Gateway**: Edit `gateway/src/index.ts`
   ```typescript
   .listen(YOUR_PORT)
   ```

2. **Chat UI**: Edit `examples/simple-chat/vite.config.ts`
   ```typescript
   server: {
     port: YOUR_PORT
   }
   ```

3. **Update baseUrl**: Edit `examples/simple-chat/src/App.tsx`
   ```typescript
   baseUrl: 'http://localhost:YOUR_GATEWAY_PORT'
   ```
