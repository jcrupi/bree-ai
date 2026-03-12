# Test the TokenHouse Chat UI

## Quick Start (Single Command)

```bash
./start-demo.sh
```

This will start both:
- **Gateway** on http://localhost:8187
- **Chat UI** on http://localhost:6181

Then open http://localhost:6181 in your browser.

---

## Alternative: Manual Startup (Two Terminals)

If you prefer to run them separately:

### Terminal 1: Start Gateway

```bash
cd gateway
bun run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║                  DEMO ORG CREDENTIALS                       ║
╠════════════════════════════════════════════════════════════╣
║  Org ID:     org_demo123                                   ║
║  Secret:     ths_demo_secret_xyz789                        ║
╚════════════════════════════════════════════════════════════╝
🚀 TokenHouse Gateway running at 0.0.0.0:8187
```

### Terminal 2: Start Chat UI

```bash
cd examples/simple-chat
bun run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:6181/
  ➜  Network: use --host to expose
```

Then open http://localhost:6181

---

## What You'll See

### Chat Interface Features:
- 🏦 **TokenHouse Chat** header with gradient background
- 📊 **Real-time usage tracking** - tokens and cost displayed live
- 🎛️ **Model selector** - Switch between 4 AI models:
  - GPT-4o
  - GPT-4o Mini
  - Claude 3.5 Sonnet
  - Claude 3.5 Haiku
- 💬 **Chat interface** - Full conversation history
- ⚡ **Live responses** - AI responses appear in real-time

### Try These Test Messages:

1. **Simple greeting**: "Hello!"
2. **Technical question**: "What is multi-tenant architecture?"
3. **Code request**: "Write a hello world function in TypeScript"
4. **Comparison**: "Compare GPT-4o with Claude 3.5 Sonnet"

### Watch the Usage Counter:
Every message updates the usage display:
- **Tokens**: Total tokens consumed in this session
- **Cost**: Cumulative cost in USD (exact to 6 decimals)

---

## Troubleshooting

### Port 8187 already in use
```bash
# Find and kill the process
lsof -ti:8187 | xargs kill -9

# Or use a different port (update gateway/src/index.ts)
```

### Port 6181 already in use
```bash
# Find and kill the process
lsof -ti:6181 | xargs kill -9
```

### Chat UI can't connect to gateway
- Make sure gateway is running on port 8187
- Check browser console for errors
- Verify CORS is enabled (it should be by default)

### Authentication fails
- Gateway should auto-create demo org on startup
- Credentials are hardcoded in `examples/simple-chat/src/App.tsx`:
  - Org ID: `org_demo123`
  - Secret: `ths_demo_secret_xyz789`

### Models not working
The demo uses **mock responses** by default since it doesn't have real API keys.

To use real AI models:
1. Create `gateway/.env`:
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-key
   ANTHROPIC_API_KEY=sk-ant-your-actual-key
   JWT_SECRET=your-secret-key
   ```
2. Restart the gateway

---

## Behind the Scenes

When you send a message:

1. **Frontend** (React):
   - `useChat()` hook captures your message
   - Calls `client.chat()` with model and messages

2. **SDK** (@tokenhouse/core):
   - Gets JWT token (auto-refresh if expired)
   - POSTs to `/chat/completions` with Authorization header

3. **Gateway** (Elysia):
   - Validates JWT and extracts `org_id`
   - Proxies request to OpenAI or Anthropic with master key
   - Logs usage: org_id, model, tokens, cost
   - Returns response with cost calculation

4. **Frontend** (React):
   - Displays AI response
   - Updates token/cost counters
   - Adds message to chat history

---

## Next Steps

### Test the API Directly

```bash
# 1. Get a token
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{"org_id":"org_demo123","org_secret":"ths_demo_secret_xyz789"}'

# 2. Chat (replace YOUR_TOKEN with token from step 1)
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"Hello!"}]
  }'

# 3. Check usage
curl -X GET http://localhost:8187/usage/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Run the Test Script

```bash
# Build packages first (if not already built)
bun run build:packages

# Run test
bun run test-sdk.ts
```

This will test authentication, chat with both OpenAI and Claude, and display usage stats.

---

## Stopping the Servers

- **Single command mode**: Press `Ctrl+C` once to stop both
- **Manual mode**: Press `Ctrl+C` in each terminal window

---

Enjoy testing TokenHouse! 🚀
