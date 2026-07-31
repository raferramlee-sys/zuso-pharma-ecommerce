import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'

export default function Navbar() {
  const { itemCount, setIsOpen } = useCart()
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-pharma-950/80 backdrop-blur-xl border-b border-pharma-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">
                <span className="text-accent-500">PHARMA</span>
                <span className="text-white/80">.zuso</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/products"
                className={`text-sm transition-colors ${location.pathname === '/products' ? 'text-accent-400' : 'text-pharma-300 hover:text-white'}`}
              >
                Products
              </Link>
              <Link
                to="/products?brand=atheryx"
                className={`text-sm transition-colors ${location.search.includes('atheryx') ? 'text-brand-atheryx' : 'text-pharma-300 hover:text-white'}`}
              >
                ATHERYX
              </Link>
              <Link
                to="/products?brand=elysion"
                className={`text-sm transition-colors ${location.search.includes('elysion') ? 'text-brand-elysion' : 'text-pharma-300 hover:text-white'}`}
              >
                ELYSION
              </Link>
              <Link
                to="/seller-login"
                className="text-sm text-pharma-400 hover:text-accent-400 transition-colors ml-4 pl-4 border-l border-pharma-700/50"
              >
                Seller
              </Link>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-btn bg-pharma-800 hover:bg-pharma-700 transition-colors border border-pharma-700"
          >
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-accent-500 text-white text-xs font-bold rounded-full">
                {itemCount}
              </span>
            )}
            <span className="hidden sm:inline text-sm text-pharma-200">Cart</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
