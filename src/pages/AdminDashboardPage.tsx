import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSellerBySession, logoutSeller } from '../lib/auth'
import { getAllOrders, getAllSellers, updateOrderStatus, updateSellerConfig, notifyPatientStatusChange } from '../lib/api'
import type { Seller, PharmaOrder, OrderStatus } from '../types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '../types'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  // Auth state
  const [admin, setAdmin] = useState<Seller | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'sellers'>('orders')

  // Orders state
  const [orders, setOrders] = useState<PharmaOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Sellers state
  const [sellers, setSellers] = useState<Seller[]>([])
  const [sellersLoading, setSellersLoading] = useState(false)
  const [savingSellerId, setSavingSellerId] = useState<string | null>(null)

  // Feedback
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ─── Auth check ───
  useEffect(() => {
    const checkAuth = async () => {
      const seller = await getSellerBySession()
      if (!seller) {
        navigate('/admin/login')
        return
      }
      if (!seller.is_admin) {
        await logoutSeller()
        navigate('/admin/login')
        return
      }
      setAdmin(seller)
      setAuthLoading(false)
    }
    checkAuth()
  }, [navigate])

  // ─── Load data ───
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const data = await getAllOrders()
      setOrders(data)
    } catch {
      showMessage('error', 'Failed to load orders')
    }
    setOrdersLoading(false)
  }, [])

  const loadSellers = useCallback(async () => {
    setSellersLoading(true)
    try {
      const data = await getAllSellers()
      setSellers(data)
    } catch {
      showMessage('error', 'Failed to load sellers')
    }
    setSellersLoading(false)
  }, [])

  useEffect(() => {
    if (!authLoading && admin) {
      loadOrders()
      loadSellers()
    }
  }, [authLoading, admin, loadOrders, loadSellers])

  // ─── Helpers ───
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleLogout = async () => {
    await logoutSeller()
    navigate('/admin/login')
  }

  // ─── Order status change ───
  const handleStatusChange = async (order: PharmaOrder, newStatus: OrderStatus) => {
    const oldStatus = order.status
    const success = await updateOrderStatus(order.id, newStatus)
    if (!success) {
      showMessage('error', 'Failed to update status')
      return
    }

    // Update local state
    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o))
    )

    // Send notification
    try {
      await notifyPatientStatusChange({ ...order, status: newStatus }, oldStatus, newStatus)
    } catch {
      // Notification failure is non-critical
    }

    showMessage('success', `Order #${order.id.slice(0, 8)} → ${ORDER_STATUS_LABELS[newStatus]}`)
  }

  // ─── Seller config change ───
  const handleSellerConfigSave = async (seller: Seller, field: 'discount_pct' | 'commission_pct', value: number) => {
    setSavingSellerId(seller.id)
    const success = await updateSellerConfig(seller.id, { [field]: value })
    if (success) {
      setSellers(prev =>
        prev.map(s => (s.id === seller.id ? { ...s, [field]: value } : s))
      )
      showMessage('success', `Updated ${seller.email}`)
    } else {
      showMessage('error', 'Failed to update seller')
    }
    setSavingSellerId(null)
  }

  const handleActiveToggle = async (seller: Seller) => {
    setSavingSellerId(seller.id)
    const newActive = !seller.is_active
    const success = await updateSellerConfig(seller.id, { is_active: newActive })
    if (success) {
      setSellers(prev =>
        prev.map(s => (s.id === seller.id ? { ...s, is_active: newActive } : s))
      )
      showMessage('success', `${seller.email} ${newActive ? 'activated' : 'deactivated'}`)
    } else {
      showMessage('error', 'Failed to update seller')
    }
    setSavingSellerId(null)
  }

  // ─── Loading state ───
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pharma-950">
        <div className="text-pharma-400">Loading...</div>
      </div>
    )
  }

  // ─── Render ───
  return (
    <div className="min-h-screen bg-pharma-950">
      {/* Header */}
      <header className="border-b border-pharma-700/50 bg-pharma-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Zuso Pharma Admin</h1>
            {admin && (
              <p className="text-xs text-pharma-400 mt-0.5">Logged in as {admin.email}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-pharma-700/50">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'orders'
                ? 'text-accent-400 border-accent-500'
                : 'text-pharma-400 border-transparent hover:text-pharma-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'sellers'
                ? 'text-accent-400 border-accent-500'
                : 'text-pharma-400 border-transparent hover:text-pharma-300'
            }`}
          >
            Sellers
          </button>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`mb-6 text-sm rounded p-3 ${
              message.type === 'success'
                ? 'text-green-400 bg-green-400/10 border border-green-400/20'
                : 'text-red-400 bg-red-400/10 border border-red-400/20'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ─── TAB: Orders ─── */}
        {activeTab === 'orders' && (
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 overflow-hidden">
            {ordersLoading ? (
              <div className="p-12 text-center text-pharma-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-pharma-400">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pharma-700/50 bg-pharma-900/40">
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Order ID</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Seller Code</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Patient</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Email</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Items</th>
                      <th className="text-right text-pharma-400 font-medium px-4 py-3">Total</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b border-pharma-700/30 hover:bg-pharma-800/30 transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">
                          {order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 text-xs font-mono">
                          {order.seller_code || '—'}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {order.patient_name}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 text-xs">
                          {order.patient_email}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 text-xs">
                          {(order.items as Array<{ name: string; quantity: number }>)
                            ?.map(i => `${i.name} ×${i.quantity}`)
                            .join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-medium">
                          RM {order.total_myr.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order, e.target.value as OrderStatus)}
                            className="bg-pharma-900 border border-pharma-700 rounded-btn px-3 py-1.5 text-xs text-white focus:border-accent-500 focus:outline-none cursor-pointer"
                          >
                            {ORDER_STATUS_FLOW.map(s => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: Sellers ─── */}
        {activeTab === 'sellers' && (
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 overflow-hidden">
            {sellersLoading ? (
              <div className="p-12 text-center text-pharma-400">Loading sellers...</div>
            ) : sellers.length === 0 ? (
              <div className="p-12 text-center text-pharma-400">No sellers registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pharma-700/50 bg-pharma-900/40">
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Email</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Code</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Phone</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Discount %</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Commission %</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Active</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map(seller => (
                      <tr key={seller.id} className="border-b border-pharma-700/30 hover:bg-pharma-800/30 transition-colors">
                        <td className="px-4 py-3 text-white">
                          {seller.email}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 font-mono text-xs">
                          {seller.seller_code}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 text-xs">
                          {seller.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <DiscountEditor
                            value={seller.discount_pct}
                            saving={savingSellerId === seller.id}
                            onSave={val => handleSellerConfigSave(seller, 'discount_pct', val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CommissionEditor
                            value={seller.commission_pct}
                            saving={savingSellerId === seller.id}
                            onSave={val => handleSellerConfigSave(seller, 'commission_pct', val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleActiveToggle(seller)}
                            disabled={savingSellerId === seller.id}
                            className={`w-10 h-5 rounded-full transition-colors relative ${
                              seller.is_active ? 'bg-green-500' : 'bg-pharma-600'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                seller.is_active ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {savingSellerId === seller.id && (
                            <span className="text-xs text-pharma-400">Saving...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inline editors ───

function DiscountEditor({
  value,
  saving,
  onSave,
}: {
  value: number
  saving: boolean
  onSave: (val: number) => void
}) {
  const [edit, setEdit] = useState(false)
  const [val, setVal] = useState(value)

  const handleSave = () => {
    const num = Math.max(0, Math.min(100, Number(val) || 0))
    setVal(num)
    onSave(num)
    setEdit(false)
  }

  if (!edit) {
    return (
      <button
        onClick={() => { setVal(value); setEdit(true) }}
        className="text-white hover:text-accent-400 transition-colors font-medium"
      >
        {value}%
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 justify-center">
      <input
        type="number"
        value={val}
        onChange={e => setVal(Number(e.target.value))}
        min={0}
        max={100}
        className="w-16 bg-pharma-900 border border-pharma-700 rounded-btn px-2 py-1 text-xs text-white text-center focus:border-accent-500 focus:outline-none"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEdit(false) }}
        disabled={saving}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs px-2 py-1 rounded bg-accent-500 hover:bg-accent-600 text-white transition-colors disabled:opacity-50"
      >
        Save
      </button>
    </div>
  )
}

function CommissionEditor({
  value,
  saving,
  onSave,
}: {
  value: number
  saving: boolean
  onSave: (val: number) => void
}) {
  const [edit, setEdit] = useState(false)
  const [val, setVal] = useState(value)

  const handleSave = () => {
    const num = Math.max(0, Math.min(100, Number(val) || 0))
    setVal(num)
    onSave(num)
    setEdit(false)
  }

  if (!edit) {
    return (
      <button
        onClick={() => { setVal(value); setEdit(true) }}
        className="text-white hover:text-accent-400 transition-colors font-medium"
      >
        {value}%
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 justify-center">
      <input
        type="number"
        value={val}
        onChange={e => setVal(Number(e.target.value))}
        min={0}
        max={100}
        className="w-16 bg-pharma-900 border border-pharma-700 rounded-btn px-2 py-1 text-xs text-white text-center focus:border-accent-500 focus:outline-none"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEdit(false) }}
        disabled={saving}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs px-2 py-1 rounded bg-accent-500 hover:bg-accent-600 text-white transition-colors disabled:opacity-50"
      >
        Save
      </button>
    </div>
  )
}
