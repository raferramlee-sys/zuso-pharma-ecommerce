import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerSeller } from '../lib/auth'

type FormErrors = {
  email?: string
  password?: string
  confirmPassword?: string
  phone?: string
  address?: string
  bank_name?: string
  bank_acc_number?: string
}

export default function SellerRegistrationPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    bank_name: '',
    bank_acc_number: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sellerCode, setSellerCode] = useState('')
  const [copied, setCopied] = useState(false)

  function validate(): boolean {
    const errs: FormErrors = {}

    if (!form.email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email format'
    }

    if (!form.password) {
      errs.password = 'Password is required'
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }

    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required'
    }

    if (!form.address.trim()) {
      errs.address = 'Address is required'
    }

    if (!form.bank_name.trim()) {
      errs.bank_name = 'Bank name is required'
    }

    if (!form.bank_acc_number.trim()) {
      errs.bank_acc_number = 'Bank account number is required'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    setSellerCode('')

    if (!validate()) return

    setLoading(true)
    try {
      const result = await registerSeller({
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
        bank_name: form.bank_name.trim(),
        bank_acc_number: form.bank_acc_number.trim(),
      })

      if ('error' in result) {
        setSubmitError(result.error)
        return
      }

      setSellerCode(result.seller.seller_code)

      // Auto-redirect after showing code
      setTimeout(() => {
        navigate('/seller-page')
      }, 5000)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(sellerCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback ignored
    }
  }

  const inputClass =
    'w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-colors'
  const labelClass = 'block text-sm font-medium text-pharma-300 mb-1.5'
  const errorClass = 'text-red-400 text-xs mt-1'

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white">Become a Zuso Partner</h1>
        <p className="mt-2 text-pharma-400 text-sm">
          Register as a seller and earn commissions on every order
        </p>
      </div>

      {/* Success state — seller code display */}
      {sellerCode ? (
        <div className="holographic-border rounded-card bg-pharma-850/50 glow-purple p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-pharma-300 text-sm mb-6">
            Your seller code is ready. Share this with your patients so they can order through you.
          </p>

          {/* Seller code display */}
          <div className="holographic-border rounded-btn bg-pharma-900 p-6 mb-4">
            <p className="text-xs text-pharma-400 uppercase tracking-wider mb-2">Your Seller Code</p>
            <p className="text-4xl sm:text-5xl font-black text-accent-400 tracking-[0.25em] select-all">
              {sellerCode}
            </p>
          </div>

          <button
            onClick={copyCode}
            className="px-6 py-2.5 rounded-btn bg-pharma-800 hover:bg-pharma-700 border border-pharma-600 text-pharma-200 text-sm font-medium transition-colors mb-2"
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>

          <p className="text-xs text-pharma-500 mt-3">
            Redirecting to your dashboard in a few seconds...
          </p>

          <Link
            to="/seller-page"
            className="inline-block mt-4 px-8 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        /* Registration form */
        <div className="holographic-border rounded-card bg-pharma-850/50 p-6 sm:p-8">
          {submitError && (
            <div className="mb-6 text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3 text-sm">
              {submitError}
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
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seller@example.com"
                className={`${inputClass} ${errors.email ? 'border-red-400/50 focus:border-red-400' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Min. 6 characters"
                className={`${inputClass} ${errors.password ? 'border-red-400/50 focus:border-red-400' : ''}`}
                autoComplete="new-password"
              />
              {errors.password && <p className={errorClass}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                className={`${inputClass} ${errors.confirmPassword ? 'border-red-400/50 focus:border-red-400' : ''}`}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+60 12-345 6789"
                className={`${inputClass} ${errors.phone ? 'border-red-400/50 focus:border-red-400' : ''}`}
                autoComplete="tel"
              />
              {errors.phone && <p className={errorClass}>{errors.phone}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className={labelClass}>
                Address
              </label>
              <textarea
                id="address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Your full address"
                rows={3}
                className={`${inputClass} resize-none ${errors.address ? 'border-red-400/50 focus:border-red-400' : ''}`}
                autoComplete="street-address"
              />
              {errors.address && <p className={errorClass}>{errors.address}</p>}
            </div>

            {/* Bank Name */}
            <div>
              <label htmlFor="bank_name" className={labelClass}>
                Bank Name
              </label>
              <input
                id="bank_name"
                type="text"
                value={form.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="e.g. Maybank, CIMB"
                className={`${inputClass} ${errors.bank_name ? 'border-red-400/50 focus:border-red-400' : ''}`}
              />
              {errors.bank_name && <p className={errorClass}>{errors.bank_name}</p>}
            </div>

            {/* Bank Account Number */}
            <div>
              <label htmlFor="bank_acc_number" className={labelClass}>
                Bank Account Number
              </label>
              <input
                id="bank_acc_number"
                type="text"
                value={form.bank_acc_number}
                onChange={(e) => handleChange('bank_acc_number', e.target.value)}
                placeholder="Your bank account number"
                className={`${inputClass} ${errors.bank_acc_number ? 'border-red-400/50 focus:border-red-400' : ''}`}
              />
              {errors.bank_acc_number && <p className={errorClass}>{errors.bank_acc_number}</p>}
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
                  Registering...
                </span>
              ) : (
                'Register as Seller'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-pharma-400 text-sm">
              Already have an account?{' '}
              <Link to="/seller-login" className="text-accent-400 hover:text-accent-300 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
