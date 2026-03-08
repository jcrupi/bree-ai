import { useState, useEffect, useCallback } from 'react'
import { useJwtToken } from './useJwtToken'

interface WalletData {
  balance: number
  planTier: string
  monthlyBudget: number | null
  allowedModels: string[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function useWallet() {
  const { token } = useJwtToken()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWallet = useCallback(async () => {
    if (!token) { setLoading(false); return }

    try {
      const res = await fetch(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setWallet(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  const purchaseCredits = async (packageId: string) => {
    if (!token) return null

    const res = await fetch(`${API_URL}/api/wallet/purchase`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packageId }),
    })

    const data = await res.json()
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl
    }
    return data
  }

  return { wallet, loading, error, refetch: fetchWallet, purchaseCredits }
}
