import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSellerBySession, logoutSeller } from '../lib/auth'
import { getAllOrders, getAllSellers, updateOrderStatus, updateSellerConfig, notifyPatientStatusChange, adminGetAllProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, getAllBulkOrders, updateBulkOrderStatus, decrementProductStock } from '../lib/api'
import type { Seller, PharmaOrder, OrderStatus, Product, BulkOrder, BulkOrderStatus } from '../types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW, BULK_ORDER_STATUS_LABELS, BULK_ORDER_STATUS_FLOW } from '../types'
import ProductEditModal from '../components/admin/ProductEditModal'

const STATUS_COLORS: Record<OrderStatus, string> = {
  ordered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  preparing_order: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delivery: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delivered: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const BULK_STATUS_COLORS: Record<BulkOrderStatus, string> = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  preparing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  // Auth state
  const [admin, setAdmin] = useState<Seller | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'sellers' | 'products' | 'bulk_orders'>('orders')

  // Orders state
  const [orders, setOrders] = useState<PharmaOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Sellers state
  const [sellers, setSellers] = useState<Seller[]>([])
  const [sellersLoading, setSellersLoading] = useState(false)
  const [savingSellerId, setSavingSellerId] = useState<string | null>(null)

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')

  // Bulk orders state
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([])
  const [bulkOrdersLoading, setBulkOrdersLoading] = useState(false)
  const [updatingBulkOrderId, setUpdatingBulkOrderId] = useState<string | null>(null)

  // Seller detail modal state
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)

  // Order tab: selected seller filter
  const [orderFilterSellerCode, setOrderFilterSellerCode] = useState<string | null>(null)

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

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const data = await adminGetAllProducts()
      setProducts(data)
    } catch {
      showMessage('error', 'Failed to load products')
    }
    setProductsLoading(false)
  }, [])

  const loadBulkOrders = useCallback(async () => {
    setBulkOrdersLoading(true)
    try {
      const data = await getAllBulkOrders()
      setBulkOrders(data)
    } catch {
      showMessage('error', 'Failed to load bulk orders')
    }
    setBulkOrdersLoading(false)
  }, [])

  useEffect(() => {
    if (!authLoading && admin) {
      loadOrders()
      loadSellers()
      loadProducts()
      loadBulkOrders()
    }
  }, [authLoading, admin, loadOrders, loadSellers, loadProducts, loadBulkOrders])

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

  // ─── Bulk order status change ───
  const handleBulkOrderStatusChange = async (bulkOrder: BulkOrder, newStatus: BulkOrderStatus) => {
    if (newStatus === bulkOrder.status) return
    setUpdatingBulkOrderId(bulkOrder.id)

    const success = await updateBulkOrderStatus(bulkOrder.id, newStatus)
    if (!success) {
      showMessage('error', 'Failed to update bulk order status')
      setUpdatingBulkOrderId(null)
      return
    }

    // Update local state
    setBulkOrders(prev =>
      prev.map(bo => (bo.id === bulkOrder.id ? { ...bo, status: newStatus } : bo))
    )

    // Auto-decrement stock when delivered
    if (newStatus === 'delivered') {
      const items = bulkOrder.items as BulkOrderItem[]
      for (const item of items) {
        await decrementProductStock(item.product_id, item.quantity)
      }
      showMessage('success', `Bulk order delivered — stock decremented for ${items.length} products`)
    } else {
      showMessage('success', `Bulk order #${bulkOrder.id.slice(0, 8)} → ${BULK_ORDER_STATUS_LABELS[newStatus]}`)
    }

    setUpdatingBulkOrderId(null)
  }

  // ─── Seller config change ───
  const handleSellerConfigSave = async (seller: Seller, field: 'discount_pct' | 'commission_pct', value: number) => {
    setSavingSellerId(seller.id)
    const success = await updateSellerConfig(seller.id, { [field]: value })
    if (success) {
      setSellers(prev =>
        prev.map(s => (s.id === seller.id ? { ...s, [field]: value } : s))
      )
      // Also update selectedSeller if it's the same one
      if (selectedSeller?.id === seller.id) {
        setSelectedSeller(prev => prev ? { ...prev, [field]: value } : null)
      }
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
      if (selectedSeller?.id === seller.id) {
        setSelectedSeller(prev => prev ? { ...prev, is_active: newActive } : null)
      }
      showMessage('success', `${seller.email} ${newActive ? 'activated' : 'deactivated'}`)
    } else {
      showMessage('error', 'Failed to update seller')
    }
    setSavingSellerId(null)
  }

  // ─── Computed: order summaries per seller ───
  const sellerOrderSummaries = sellers.map(seller => {
    const sellerOrders = orders.filter(o => o.seller_code === seller.seller_code)
    const summary: Record<OrderStatus, number> = {
      ordered: 0,
      paid: 0,
      preparing_order: 0,
      delivery: 0,
      delivered: 0,
    }
    sellerOrders.forEach(o => { summary[o.status]++ })
    return { seller, summary, total: sellerOrders.length }
  })

  // ─── Filtered orders for selected seller ───
  const filteredOrders = orderFilterSellerCode
    ? orders.filter(o => o.seller_code === orderFilterSellerCode)
    : orders

  const selectedSellerData = sellers.find(s => s.seller_code === orderFilterSellerCode)

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
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'products'
                ? 'text-accent-400 border-accent-500'
                : 'text-pharma-400 border-transparent hover:text-pharma-300'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('bulk_orders')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'bulk_orders'
                ? 'text-accent-400 border-accent-500'
                : 'text-pharma-400 border-transparent hover:text-pharma-300'
            }`}
          >
            Bulk Orders
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
          <div>
            {orderFilterSellerCode ? (
              /* ── Filtered orders for one seller ── */
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setOrderFilterSellerCode(null)}
                    className="px-4 py-2 rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors text-sm"
                  >
                    ← Back to All Sellers
                  </button>
                  <span className="text-white font-semibold">
                    {selectedSellerData?.name || 'Unknown'} — {filteredOrders.length} orders
                  </span>
                </div>
                <OrdersTable
                  orders={filteredOrders}
                  loading={ordersLoading}
                  onStatusChange={handleStatusChange}
                  showSellerCode={false}
                />
              </div>
            ) : (
              /* ── Seller cards grid ── */
              <div>
                {ordersLoading ? (
                  <div className="p-12 text-center text-pharma-400">Loading orders...</div>
                ) : sellerOrderSummaries.length === 0 ? (
                  <div className="p-12 text-center text-pharma-400">No sellers found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerOrderSummaries.map(({ seller, summary, total }) => (
                      <button
                        key={seller.id}
                        onClick={() => setOrderFilterSellerCode(seller.seller_code)}
                        className="text-left rounded-card bg-pharma-850/50 border border-pharma-700/50 p-5 hover:border-accent-500/50 hover:bg-pharma-800/30 transition-all cursor-pointer"
                      >
                        {/* Seller name + code */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold text-lg truncate">
                            {seller.name}
                          </h3>
                          <span className="text-xs font-mono text-pharma-400 flex-shrink-0 ml-2">
                            {seller.seller_code}
                          </span>
                        </div>

                        {/* Order summary pills */}
                        {total > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {ORDER_STATUS_FLOW.map(status => {
                              const count = summary[status]
                              if (count === 0) return null
                              return (
                                <span
                                  key={status}
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
                                >
                                  {ORDER_STATUS_LABELS[status]}: {count}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-pharma-500 text-sm">No orders yet</p>
                        )}

                        {/* Total */}
                        {total > 0 && (
                          <p className="text-pharma-400 text-xs mt-3">
                            {total} order{total !== 1 ? 's' : ''} total
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Name</th>
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
                      <tr
                        key={seller.id}
                        onClick={() => setSelectedSeller(seller)}
                        className="border-b border-pharma-700/30 hover:bg-pharma-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {seller.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 text-xs">
                          {seller.email}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 font-mono text-xs">
                          {seller.seller_code}
                        </td>
                        <td className="px-4 py-3 text-pharma-300 text-xs">
                          {seller.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <DiscountEditor
                            value={seller.discount_pct}
                            saving={savingSellerId === seller.id}
                            onSave={val => handleSellerConfigSave(seller, 'discount_pct', val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <CommissionEditor
                            value={seller.commission_pct}
                            saving={savingSellerId === seller.id}
                            onSave={val => handleSellerConfigSave(seller, 'commission_pct', val)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
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
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
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

        {/* ─── TAB: Products ─── */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                All Products ({products.length})
              </h3>
              <button
                onClick={() => {
                  setEditMode('create')
                  setEditingProduct(undefined)
                  setEditModalOpen(true)
                }}
                className="px-4 py-2 rounded-btn bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors"
              >
                + Add Product
              </button>
            </div>

            <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 overflow-hidden">
              {productsLoading ? (
                <div className="p-12 text-center text-pharma-400">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center text-pharma-400">No products found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-pharma-700/50 bg-pharma-900/40">
                        <th className="text-left text-pharma-400 font-medium px-4 py-3">Brand</th>
                        <th className="text-left text-pharma-400 font-medium px-4 py-3">Name</th>
                        <th className="text-center text-pharma-400 font-medium px-4 py-3">Dosage</th>
                        <th className="text-right text-pharma-400 font-medium px-4 py-3">Price (RM)</th>
                        <th className="text-center text-pharma-400 font-medium px-4 py-3">Stock</th>
                        <th className="text-center text-pharma-400 font-medium px-4 py-3">Active</th>
                        <th className="text-center text-pharma-400 font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-pharma-700/30 hover:bg-pharma-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                p.brand === 'atheryx'
                                  ? 'text-purple-300 bg-purple-500/15'
                                  : 'text-blue-300 bg-blue-500/15'
                              }`}
                            >
                              {p.brand === 'atheryx' ? 'ATHERYX' : 'ELYSION'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white text-sm">
                            <div>{p.name}</div>
                            {p.display_name && (
                              <div className="text-pharma-400 text-xs mt-0.5">{p.display_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-pharma-300">
                            {p.dosage_mg}mg
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium">
                            RM {p.price_myr.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-sm font-medium ${
                                p.stock > 10
                                  ? 'text-green-400'
                                  : p.stock > 0
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                p.active ? 'bg-green-400' : 'bg-pharma-500'
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditMode('edit')
                                  setEditingProduct(p)
                                  setEditModalOpen(true)
                                }}
                                className="text-xs px-3 py-1.5 rounded bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  const ok = await adminDeleteProduct(p.id)
                                  if (ok) {
                                    showMessage('success', `${p.name} deactivated`)
                                    loadProducts()
                                  } else {
                                    showMessage('error', 'Failed to deactivate product')
                                  }
                                }}
                                className="text-xs px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                Deactivate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: Bulk Orders ─── */}
        {activeTab === 'bulk_orders' && (
          <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-pharma-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Bulk Orders ({bulkOrders.length})
              </h2>
              <button
                onClick={loadBulkOrders}
                className="px-3 py-1.5 rounded-btn bg-pharma-800 hover:bg-pharma-700 border border-pharma-700 text-pharma-300 text-xs transition-colors"
              >
                Refresh
              </button>
            </div>

            {bulkOrdersLoading ? (
              <div className="p-12 text-center text-pharma-400">Loading bulk orders...</div>
            ) : bulkOrders.length === 0 ? (
              <div className="p-12 text-center text-pharma-400">
                <p className="mb-2">No bulk orders yet</p>
                <p className="text-xs text-pharma-500">Seller stock replenishment orders will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pharma-700/50 bg-pharma-900/40">
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Order ID</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Seller Code</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-3">Items</th>
                      <th className="text-right text-pharma-400 font-medium px-4 py-3">Cost (RM)</th>
                      <th className="text-right text-pharma-400 font-medium px-4 py-3">Retail (RM)</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Status</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkOrders.map((bo) => {
                      const items = (bo.items || []) as BulkOrderItem[]
                      const itemSummary = items
                        .map((i) => `${i.brand === 'atheryx' ? 'ATH' : 'ELY'} ${i.dosage_mg}mg ×${i.quantity}`)
                        .join(', ')

                      return (
                        <tr key={bo.id} className="border-b border-pharma-700/30 hover:bg-pharma-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-pharma-300">
                              {bo.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-accent-400">{bo.seller_code}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-pharma-300 max-w-[250px] truncate" title={itemSummary}>
                              {itemSummary || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-green-400 font-semibold font-mono">
                              RM {bo.total_cost_myr.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs text-pharma-500 line-through">
                              RM {bo.total_retail_myr.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                                BULK_STATUS_COLORS[bo.status]
                              }`}
                            >
                              {BULK_ORDER_STATUS_LABELS[bo.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <select
                                value={bo.status}
                                disabled={updatingBulkOrderId === bo.id || bo.status === 'cancelled'}
                                onChange={(e) =>
                                  handleBulkOrderStatusChange(bo, e.target.value as BulkOrderStatus)
                                }
                                className="bg-pharma-900 border border-pharma-700 rounded-btn px-3 py-1.5 text-xs text-white cursor-pointer focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {BULK_ORDER_STATUS_FLOW.map((s) => (
                                  <option key={s} value={s}>
                                    {BULK_ORDER_STATUS_LABELS[s]}
                                  </option>
                                ))}
                              </select>
                              {bo.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Cancel bulk order #${bo.id.slice(0, 8)}? This cannot be undone.`)) {
                                      handleBulkOrderStatusChange(bo, 'cancelled')
                                    }
                                  }}
                                  disabled={updatingBulkOrderId === bo.id}
                                  className="px-2 py-1 text-xs font-medium text-red-400 border border-red-500/30 rounded-btn hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Cancel order"
                                >
                                  ✕
                                </button>
                              )}
                              {updatingBulkOrderId === bo.id && (
                                <span className="inline-block w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin align-middle" />
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Seller Detail Modal ─── */}
      {selectedSeller && (
        <SellerDetailModal
          seller={selectedSeller}
          orders={orders.filter(o => o.seller_code === selectedSeller.seller_code)}
          onClose={() => setSelectedSeller(null)}
          onStatusChange={handleStatusChange}
          onConfigSave={handleSellerConfigSave}
          onActiveToggle={handleActiveToggle}
          savingSellerId={savingSellerId}
        />
      )}

      {/* ─── Product Edit Modal ─── */}
      {editModalOpen && (
        <ProductEditModal
          mode={editMode}
          product={editingProduct}
          onSave={async (data) => {
            if (editMode === 'create') {
              await adminCreateProduct(data)
            } else if (editingProduct) {
              await adminUpdateProduct(editingProduct.id, data)
            }
            setEditModalOpen(false)
            loadProducts()
          }}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Orders Table (reusable) ───

function OrdersTable({
  orders,
  loading,
  onStatusChange,
  showSellerCode,
}: {
  orders: PharmaOrder[]
  loading: boolean
  onStatusChange: (order: PharmaOrder, newStatus: OrderStatus) => void
  showSellerCode: boolean
}) {
  if (loading) {
    return <div className="p-12 text-center text-pharma-400">Loading orders...</div>
  }
  if (orders.length === 0) {
    return <div className="p-12 text-center text-pharma-400">No orders found for this seller.</div>
  }

  return (
    <div className="rounded-card bg-pharma-850/50 border border-pharma-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pharma-700/50 bg-pharma-900/40">
              <th className="text-left text-pharma-400 font-medium px-4 py-3">Order ID</th>
              {showSellerCode && (
                <th className="text-left text-pharma-400 font-medium px-4 py-3">Seller Code</th>
              )}
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
                {showSellerCode && (
                  <td className="px-4 py-3 text-pharma-300 text-xs font-mono">
                    {order.seller_code || '—'}
                  </td>
                )}
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
                    onChange={e => onStatusChange(order, e.target.value as OrderStatus)}
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
    </div>
  )
}

// ─── Seller Detail Modal ───

function SellerDetailModal({
  seller,
  orders,
  onClose,
  onStatusChange,
  onConfigSave,
  onActiveToggle,
  savingSellerId,
}: {
  seller: Seller
  orders: PharmaOrder[]
  onClose: () => void
  onStatusChange: (order: PharmaOrder, newStatus: OrderStatus) => void
  onConfigSave: (seller: Seller, field: 'discount_pct' | 'commission_pct', value: number) => void
  onActiveToggle: (seller: Seller) => void
  savingSellerId: string | null
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-card bg-pharma-900 border border-pharma-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-pharma-700/50 bg-pharma-900/95 backdrop-blur-sm rounded-t-card">
          <div>
            <h2 className="text-xl font-bold text-white">{seller.name}</h2>
            <p className="text-xs text-pharma-400 font-mono mt-0.5">{seller.seller_code}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-pharma-800 hover:bg-pharma-700 border border-pharma-700 text-pharma-400 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Seller Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem label="Email" value={seller.email} />
            <DetailItem label="Phone" value={seller.phone || '—'} />
            <DetailItem label="Address" value={seller.address || '—'} />
            <DetailItem label="Bank Name" value={seller.bank_name || '—'} />
            <DetailItem label="Bank Account" value={seller.bank_acc_number || '—'} mono />
            <DetailItem label="Status" value={seller.is_active ? 'Active' : 'Inactive'} />

            {/* Discount + Commission inline editors */}
            <div className="bg-pharma-850/50 rounded-btn p-4 border border-pharma-700/50">
              <p className="text-xs text-pharma-400 uppercase tracking-wider mb-2">Discount %</p>
              <DiscountEditor
                value={seller.discount_pct}
                saving={savingSellerId === seller.id}
                onSave={val => onConfigSave(seller, 'discount_pct', val)}
              />
            </div>
            <div className="bg-pharma-850/50 rounded-btn p-4 border border-pharma-700/50">
              <p className="text-xs text-pharma-400 uppercase tracking-wider mb-2">Commission %</p>
              <CommissionEditor
                value={seller.commission_pct}
                saving={savingSellerId === seller.id}
                onSave={val => onConfigSave(seller, 'commission_pct', val)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onActiveToggle(seller)}
              disabled={savingSellerId === seller.id}
              className={`px-4 py-2 rounded-btn text-sm font-medium border transition-colors disabled:opacity-50 ${
                seller.is_active
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
              }`}
            >
              {seller.is_active ? 'Deactivate Seller' : 'Activate Seller'}
            </button>
            {savingSellerId === seller.id && (
              <span className="text-xs text-pharma-400">Saving...</span>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t border-pharma-700/50 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Orders ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <p className="text-pharma-500 text-sm">No orders from this seller yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-card border border-pharma-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pharma-700/50 bg-pharma-850/50">
                      <th className="text-left text-pharma-400 font-medium px-4 py-2.5">Order ID</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-2.5">Patient</th>
                      <th className="text-left text-pharma-400 font-medium px-4 py-2.5">Items</th>
                      <th className="text-right text-pharma-400 font-medium px-4 py-2.5">Total</th>
                      <th className="text-center text-pharma-400 font-medium px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const items = (order.items || []) as Array<{ name: string; quantity: number }>
                      return (
                        <tr key={order.id} className="border-b border-pharma-700/30 hover:bg-pharma-800/30 transition-colors">
                          <td className="px-4 py-2.5 text-white font-mono text-xs">
                            {order.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-2.5 text-white text-sm">
                            {order.patient_name}
                          </td>
                          <td className="px-4 py-2.5 text-pharma-300 text-xs">
                            {items.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-white font-medium">
                            RM {order.total_myr.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <select
                              value={order.status}
                              onChange={e => onStatusChange(order, e.target.value as OrderStatus)}
                              className="bg-pharma-900 border border-pharma-700 rounded-btn px-2 py-1 text-xs text-white focus:border-accent-500 focus:outline-none cursor-pointer"
                            >
                              {ORDER_STATUS_FLOW.map(s => (
                                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-pharma-850/50 rounded-btn p-4 border border-pharma-700/50">
      <p className="text-xs text-pharma-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
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
