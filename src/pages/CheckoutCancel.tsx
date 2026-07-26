import { Link } from 'react-router-dom'

export default function CheckoutCancel() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="holographic-border rounded-card p-12 bg-pharma-850/30">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Checkout Cancelled</h1>
        <p className="text-pharma-300 text-sm mb-6">
          Your payment was not processed. Your cart items are saved — you can try again anytime.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/cart"
            className="px-6 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors"
          >
            Return to Cart
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}
