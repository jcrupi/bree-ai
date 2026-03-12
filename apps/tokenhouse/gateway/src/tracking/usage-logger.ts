interface UsageLog {
  org_id: string
  usage_tracking_id: string
  provider: 'openai' | 'anthropic'
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  cost_usd: number
  timestamp: Date
}

// In-memory storage (replace with database in production)
const usageLogs: UsageLog[] = []

export async function logUsage(log: Omit<UsageLog, 'timestamp'>) {
  const entry: UsageLog = {
    ...log,
    timestamp: new Date()
  }

  usageLogs.push(entry)

  console.log(`[USAGE] Org: ${log.org_id} | Model: ${log.model} | Tokens: ${log.total_tokens} | Cost: $${log.cost_usd.toFixed(6)}`)

  // In production: Save to database and publish to NATS
  // await db.usage_logs.insertOne(entry)
  // await nats.publish('usage.logged', JSON.stringify(entry))
}

export async function getUsageStats(params: {
  org_id: string
  start_date: string
  end_date: string
  model?: string
}) {
  const startDate = new Date(params.start_date)
  const endDate = new Date(params.end_date)
  endDate.setHours(23, 59, 59, 999)

  // Filter logs for this org and date range
  const logs = usageLogs.filter(log => {
    const matchesOrg = log.org_id === params.org_id
    const inDateRange = log.timestamp >= startDate && log.timestamp <= endDate
    const matchesModel = !params.model || log.model === params.model

    return matchesOrg && inDateRange && matchesModel
  })

  // Calculate totals
  const totals = logs.reduce((acc, log) => ({
    requests: acc.requests + 1,
    prompt_tokens: acc.prompt_tokens + log.prompt_tokens,
    completion_tokens: acc.completion_tokens + log.completion_tokens,
    total_tokens: acc.total_tokens + log.total_tokens,
    cost_usd: acc.cost_usd + log.cost_usd
  }), {
    requests: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    cost_usd: 0
  })

  // Group by model
  const by_model: Record<string, any> = {}
  logs.forEach(log => {
    if (!by_model[log.model]) {
      by_model[log.model] = { requests: 0, tokens: 0, cost_usd: 0 }
    }
    by_model[log.model].requests += 1
    by_model[log.model].tokens += log.total_tokens
    by_model[log.model].cost_usd += log.cost_usd
  })

  // Daily breakdown
  const dailyMap = new Map<string, { tokens: number; cost_usd: number }>()
  logs.forEach(log => {
    const date = log.timestamp.toISOString().split('T')[0]
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { tokens: 0, cost_usd: 0 })
    }
    const day = dailyMap.get(date)!
    day.tokens += log.total_tokens
    day.cost_usd += log.cost_usd
  })

  const daily_breakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    org_id: params.org_id,
    period: {
      start: params.start_date,
      end: params.end_date
    },
    totals,
    by_model,
    daily_breakdown
  }
}
