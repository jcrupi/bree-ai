#!/usr/bin/env bun
import readline from 'readline';

// Minimal Village Vine Joiner via WebSocket (No external dependencies)
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: bun scripts/village/join-vine.ts <vineId> <senderName> [apiUrl] [token]');
  process.exit(1);
}

const vineId = args[0];
const sender = args[1];
const url = args[2] || 'https://bree-api.fly.dev';
const token = args[3];

console.log(`\n🌿 Joining Village Vine: ${vineId} as "${sender}"...`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '💬 > '
});

let ws: WebSocket | null = null;

// 1. Connect to WebSocket for real-time messages
function connectWS() {
  try {
    const wsUrl = url.replace(/^http/, 'ws') + `/api/village/${vineId}/ws`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      process.stdout.write('\r\x1b[K'); 
      console.log('✅ Connected to real-time WebSocket. Type a message and hit Enter.\n');
      rl.prompt();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        if (data.type === 'message') {
          // Clear line to avoid overlapping with prompt
          process.stdout.write('\r\x1b[K'); 
          console.log(`👤 ${data.sender}: ${data.content}`);
          rl.prompt(true);
        }
      } catch (e) {
        // Not JSON
      }
    };

    ws.onclose = () => {
      process.stdout.write('\r\x1b[K'); 
      console.log('🔌 WebSocket disconnected. Reconnecting in 5 seconds...');
      setTimeout(connectWS, 5000);
    };

    ws.onerror = (err) => {
      process.stdout.write('\r\x1b[K'); 
      console.error('❌ WebSocket Error:', err);
    };
  } catch (error: any) {
    console.error('\n❌ Connection Error:', error.message);
    setTimeout(connectWS, 5000);
  }
}

// 2. Handle user input
rl.on('line', async (line) => {
  const content = line.trim();
  if (!content) {
    rl.prompt();
    return;
  }

  if (content === '/exit' || content === '/quit') {
    process.exit(0);
  }

  // Try to send via WebSocket if available
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      sender,
      content
    }));
    rl.prompt();
  } else {
    // Fallback to HTTP POST
    try {
      const response = await fetch(`${url}/api/village/${vineId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sender, content })
      });

      const result = await response.json();
      if (!result.success) {
        process.stdout.write('\r\x1b[K');
        console.error('❌ Failed to send:', result.error);
      }
    } catch (error: any) {
      process.stdout.write('\r\x1b[K');
      console.error('❌ Network Error:', error.message);
    }
    rl.prompt();
  }
});

// Start connection
connectWS();
