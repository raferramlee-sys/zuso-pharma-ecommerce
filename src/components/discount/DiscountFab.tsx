/**
 * DiscountFab — floating discount code toggle + slide-up panel
 *
 * Fixed bottom-right on all public pages.
 * Tap → animated slide-up panel with code input.
 */
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useSellerDiscount } from '../../hooks/useSellerDiscount'

export default function DiscountFab() {
  const { sellerCode, discountPct, isActive, isLoading, applyCode, removeCode } = useSellerDiscount()
  const [isOpen, setIsOpen] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleApply(e: FormEvent) {
    e.preventDefault()
    if (!codeInput.trim()) return
    setError('')
    setApplying(true)
    const result = await applyCode(codeInput.trim())
    setApplying(false)
    if (!result.success) {
      setError(result.error || 'Invalid code')
    } else {
      setCodeInput('')
      setError('')
      // Auto-close after 1.5s on success
      setTimeout(() => setIsOpen(false), 1500)
    }
  }

  function handleRemove() {
    removeCode()
    setIsOpen(false)
  }

  // Don't render during initial load
  if (isLoading && !isActive) return null

  return (
    <>
      {/* ── Floating button ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 border ${
          isActive
            ? 'bg-green-600 border-green-400 shadow-green-500/30 animate-pulse'
            : 'bg-accent-500 border-accent-400 shadow-accent-500/30 hover:scale-105'
        }`}
        aria-label={isActive ? `${discountPct}% discount active` : 'Open discount code panel'}
      >
        {isActive ? (
          <>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-white text-sm font-semibold">-{discountPct}%</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-white text-sm font-semibold">Discount</span>
          </>
        )}
      </button>

      {/* ── Overlay backdrop ────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Slide-up panel ──────────────────────────────── */}
      <div
        ref={panelRef}
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-lg bg-pharma-900 border border-pharma-700/50 rounded-t-2xl shadow-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-pharma-600" />
          </div>

          <div className="px-6 pb-8 pt-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {isActive ? 'Discount Applied' : 'Got a discount code?'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-pharma-800 hover:bg-pharma-700 text-pharma-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isActive ? (
              /* ── Active state ─────────────────────────── */
              <div className="space-y-4">
                <div className="rounded-card bg-green-500/10 border border-green-500/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold">{discountPct}% discount active</p>
                      <p className="text-pharma-300 text-sm">Code: <span className="font-mono text-accent-400">{sellerCode}</span></p>
                    </div>
                  </div>
                  <p className="text-pharma-400 text-xs">
                    All product prices shown reflect your discount. It will be applied at checkout.
                  </p>
                </div>
                <button
                  onClick={handleRemove}
                  className="w-full py-3 rounded-btn bg-pharma-800 hover:bg-red-900/50 border border-pharma-700 hover:border-red-500/30 text-pharma-300 hover:text-red-400 font-medium transition-all"
                >
                  Remove Discount
                </button>
              </div>
            ) : (
              /* ── Input state ──────────────────────────── */
              <form onSubmit={handleApply} className="space-y-4">
                <p className="text-pharma-400 text-sm">
                  Enter a seller code to unlock exclusive discounts on all products.
                </p>

                <div>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase())
                      setError('')
                    }}
                    placeholder="e.g. PBTE3FAA"
                    maxLength={8}
                    className="w-full bg-pharma-950 border border-pharma-700 rounded-btn px-4 py-3.5 text-white text-lg font-mono tracking-widest text-center placeholder:text-pharma-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={applying || !codeInput.trim()}
                  className="w-full py-3.5 rounded-btn bg-accent-500 hover:bg-accent-600 disabled:bg-pharma-700 disabled:text-pharma-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {applying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Apply Discount'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
