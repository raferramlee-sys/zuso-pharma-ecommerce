import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, itemCount, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="holographic-border rounded-card p-12 bg-pharma-850/30">
          <svg className="w-20 h-20 text-pharma-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-pharma-400 text-sm mb-6">Add some peptide therapy products to get started.</p>
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Shopping Cart ({itemCount} items)</h1>
        <button onClick={clearCart} className="text-sm text-pharma-400 hover:text-red-400 transition-colors">
          Clear cart
        </button>
      </div>

      {/* Cart items */}
      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.productId} className="flex gap-4 p-4 rounded-card bg-pharma-850/50 border border-pharma-700/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold tracking-widest uppercase ${item.brand === 'atheryx' ? 'text-brand-atheryx' : 'text-brand-elysion'}`}>
                  {item.brand === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-accent-600/20 text-accent-400 bg-accent-600/5">
                  FDA
                </span>
              </div>
              <Link to={`/product/${item.slug}`} className="text-sm font-medium text-white hover:text-accent-400 transition-colors">
                {item.peptide} — {item.dosage_mg}mg
              </Link>
              <p className="text-xs text-pharma-400 mt-0.5">Multi-dose Pen · Sterile A</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 border border-pharma-600 rounded-btn overflow-hidden">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-pharma-300 hover:text-white transition-colors">−</button>
                <span className="w-8 h-8 flex items-center justify-center text-white text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-pharma-300 hover:text-white transition-colors">+</button>
              </div>

              <div className="text-right min-w-[80px]">
                <p className="text-sm font-semibold text-white">RM {(item.price_myr * item.quantity).toLocaleString()}</p>
                <p className="text-[10px] text-pharma-500">RM {item.price_myr.toLocaleString()} each</p>
              </div>

              <button onClick={() => removeItem(item.productId)} className="text-pharma-500 hover:text-red-400 transition-colors ml-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="holographic-border rounded-card p-6 bg-pharma-850/50">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-pharma-300">Subtotal</span>
          <span className="text-white font-semibold">RM {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-pharma-400 mb-6">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>

        <div className="flex justify-between text-lg font-bold border-t border-pharma-700 pt-4 mb-6">
          <span className="text-white">Total</span>
          <span className="text-white">RM {subtotal.toLocaleString()}</span>
        </div>

        <button
          className="w-full py-3.5 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors shadow-lg shadow-accent-500/20"
        >
          Proceed to Checkout
        </button>

        <Link
          to="/products"
          className="block text-center mt-4 text-sm text-pharma-400 hover:text-white transition-colors"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  )
}
