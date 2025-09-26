'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const response = await apiClient.register(email, password)

    if (response.error) {
      setError(response.error)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="panel">
          <div className="panel-title">
            SATI // Registration Successful
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="success-message" style={{ fontSize: '14px', marginBottom: '16px' }}>
              REGISTRATION COMPLETE!
            </div>
            <p style={{ marginBottom: '16px' }}>
              Please check your email to verify your account.
            </p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              You may need to check your spam folder.
            </p>
            <div style={{ marginTop: '20px' }}>
              <Link href="/login">
                <button className="primary">[RETURN TO LOGIN]</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="panel">
        <div className="panel-title">
          SATI // New User Registration
        </div>

        <div className="ascii-logo">
{`   _____ ___  _______ ____
  / ___//   |/_  __//  _/
  \\__ \\/ /| | / /   / /
 ___/ / ___ |/ /  _/ /
/____/_/  |_/_/  /___/

[CREATE ACCOUNT]`}
        </div>

        <form onSubmit={handleRegister}>
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
              placeholder="Min 6 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">CONFIRM PASSWORD:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <div className="error-message">
              ERROR: {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              type="submit"
              className="primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'PROCESSING...' : '[CREATE ACCOUNT]'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px' }}>
          ALREADY HAVE AN ACCOUNT? <Link href="/login">[LOGIN]</Link>
        </div>
      </div>
    </div>
  )
}