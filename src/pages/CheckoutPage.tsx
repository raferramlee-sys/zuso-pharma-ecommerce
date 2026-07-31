import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { lookupSellerCode, submitOrder, uploadReceipt, notifyNewOrder } from '../lib/api'
import type { CartItem, Seller } from '../types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()

  // Form state
  const [patientName, setPatientName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientAddress, setPatientAddress] = useState('')

  // Seller code state
  const [sellerCode, setSellerCode] = useState('')
  const [appliedSeller, setAppliedSeller] = useState<Seller | null>(null)
  const [sellerCodeError, setSellerCodeError] = useState('')
  const [sellerLoading, setSellerLoading] = useState(false)

  // Receipt state
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Computed totals
  const discountPct = appliedSeller?.discount_pct ?? 0
  const discountMyr = Math.round(subtotal * (discountPct / 100))
  const commissionPct = appliedSeller?.commission_pct ?? 0
  const commissionMyr = Math.round((subtotal - discountMyr) * (commissionPct / 100))
  const totalMyr = subtotal - discountMyr

  // Apply seller code
  const handleApplySellerCode = async () => {
    const code = sellerCode.trim()
    if (!code) {
      setSellerCodeError('Please enter a seller code')
      return
    }
    setSellerLoading(true)
    setSellerCodeError('')

    const seller = await lookupSellerCode(code)
    if (!seller) {
      setSellerCodeError('Invalid seller code')
      setAppliedSeller(null)
    } else {
      setAppliedSeller(seller)
    }
    setSellerLoading(false)
  }

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setReceiptFile(file)
  }

  // Place order
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!patientName.trim()) { setError('Patient name is required'); return }
    if (!patientEmail.trim()) { setError('Email is required'); return }
    if (!patientAddress.trim()) { setError('Address is required'); return }

    setSubmitting(true)

    try {
      // Submit the order
      const result = await submitOrder({
        seller_code: appliedSeller?.seller_code ?? '',
        patient_name: patientName.trim(),
        patient_email: patientEmail.trim(),
        patient_phone: patientPhone.trim(),
        patient_address: patientAddress.trim(),
        items: items as CartItem[],
        subtotal_myr: subtotal,
        discount_pct: discountPct,
        discount_myr: discountMyr,
        total_myr: totalMyr,
        commission_pct: commissionPct,
        commission_myr: commissionMyr,
      })

      if ('error' in result) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      const order = result

      // Upload receipt if provided
      if (receiptFile) {
        await uploadReceipt(order.id, receiptFile)
      }

      // Notify seller and admin
      const sellerEmail = appliedSeller?.email ?? 'admin@zusopharma.com'
      await notifyNewOrder(order, sellerEmail)

      // Clear cart and show success
      clearCart()
      setSuccess(true)

      // Navigate to success page
      setTimeout(() => {
        navigate('/checkout/success')
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order'
      setError(msg)
    }

    setSubmitting(false)
  }

  // ─── Empty cart state ───
  if (items.length === 0 && !success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="holographic-border rounded-card p-12 bg-pharma-850/30">
          <svg className="w-20 h-20 text-pharma-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-pharma-400 text-sm mb-6">Add some peptide therapy products before checking out.</p>
          <Link
            to="/products"
            className="inline-flex px-6 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  // ─── Success state ───
  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="holographic-border rounded-card p-12 bg-pharma-850/30">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Order Placed!</h1>
          <p className="text-pharma-300 text-sm mb-2">Your order has been submitted successfully.</p>
          <p className="text-pharma-400 text-xs">Redirecting to confirmation...</p>
        </div>
      </div>
    )
  }

  // ─── Checkout form ───
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          {/* Patient Information */}
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Patient Information</h2>

            {/* Patient Name */}
            <div className="mb-4">
              <label htmlFor="patientName" className="text-sm font-medium text-pharma-300 mb-1.5 block">
                Patient Name <span className="text-red-400">*</span>
              </label>
              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="Full name as per IC/Passport"
                className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="patientEmail" className="text-sm font-medium text-pharma-300 mb-1.5 block">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="patientEmail"
                type="email"
                value={patientEmail}
                onChange={e => setPatientEmail(e.target.value)}
                placeholder="patient@email.com"
                className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="patientPhone" className="text-sm font-medium text-pharma-300 mb-1.5 block">
                Phone
              </label>
              <input
                id="patientPhone"
                type="tel"
                value={patientPhone}
                onChange={e => setPatientPhone(e.target.value)}
                placeholder="+60 12-345 6789"
                className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="patientAddress" className="text-sm font-medium text-pharma-300 mb-1.5 block">
                Address <span className="text-red-400">*</span>
              </label>
              <textarea
                id="patientAddress"
                value={patientAddress}
                onChange={e => setPatientAddress(e.target.value)}
                placeholder="Shipping address"
                rows={3}
                className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors resize-none"
                required
              />
            </div>
          </div>

          {/* Seller Code */}
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Seller Code (optional)</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={sellerCode}
                onChange={e => setSellerCode(e.target.value)}
                placeholder="Enter seller code"
                className="flex-1 bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none transition-colors uppercase"
                disabled={!!appliedSeller}
              />
              <button
                type="button"
                onClick={handleApplySellerCode}
                disabled={sellerLoading || !!appliedSeller}
                className="px-6 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sellerLoading ? 'Checking...' : appliedSeller ? 'Applied' : 'Apply'}
              </button>
            </div>

            {/* Seller code feedback */}
            {sellerCodeError && (
              <p className="text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3 mt-3 text-sm">
                ❌ {sellerCodeError}
              </p>
            )}
            {appliedSeller && (
              <p className="text-green-400 bg-green-400/10 border border-green-400/20 rounded p-3 mt-3 text-sm">
                ✅ Seller code applied — {appliedSeller.discount_pct}% off!
              </p>
            )}
          </div>

          {/* Bank Transfer Info */}
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Bank Transfer</h2>
            <div className="bg-pharma-900/60 border border-pharma-700/50 rounded-btn p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-pharma-400">Bank</span>
                <span className="text-white font-medium">Maybank</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pharma-400">Account Number</span>
                <span className="text-white font-medium">1234567890</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pharma-400">Account Name</span>
                <span className="text-white font-medium">Leverage Medical Sdn Bhd</span>
              </div>
              <p className="text-xs text-pharma-500 mt-2">
                Please upload your payment receipt below. Your order will be processed after payment is verified.
              </p>
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Payment Receipt</h2>
            <div className="border-2 border-dashed border-pharma-700 rounded-card p-6 text-center hover:border-accent-500 transition-colors">
              <input
                type="file"
                id="receipt"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="receipt" className="cursor-pointer">
                {receiptFile ? (
                  <div className="space-y-2">
                    <svg className="w-10 h-10 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-400 font-medium">{receiptFile.name}</p>
                    <p className="text-xs text-pharma-500">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-10 h-10 text-pharma-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-pharma-400">Click to upload payment receipt</p>
                    <p className="text-xs text-pharma-500">PNG, JPG, or PDF up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3 text-sm">
              {error}
            </div>
          )}

          {/* Place Order (mobile — shows below summary on desktop) */}
          <div className="lg:hidden">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Placing Order...' : `Place Order — RM ${totalMyr.toLocaleString()}`}
            </button>
          </div>
        </form>

        {/* Right column: Order Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            {/* Order Summary Card */}
            <div className="holographic-border rounded-card p-6 bg-pharma-850/50">
              <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between items-start text-sm">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-white truncate">{item.name} {item.peptide}</p>
                      <p className="text-pharma-500 text-xs">{item.dosage_mg}mg × {item.quantity}</p>
                    </div>
                    <span className="text-pharma-300 whitespace-nowrap font-medium">
                      RM {(item.price_myr * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-pharma-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-pharma-400">Subtotal</span>
                  <span className="text-white">RM {subtotal.toLocaleString()}</span>
                </div>

                {discountPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Discount ({discountPct}%)</span>
                    <span className="text-green-400">−RM {discountMyr.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold border-t border-pharma-700 pt-3 mt-3">
                  <span className="text-white">Total</span>
                  <span className="text-white">RM {totalMyr.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Place Order (desktop) */}
            <button
              type="submit"
              disabled={submitting}
              onClick={handleSubmit}
              className="hidden lg:flex w-full py-3.5 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
            >
              {submitting ? 'Placing Order...' : `Place Order — RM ${totalMyr.toLocaleString()}`}
            </button>

            <Link
              to="/cart"
              className="block text-center text-sm text-pharma-400 hover:text-white transition-colors"
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
