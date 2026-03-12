/**
 * TokenHouse SDK Test Script
 *
 * This script demonstrates how to use the @tokenhouse/core SDK to:
 * 1. Authenticate with the gateway
 * 2. Make chat completion requests
 * 3. Retrieve usage statistics
 *
 * Prerequisites:
 * 1. Gateway must be running on http://localhost:8187
 * 2. Run: bun run build:packages first
 *
 * Usage:
 *   bun run test-sdk.ts
 */

import { TokenHouseClient } from './packages/core/dist/index.js'

async function main() {
  console.log('🏦 TokenHouse SDK Test\n')

  // Initialize client with demo credentials
  const client = new TokenHouseClient({
    orgId: 'org_demo123',
    orgSecret: 'ths_demo_secret_xyz789',
    baseUrl: 'http://localhost:8187',
    onTokenRefresh: (token) => {
      console.log('✅ Token refreshed successfully\n')
    }
  })

  try {
    // Step 1: Authenticate
    console.log('Step 1: Authenticating...')
    const token = await client.authenticate()
    console.log(`✅ Authenticated! Token: ${token.substring(0, 50)}...\n`)

    // Step 2: Test chat with GPT-4o Mini
    console.log('Step 2: Testing chat completion with GPT-4o Mini...')
    const gptResponse = await client.chat({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Keep responses concise.' },
        { role: 'user', content: 'What is TokenHouse?' }
      ],
      temperature: 0.7,
      max_tokens: 100
    })

    console.log('🤖 GPT-4o Mini Response:')
    console.log(`   ${gptResponse.choices[0].message.content}`)
    console.log(`\n📊 Usage:`)
    console.log(`   Prompt tokens: ${gptResponse.usage.prompt_tokens}`)
    console.log(`   Completion tokens: ${gptResponse.usage.completion_tokens}`)
    console.log(`   Total tokens: ${gptResponse.usage.total_tokens}`)
    console.log(`   Cost: $${gptResponse.cost_usd.toFixed(6)}\n`)

    // Step 3: Test chat with Claude Haiku
    console.log('Step 3: Testing chat completion with Claude 3.5 Haiku...')
    const claudeResponse = await client.chat({
      model: 'claude-3-5-haiku-20241022',
      messages: [
        { role: 'user', content: 'Explain multi-tenant SaaS in one sentence.' }
      ],
      temperature: 0.5,
      max_tokens: 50
    })

    console.log('🤖 Claude 3.5 Haiku Response:')
    console.log(`   ${claudeResponse.choices[0].message.content}`)
    console.log(`\n📊 Usage:`)
    console.log(`   Prompt tokens: ${claudeResponse.usage.prompt_tokens}`)
    console.log(`   Completion tokens: ${claudeResponse.usage.completion_tokens}`)
    console.log(`   Total tokens: ${claudeResponse.usage.total_tokens}`)
    console.log(`   Cost: $${claudeResponse.cost_usd.toFixed(6)}\n`)

    // Step 4: Get usage statistics
    console.log('Step 4: Retrieving usage statistics...')
    const today = new Date().toISOString().split('T')[0]
    const stats = await client.getUsage({
      start_date: today,
      end_date: today
    })

    console.log('📊 Usage Statistics:')
    console.log(`   Period: ${stats.period.start} to ${stats.period.end}`)
    console.log(`   Total requests: ${stats.totals.requests}`)
    console.log(`   Total tokens: ${stats.totals.total_tokens}`)
    console.log(`   Total cost: $${stats.totals.cost_usd.toFixed(6)}`)

    if (Object.keys(stats.by_model).length > 0) {
      console.log(`\n   By Model:`)
      for (const [model, data] of Object.entries(stats.by_model)) {
        console.log(`     ${model}:`)
        console.log(`       Requests: ${data.requests}`)
        console.log(`       Tokens: ${data.tokens}`)
        console.log(`       Cost: $${data.cost_usd.toFixed(6)}`)
      }
    }

    console.log('\n✅ All tests passed!')
    console.log('\n💡 Next steps:')
    console.log('   - Try the example chat app: bun run dev:chat')
    console.log('   - Review the SDK documentation: SDK_README.md')
    console.log('   - Explore the AgentX design: agentx/apps/tokenhouse-starter-sdk-org-tracking.agentx.md')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    console.log('\n💡 Make sure the gateway is running:')
    console.log('   cd gateway && bun run dev')
    process.exit(1)
  }
}

main()
