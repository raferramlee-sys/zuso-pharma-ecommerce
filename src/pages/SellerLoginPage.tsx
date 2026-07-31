import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginSeller } from '../lib/auth'

export default function SellerLoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      const result = await loginSeller(email.trim(), password)

      if ('error' in result) {
        setError(result.error)
        return
      }

      navigate('/seller-page')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-colors'
  const labelClass = 'block text-sm font-medium text-pharma-300 mb-1.5'

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-accent-500">PHARMA</span>
              <span className="text-white/80">.zuso</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Seller Sign In</h1>
          <p className="mt-2 text-pharma-400 text-sm">
            Access your seller dashboard to manage orders
          </p>
        </div>

        {/* Login card */}
        <div className="holographic-border rounded-card bg-pharma-850/50 glow-purple p-6 sm:p-8">
          {error && (
            <div className="mb-6 text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@example.com"
                className={inputClass}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={inputClass}
                autoComplete="current-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-btn bg-accent-500 hover:bg-accent-600 disabled:bg-accent-600/50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-pharma-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link
                to="/seller-registration"
                className="text-accent-400 hover:text-accent-300 transition-colors font-medium"
              >
                Register as seller
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
