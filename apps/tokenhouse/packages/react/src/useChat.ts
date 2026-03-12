import { useState } from 'react'
import { useTokenHouse } from './provider'
import type { ChatMessage } from '@tokenhouse/core'

export function useChat() {
  const { client } = useTokenHouse()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [usage, setUsage] = useState({ tokens: 0, cost: 0 })

  async function sendMessage(content: string, model: string = 'gpt-4o') {
    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await client.chat({
        model,
        messages: [...messages, userMessage]
      })

      const assistantMessage = response.choices[0].message
      setMessages(prev => [...prev, assistantMessage])

      setUsage(prev => ({
        tokens: prev.tokens + response.usage.total_tokens,
        cost: prev.cost + response.cost_usd
      }))
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  async function *streamMessage(content: string, model: string = 'gpt-4o') {
    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    let assistantContent = ''

    try {
      for await (const chunk of client.chatStream({
        model,
        messages: [...messages, userMessage]
      })) {
        assistantContent += chunk
        yield chunk
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assistantContent }
      ])
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setUsage({ tokens: 0, cost: 0 })
    setError(null)
  }

  return {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    streamMessage,
    reset
  }
}
