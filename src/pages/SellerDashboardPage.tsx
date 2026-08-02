import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { Seller, PharmaOrder, OrderStatus, CartItem, Product, BulkOrderItem } from '../types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '../types'
import { getSellerBySession, logoutSeller } from '../lib/auth'
import { getOrdersBySeller, updateOrderStatus, notifyPatientStatusChange, submitBulkOrder, getBulkOrdersBySeller, notifySellerBulkOrderInvoice, notifyAdminBulkOrder } from '../lib/api'
import { supabase } from '../lib/supabase'

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

  // ── Bulk Order state ──────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [bulkCart, setBulkCart] = useState<Record<string, number>>({})
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // ── Load products for bulk order ─────────────────────
  useEffect(() => {
    if (!seller) return
    let cancelled = false
    async function loadProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
      if (!cancelled) {
        const sorted = [...(data || [])].sort((a: Product, b: Product) => {
          if (a.brand !== b.brand) return a.brand === 'atheryx' ? -1 : 1
          return (a.dosage_mg || 0) - (b.dosage_mg || 0)
        })
        setProducts(sorted)
      }
    }
    loadProducts()
    return () => { cancelled = true }
  }, [seller])

  // ── Bulk order helpers ──────────────────────────────
  const costPrice = (retailPrice: number) =>
    Math.round(retailPrice * (1 - ((seller?.discount_pct || 0) + (seller?.commission_pct || 0)) / 100))

  const bulkCartTotal = Object.entries(bulkCart).reduce((sum, [pid, qty]) => {
    const product = products.find(p => p.id === pid)
    return sum + (product ? costPrice(product.price_myr) * qty : 0)
  }, 0)

  const bulkCartRetail = Object.entries(bulkCart).reduce((sum, [pid, qty]) => {
    const product = products.find(p => p.id === pid)
    return sum + (product ? product.price_myr * qty : 0)
  }, 0)

  const bulkCartItems = Object.entries(bulkCart).filter(([, qty]) => qty > 0)

  const handleBulkQtyChange = (productId: string, delta: number) => {
    setBulkCart(prev => {
      const current = prev[productId] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: next }
    })
  }

  const handlePlaceBulkOrder = async () => {
    if (!seller || bulkCartItems.length === 0) return
    setBulkSubmitting(true)
    setBulkMessage(null)

    try {
      const items: BulkOrderItem[] = bulkCartItems.map(([pid, qty]) => {
        const p = products.find(pr => pr.id === pid)!
        return {
          product_id: p.id,
          brand: p.brand,
          name: p.name,
          peptide: p.peptide,
          dosage_mg: p.dosage_mg,
          quantity: qty,
          unit_retail_myr: p.price_myr,
          unit_cost_myr: costPrice(p.price_myr),
        }
      })

      const totalCost = items.reduce((s, i) => s + i.unit_cost_myr * i.quantity, 0)
      const totalRetail = items.reduce((s, i) => s + i.unit_retail_myr * i.quantity, 0)

      const result = await submitBulkOrder({
        seller_id: seller.id,
        seller_code: seller.seller_code,
        items,
        total_cost_myr: totalCost,
        total_retail_myr: totalRetail,
      })

      if ('error' in result) {
        setBulkMessage({ type: 'error', text: result.error })
        return
      }

      // Send notifications
      await Promise.allSettled([
        notifySellerBulkOrderInvoice(result, seller.email),
        notifyAdminBulkOrder(result, seller.email),
      ])

      setBulkCart({})
      setBulkMessage({ type: 'success', text: `Order #${result.id.slice(0, 8)} placed! Check your email for the invoice.` })
    } catch (err) {
      setBulkMessage({ type: 'error', text: 'Failed to place order' })
      console.error(err)
    } finally {
      setBulkSubmitting(false)
    }
  }

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

        {/* ── Bulk Order Pens ──────────────────────────── */}
        <div className="holographic-border rounded-card bg-pharma-850/50 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-1">🛒 Bulk Order Pens</h3>
          <p className="text-pharma-400 text-sm mb-4">
            Order pens at cost price: <span className="text-green-400 font-mono font-semibold">Retail − {seller.discount_pct}% discount − {seller.commission_pct}% commission</span>
          </p>

          {/* Products grid */}
          {products.length === 0 ? (
            <div className="p-8 text-center text-pharma-500 text-sm">Loading products...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {products.map(product => {
                const cost = costPrice(product.price_myr)
                const qty = bulkCart[product.id] || 0
                return (
                  <div
                    key={product.id}
                    className={`rounded-lg border p-4 transition-all ${
                      qty > 0
                        ? 'border-green-500/40 bg-green-500/5'
                        : 'border-pharma-700/50 bg-pharma-900/40 hover:border-pharma-600/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`text-xs font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          product.brand === 'atheryx'
                            ? 'text-purple-300 bg-purple-500/15'
                            : 'text-blue-300 bg-blue-500/15'
                        }`}>
                          {product.brand === 'atheryx' ? 'ATHERYX' : 'ELYSION'}
                        </span>
                        <p className="text-sm text-white font-medium mt-1">{product.peptide}</p>
                        <p className="text-xs text-pharma-400">{product.dosage_mg}mg — {product.volume_ml}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xs text-pharma-500 line-through">RM {product.price_myr}</span>
                      <span className="text-lg font-bold text-green-400">RM {cost.toLocaleString()}</span>
                      <span className="text-xs text-pharma-500">/pen</span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkQtyChange(product.id, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded flex items-center justify-center bg-pharma-800 border border-pharma-700 text-pharma-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          −
                        </button>
                        <span className="text-white font-mono text-sm w-6 text-center">{qty}</span>
                        <button
                          onClick={() => handleBulkQtyChange(product.id, 1)}
                          className="w-7 h-7 rounded flex items-center justify-center bg-pharma-800 border border-pharma-700 text-pharma-300 hover:text-white transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                      {qty > 0 && (
                        <span className="text-xs text-green-400 font-mono">
                          RM {(cost * qty).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Cart summary */}
          {bulkCartItems.length > 0 && (
            <div className="border-t border-pharma-700/50 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">Order Summary</h4>
              <div className="space-y-2 mb-4">
                {bulkCartItems.map(([pid, qty]) => {
                  const p = products.find(pr => pr.id === pid)!
                  const cost = costPrice(p.price_myr)
                  return (
                    <div key={pid} className="flex items-center justify-between text-sm">
                      <span className="text-pharma-300">
                        {p.brand === 'atheryx' ? 'ATHERYX' : 'ELYSION'} {p.peptide} {p.dosage_mg}mg × {qty}
                      </span>
                      <span className="text-white font-mono">RM {(cost * qty).toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between items-center border-t border-pharma-700/30 pt-3">
                <div>
                  <p className="text-xs text-pharma-500 line-through">Retail: RM {bulkCartRetail.toLocaleString()}</p>
                  <p className="text-lg font-bold text-green-400">Cost: RM {bulkCartTotal.toLocaleString()}</p>
                  <p className="text-xs text-accent-400">You save: RM {(bulkCartRetail - bulkCartTotal).toLocaleString()}</p>
                </div>
                <button
                  onClick={handlePlaceBulkOrder}
                  disabled={bulkSubmitting}
                  className="px-6 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {bulkSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing...
                    </span>
                  ) : (
                    'Place Bulk Order'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Message */}
          {bulkMessage && (
            <div className={`mt-4 text-sm rounded p-3 ${
              bulkMessage.type === 'success'
                ? 'text-green-400 bg-green-400/10 border border-green-400/20'
                : 'text-red-400 bg-red-400/10 border border-red-400/20'
            }`}>
              {bulkMessage.text}
            </div>
          )}
        </div>

        {/* ── Orders Table ─────────────────────────────────  */}
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
