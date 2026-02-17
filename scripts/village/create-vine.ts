#!/usr/bin/env bun

// Minimal Village Vine Creator (No external dependencies)
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: bun scripts/village/create-vine.ts <topic> <invitee> [apiUrl] [token]');
  process.exit(1);
}

const topic = args[0];
const invitee = args[1];
const url = args[2] || 'https://bree-api.fly.dev';
const token = args[3];

async function createVine() {
  console.log(`🌿 Creating Village Vine: "${topic}"...`);

  try {
    const response = await fetch(`${url}/api/village/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        topic,
        invited: [invitee]
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Failed to create vine:', result.error || 'Unknown error');
      process.exit(1);
    }

    console.log('\n✅ Village Vine Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:      ${result.vineId}`);
    console.log(`Topic:   ${result.topic}`);
    console.log(`Invitee: ${invitee}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 Invite Link:');
    console.log(`https://the-vineyard.fly.dev/village-vine?invitee=${encodeURIComponent(invitee)}`);
    console.log('\n👉 To join this vine from terminal, run:');
    console.log(`bun scripts/village/join-vine.ts ${result.vineId} "YourName"`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createVine();
