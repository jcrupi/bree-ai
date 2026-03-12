import { useState, useEffect } from 'react'
import { useTokenHouse } from './provider'
import type { UsageStats } from '@tokenhouse/core'

export function useUsage(params?: {
  start_date?: string
  end_date?: string
  model?: string
  refreshInterval?: number
}) {
  const { client } = useTokenHouse()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  async function refresh() {
    setIsLoading(true)
    setError(null)

    try {
      const data = await client.getUsage(params)
      setStats(data)
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()

    if (params?.refreshInterval) {
      const interval = setInterval(refresh, params.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [params?.start_date, params?.end_date, params?.model])

  return {
    stats,
    isLoading,
    error,
    refresh
  }
}
