import React, { createContext, useContext, useState, useEffect } from 'react'
import { TokenHouseClient, type TokenHouseConfig } from '@tokenhouse/core'

interface TokenHouseContextValue {
  client: TokenHouseClient
  isAuthenticated: boolean
  error: Error | null
}

const TokenHouseContext = createContext<TokenHouseContextValue | null>(null)

export function TokenHouseProvider({
  children,
  config
}: {
  children: React.ReactNode
  config: TokenHouseConfig
}) {
  const [client] = useState(() => new TokenHouseClient(config))
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    client.authenticate()
      .then(() => setIsAuthenticated(true))
      .catch(setError)
  }, [client])

  return (
    <TokenHouseContext.Provider value={{ client, isAuthenticated, error }}>
      {children}
    </TokenHouseContext.Provider>
  )
}

export function useTokenHouse() {
  const context = useContext(TokenHouseContext)
  if (!context) {
    throw new Error('useTokenHouse must be used within TokenHouseProvider')
  }
  return context
}
