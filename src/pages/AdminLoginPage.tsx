import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginSeller, logoutSeller } from '../lib/auth'

export default function AdminLoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)

    const result = await loginSeller(email.trim(), password)

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Check if admin
    if (!result.seller.is_admin) {
      await logoutSeller()
      setError('Access denied — admin only')
      setLoading(false)
      return
    }

    // Redirect to admin dashboard
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-pharma-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Zuso Pharma</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-pharma-400 text-sm mt-1">Restricted access — authorized personnel only</p>
        </div>

        {/* Login Form */}
        <div className="holographic-border rounded-card p-8 bg-pharma-850/50">
          {error && (
            <div className="text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-pharma-300 mb-1.5 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@zusopharma.com"
                className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-sm font-medium text-pharma-300 mb-1.5 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
