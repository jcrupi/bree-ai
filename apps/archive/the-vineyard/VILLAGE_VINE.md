# Village Vine - Real-Time NATS Messaging

## Overview

Village Vine is a real-time peer-to-peer messaging system built on NATS for instant collaboration between users in the-vineyard application.

## Features

### ✅ Real-Time Communication

- **NATS Pub/Sub Integration** - Messages are published and subscribed via NATS subjects
- **Server-Sent Events (SSE)** - Real-time message streaming from backend to frontend
- **Auto-Reconnection** - Automatic reconnection with exponential backoff on connection loss
- **Optimistic Updates** - Immediate UI feedback with background NATS sync

### ✅ Invite System

- **Name-Based Invites** - Invite users by name
- **Shareable Links** - Generate unique invite URLs with invitee name embedded
- **One-Click Join** - Recipients click link and auto-join the vine

### ✅ Connection Monitoring

- **Live Status Indicators** - Real-time NATS connection status in header
- **Message Counter** - Track conversation activity
- **Connection Health** - Visual feedback when connection is lost/restored

## Architecture

### Backend (`/apps/api/src/index.ts`)

#### Endpoints

**POST `/api/village/start`**

- Creates a new village vine
- Publishes creation event to NATS: `village.vines.created`
- Returns vineId and topic

**POST `/api/village/:id/message`**

- Sends message to specific vine
- Publishes to NATS subject: `village.vine.{vineId}.messages`
- Returns success status

**GET `/api/village/:id/events`**

- SSE endpoint for real-time message streaming
- Subscribes to NATS subject: `village.vine.{vineId}.messages`
- Sends keepalive pings every 30 seconds
- Auto-cleanup on disconnect

**GET `/api/village/:id/messages`**

- Polling fallback for message retrieval
- Returns message history (currently empty, relies on real-time)

### Frontend

#### Hook: `useVillageVine`

Custom React hook managing NATS connection lifecycle:

```typescript
const {
  isConnected, // Connection status
  messages, // Real-time message array
  sendMessage, // Send message function
  createVine, // Create new vine function
  reconnect, // Manual reconnect function
} = useVillageVine({
  vineId: "village-123",
  onMessage: (msg) => console.log("New message:", msg),
  onError: (err) => console.error("Error:", err),
});
```

**Features:**

- EventSource-based SSE connection
- Automatic reconnection on error (5s delay)
- Message queueing and deduplication
- Optimistic UI updates

#### Page: `VillageVinesPage`

Main UI component with:

- Vine creation modal
- Real-time chat interface
- Invite link generation
- Connection status indicators
- Message history display

## NATS Message Flow

### Creating a Vine

```
User → POST /api/village/start
     → NATS publish: village.vines.created
     → Return vineId
```

### Sending a Message

```
User → POST /api/village/:id/message
     → NATS publish: village.vine.{id}.messages
     → All subscribers receive message
     → UI updates via SSE
```

### Receiving Messages

```
Browser → GET /api/village/:id/events (SSE)
        → Backend subscribes to NATS: village.vine.{id}.messages
        → New message published
        → SSE streams to browser
        → useVillageVine hook updates state
        → UI re-renders
```

## Usage

### Creating a Vine

1. Click "Village Vine" in sidebar
2. Click "Create New Vine"
3. Enter topic and invitee name
4. Click "Generate NATS Invite Link"
5. Share generated link with invitee

### Joining a Vine

1. Click invite link (e.g., `/village-vine?invitee=Johnny`)
2. Auto-creates vine session
3. Start chatting immediately

### Sending Messages

1. Type message in input field
2. Press Enter or click Send button
3. Message sent via NATS
4. Appears in chat for all participants

## Environment Variables

```bash
# NATS Configuration (in /apps/api/.env)
NATS_URL=nats://localhost:4222
NATS_USER=optional_username
NATS_PASSWORD=optional_password
NATS_TOKEN=optional_token
```

## Development

### Running Locally

1. **Start NATS Server**

```bash
docker run -p 4222:4222 nats:latest
```

2. **Start API Server**

```bash
cd apps/api
bun run dev
```

3. **Start Frontend**

```bash
cd apps/the-vineyard
bun run dev
```

4. **Open Browser**

```
http://localhost:5173/village-vine
```

## Production Deployment

### NATS Setup

- Use NATS cluster for high availability
- Enable JetStream for message persistence
- Configure TLS for secure communication

### API Configuration

- Set `NATS_URL` to production NATS cluster
- Enable authentication with `NATS_USER`/`NATS_PASSWORD`
- Configure CORS for frontend domain

### Frontend Build

```bash
cd apps/the-vineyard
bun run build
```

## Future Enhancements

### Planned Features

- [ ] Message persistence with JetStream
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File sharing
- [ ] Voice/video calls
- [ ] Group vines (3+ participants)
- [ ] Message reactions
- [ ] Search and filtering
- [ ] Notification system
- [ ] Mobile app support

### Technical Improvements

- [ ] WebSocket fallback for SSE
- [ ] Message encryption (E2E)
- [ ] Rate limiting
- [ ] Message pagination
- [ ] Offline support with service workers
- [ ] Analytics and monitoring

## Troubleshooting

### Connection Issues

**Problem:** "NATS: Disconnected" in header

**Solutions:**

1. Check NATS server is running
2. Verify `NATS_URL` environment variable
3. Check network connectivity
4. Review browser console for errors

### Messages Not Appearing

**Problem:** Messages sent but not received

**Solutions:**

1. Verify SSE connection is active
2. Check NATS subscription is working
3. Review backend logs for errors
4. Ensure vineId matches on both ends

### Invite Links Not Working

**Problem:** Link doesn't auto-create vine

**Solutions:**

1. Check URL parameter format
2. Verify backend `/api/village/start` endpoint
3. Review browser console for errors
4. Check NATS publish is successful

## License

MIT
