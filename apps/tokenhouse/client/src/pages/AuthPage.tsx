import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth'
import { Button, Input } from '../components/ui'
import { Zap } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        })
        if (error) throw new Error(error.message)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0a0a0f 60%)' }}>

      {/* Background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#6c63ff 1px, transparent 1px), linear-gradient(90deg, #6c63ff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #00d4aa)' }}>
              <Zap size={20} fill="white" color="white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Token House</span>
          </div>
          <p className="text-sm text-th-text-secondary">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Form card */}
        <div className="glass-elevated p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Input
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Your name"
                disabled={loading}
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              disabled={loading}
            />

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-th-text-secondary">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button onClick={() => setMode('signup')} className="text-th-accent hover:underline">
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('signin')} className="text-th-accent hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Free tier callout */}
        {mode === 'signup' && (
          <p className="text-center text-xs text-th-text-muted mt-4">
            🎁 New accounts receive <span className="text-th-accent">1,000 free tokens</span>
          </p>
        )}
      </div>
    </div>
  )
}
