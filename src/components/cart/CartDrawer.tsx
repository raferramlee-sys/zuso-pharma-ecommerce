import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useSellerDiscount, getDiscountedPrice } from '../../hooks/useSellerDiscount'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQty, subtotal, itemCount } = useCart()
  const { discountPct, sellerCode, isActive } = useSellerDiscount()
  const discountedSubtotal = isActive ? items.reduce((sum, i) => sum + getDiscountedPrice(i.price_myr, discountPct) * i.quantity, 0) : subtotal
  const discountAmount = subtotal - discountedSubtotal

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-pharma-900 border-l border-pharma-700 shadow-2xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-pharma-700">
            <h2 className="text-lg font-semibold text-white">
              Cart {itemCount > 0 && <span className="text-pharma-400 text-sm">({itemCount} items)</span>}
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-pharma-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-pharma-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-pharma-400 text-sm">Your cart is empty</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-3 text-accent-400 text-sm hover:text-accent-300 transition-colors"
                >
                  Browse products →
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {items.map(item => (
                  <div key={item.productId} className="flex gap-4 p-3 rounded-card bg-pharma-850 border border-pharma-700/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.brand === 'atheryx' ? (
                          <span className="text-brand-atheryx">ATHERYX™</span>
                        ) : (
                          <span className="text-brand-elysion">ELYSION™</span>
                        )}{' '}
                        {item.dosage_mg}mg
                      </p>
                      <p className="text-xs text-pharma-400 mt-0.5">{item.peptide}</p>
                      <p className="text-sm font-medium text-accent-400 mt-1">RM {item.price_myr.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeItem(item.productId)} className="text-pharma-500 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-1 border border-pharma-700 rounded-btn overflow-hidden">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-pharma-300 hover:text-white transition-colors text-sm">−</button>
                        <span className="w-7 h-7 flex items-center justify-center text-white text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-pharma-300 hover:text-white transition-colors text-sm">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-pharma-700 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-pharma-300">Subtotal</span>
                  <span className="text-white font-semibold">RM {subtotal.toLocaleString()}</span>
                </div>
                {isActive && discountPct > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Discount (−{discountPct}% · {sellerCode})</span>
                    <span className="text-green-400">−RM {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-white">RM {discountedSubtotal.toLocaleString()}</span>
                </div>
                <Link
                  to="/cart"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors"
                >
                  View Cart & Checkout
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 text-sm text-pharma-400 hover:text-white transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
