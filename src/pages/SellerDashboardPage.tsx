import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { Seller, PharmaOrder, OrderStatus, CartItem } from '../types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '../types'
import { getSellerBySession, logoutSeller } from '../lib/auth'
import { getOrdersBySeller, updateOrderStatus, notifyPatientStatusChange } from '../lib/api'

const STATUS_COLORS: Record<OrderStatus, string> = {
  ordered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  preparing_order: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delivery: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delivered: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function SellerDashboardPage() {
  const navigate = useNavigate()

  const [seller, setSeller] = useState<Seller | null>(null)
  const [orders, setOrders] = useState<PharmaOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  // ── Auth check ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const s = await getSellerBySession()
        if (cancelled) return

        if (!s) {
          navigate('/seller-login', { replace: true })
          return
        }

        setSeller(s)

        // Load orders
        const odrs = await getOrdersBySeller(s.seller_code)
        if (!cancelled) {
          setOrders(odrs)
        }
      } catch {
        if (!cancelled) navigate('/seller-login', { replace: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [navigate])

  // ── Handle status change ──────────────────────────────
  const handleStatusChange = useCallback(
    async (order: PharmaOrder, newStatus: OrderStatus) => {
      if (newStatus === order.status) return

      const oldStatus = order.status
      setUpdatingOrderId(order.id)

      try {
        const success = await updateOrderStatus(order.id, newStatus)
        if (!success) {
          alert('Failed to update order status')
          return
        }

        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
        )

        // Send notification
        await notifyPatientStatusChange(order, oldStatus, newStatus)
      } catch (err) {
        console.error('Status update failed:', err)
        alert('Failed to update order status')
      } finally {
        setUpdatingOrderId(null)
      }
    },
    []
  )

  // ── Logout ────────────────────────────────────────────
  async function handleLogout() {
    await logoutSeller()
    navigate('/seller-login', { replace: true })
  }

  // ── Computed stats ────────────────────────────────────
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_myr || 0), 0)
  const totalCommission = orders.reduce((sum, o) => sum + (o.commission_myr || 0), 0)

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-pharma-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-pharma-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ── No seller (shouldn't happen, but guard) ───────────
  if (!seller) return null

  return (
    <div className="min-h-screen bg-pharma-950">
      {/* ── Dashboard Header ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-pharma-950/80 backdrop-blur-xl border-b border-pharma-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-accent-500">PHARMA</span>
                  <span className="text-white/80">.zuso</span>
                </span>
              </Link>
              <span className="hidden sm:inline text-xs text-pharma-500 border-l border-pharma-700/50 pl-4">
                Seller Dashboard
              </span>
            </div>

            {/* Seller info + logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-pharma-300">{seller.email}</span>
                <span className="px-2 py-0.5 rounded bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-mono">
                  {seller.seller_code}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-btn bg-pharma-800 hover:bg-pharma-700 border border-pharma-700 text-pharma-300 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seller Info Card */}
        <div className="holographic-border rounded-card bg-pharma-850/50 glow-purple p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome, {seller.email.split('@')[0]}
              </h1>
              <p className="text-pharma-400 text-sm mt-1">{seller.email}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Seller code */}
              <div className="px-4 py-2 rounded-btn bg-pharma-900 border border-pharma-700">
                <p className="text-xs text-pharma-400 uppercase tracking-wider">Seller Code</p>
                <p className="text-lg font-mono font-bold text-accent-400">{seller.seller_code}</p>
              </div>
              {/* Discount */}
              <div className="px-4 py-2 rounded-btn bg-pharma-900 border border-pharma-700">
                <p className="text-xs text-pharma-400 uppercase tracking-wider">Discount</p>
                <p className="text-lg font-bold text-white">{seller.discount_pct}%</p>
              </div>
              {/* Commission */}
              <div className="px-4 py-2 rounded-btn bg-pharma-900 border border-pharma-700">
                <p className="text-xs text-pharma-400 uppercase tracking-wider">Commission</p>
                <p className="text-lg font-bold text-green-400">{seller.commission_pct}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Orders */}
          <div className="holographic-border rounded-card bg-pharma-850/50 p-5">
            <p className="text-xs text-pharma-400 uppercase tracking-wider mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-white">{totalOrders}</p>
          </div>

          {/* Total Revenue */}
          <div className="holographic-border rounded-card bg-pharma-850/50 p-5">
            <p className="text-xs text-pharma-400 uppercase tracking-wider mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-white">
              RM {totalRevenue.toLocaleString()}
            </p>
          </div>

          {/* Total Commission */}
          <div className="holographic-border rounded-card bg-pharma-850/50 p-5">
            <p className="text-xs text-pharma-400 uppercase tracking-wider mb-2">Total Commission</p>
            <p className="text-3xl font-bold text-green-400">
              RM {totalCommission.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Share Your Code ──────────────────────────── */}
        <div className="holographic-border rounded-card bg-pharma-850/50 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Share Your Code</h3>
          <p className="text-pharma-400 text-sm mb-4">
            Share your unique link — patients get <span className="text-green-400 font-semibold">{seller.discount_pct}% off</span> and you earn <span className="text-green-400 font-semibold">{seller.commission_pct}% commission</span>.
          </p>

          {/* Preview of the copy text */}
          <div className="bg-pharma-900/50 border border-pharma-700/50 rounded p-3 mb-4">
            <p className="text-xs text-pharma-400 uppercase tracking-wider mb-1">Copy Preview</p>
            <p className="text-xs text-pharma-300 leading-relaxed">
              Checkout <span className="text-green-400 font-semibold">{seller.discount_pct}% off</span> high precision peptides — ATHERYX & ELYSION: Tirzepatide and Retatrutide EziPen. Click the link to explore your accurate dosing!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Copy Link */}
            <button
              onClick={async () => {
                const link = `https://pharma.zuso-boltz-agentic.app/?code=${seller.seller_code}`
                const adText = `Checkout ${seller.discount_pct}% off high precision peptides — ATHERYX & ELYSION: Tirzepatide and Retatrutide EziPen. Click the link to explore your accurate dosing!\n\n${link}`
                await navigator.clipboard.writeText(adText)
                setCopied('link')
                setTimeout(() => setCopied(null), 2000)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-medium transition-colors"
            >
              {copied === 'link' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Copy Link
                </>
              )}
            </button>
            {/* Copy Code */}
            <button
              onClick={async () => {
                const adText = `Checkout ${seller.discount_pct}% off high precision peptides — ATHERYX & ELYSION: Tirzepatide and Retatrutide EziPen. Click the link to explore your accurate dosing!\n\nUse code: ${seller.seller_code} at https://pharma.zuso-boltz-agentic.app/`
                await navigator.clipboard.writeText(adText)
                setCopied('code')
                setTimeout(() => setCopied(null), 2000)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-btn bg-pharma-800 hover:bg-pharma-700 border border-pharma-700 text-pharma-200 font-medium transition-colors"
            >
              {copied === 'code' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Orders Table ───────────────────────────────── */}
        <div className="holographic-border rounded-card bg-pharma-850/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-pharma-700/50">
            <h2 className="text-lg font-semibold text-white">Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-pharma-800/50 border border-pharma-700/50 flex items-center justify-center">
                <svg className="w-7 h-7 text-pharma-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">No orders yet</h3>
              <p className="text-pharma-400 text-sm">
                Orders from your patients will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop table */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-pharma-700/50">
                    {['Order ID', 'Patient', 'Email', 'Items', 'Total', 'Discount', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-pharma-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pharma-700/30">
                  {orders.map((order) => {
                    const items = (order.items || []) as CartItem[]
                    const itemSummary = items
                      .map((i) => `${i.name} ${i.peptide} (${i.quantity}x)`)
                      .join(', ')

                    return (
                      <tr key={order.id} className="hover:bg-pharma-800/30 transition-colors">
                        {/* Order ID */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-pharma-300">
                            {order.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-white font-medium">{order.patient_name}</p>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          <p className="text-xs text-pharma-300">{order.patient_email}</p>
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4">
                          <p className="text-xs text-pharma-300 max-w-[200px] truncate" title={itemSummary}>
                            {itemSummary || '—'}
                          </p>
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-white font-semibold">
                            RM {order.total_myr.toLocaleString()}
                          </p>
                        </td>

                        {/* Discount */}
                        <td className="px-6 py-4">
                          <p className="text-xs text-pharma-300">
                            {order.discount_pct}% (−RM {order.discount_myr?.toLocaleString() || '0'})
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                              STATUS_COLORS[order.status]
                            }`}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                            className="bg-pharma-900 border border-pharma-700 rounded-btn px-3 py-1.5 text-xs text-white cursor-pointer focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50 disabled:cursor-wait"
                          >
                            {ORDER_STATUS_FLOW.map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          {updatingOrderId === order.id && (
                            <span className="ml-2 inline-block w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin align-middle" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-pharma-700/30">
                {orders.map((order) => {
                  const items = (order.items || []) as CartItem[]
                  const itemSummary = items
                    .map((i) => `${i.name} ${i.peptide} (${i.quantity}x)`)
                    .join(', ')

                  return (
                    <div key={order.id} className="px-4 py-4 space-y-3">
                      {/* Order ID + Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-pharma-300">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[order.status]
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>

                      {/* Patient */}
                      <div>
                        <p className="text-sm text-white font-medium">{order.patient_name}</p>
                        <p className="text-xs text-pharma-400">{order.patient_email}</p>
                      </div>

                      {/* Items */}
                      <p className="text-xs text-pharma-300">{itemSummary || '—'}</p>

                      {/* Financials */}
                      <div className="flex gap-4 text-xs">
                        <span className="text-pharma-400">
                          Total: <span className="text-white font-semibold">RM {order.total_myr.toLocaleString()}</span>
                        </span>
                        <span className="text-pharma-400">
                          Discount: <span className="text-pharma-300">{order.discount_pct}%</span>
                        </span>
                        <span className="text-pharma-400">
                          Commission: <span className="text-green-400">RM {order.commission_myr?.toLocaleString() || '0'}</span>
                        </span>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                          className="flex-1 bg-pharma-900 border border-pharma-700 rounded-btn px-3 py-2 text-sm text-white cursor-pointer focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50 disabled:cursor-wait"
                        >
                          {ORDER_STATUS_FLOW.map((s) => (
                            <option key={s} value={s}>
                              {ORDER_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        {updatingOrderId === order.id && (
                          <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
