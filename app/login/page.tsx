'use client'

import { useState, Suspense } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('from') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const response = await apiClient.login(email, password)

    if (response.error) {
      setError(response.error)
      setLoading(false)
    } else {
      router.push(returnUrl)
    }
  }

  return (
    <div className="auth-container">
      <div className="panel">
        <div className="panel-title">SATI // Satellite Imagery Gateway - Login</div>

        <div className="ascii-logo">
          {`   _____ ___  _______ ____
  / ___//   |/_  __//  _/
  \\__ \\/ /| | / /   / /
 ___/ / ___ |/ /  _/ /
/____/_/  |_/_/  /___/

[SYSTEM READY]`}
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">EMAIL:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message">ERROR: {error}</div>}

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button type="submit" className="primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'AUTHENTICATING...' : '[LOGIN]'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px' }}>
          NO ACCOUNT? <Link href="/register">[REGISTER]</Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>[LOADING...]</div>}>
      <LoginForm />
    </Suspense>
  )
}
