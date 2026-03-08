import { useState, useEffect } from 'react'
import { authClient } from '../lib/auth'

export function useJwtToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (!session?.user) {
      setToken(null)
      setLoading(false)
      return
    }

    let cancelled = false

    authClient.token().then(({ data }) => {
      if (!cancelled) {
        setToken(data?.token ?? null)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [session?.user?.id])

  return { token, loading }
}
