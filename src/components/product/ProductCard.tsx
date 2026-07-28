import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import type { Product } from '../../types'

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const isAtheryx = product.brand === 'atheryx'

  return (
    <div className="group relative holographic-border rounded-card overflow-hidden bg-pharma-850/80 backdrop-blur-sm hover:bg-pharma-800 transition-all duration-300">
      {/* Top accent bar */}
      <div className={`h-1 ${isAtheryx ? 'bg-brand-atheryx' : 'bg-brand-elysion'}`} />

      <div className="p-6">
        {/* Brand + Badge */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-bold tracking-widest uppercase ${isAtheryx ? 'text-brand-atheryx' : 'text-brand-elysion'}`}>
            {isAtheryx ? 'ATHERYX' : 'ELYSION'}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-accent-600/30 text-accent-400 bg-accent-600/10">
            FDA APPROVED
          </span>
        </div>

        {/* Peptide name + Ezipen display name */}
        {product.is_ezipen && product.display_name ? (
          <p className="text-xs font-semibold text-pharma-200 mb-1">{product.display_name}</p>
        ) : (
          <p className="text-xs text-pharma-400 mb-2">{product.peptide}</p>
        )}

        {/* Dosage */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-white">{product.dosage_mg}mg</span>
          <span className="text-xs text-pharma-400">({product.per_dose_mg}mg × {product.doses_per_pen} doses)</span>
        </div>

        {/* Volume / Pen type */}
        <div className="inline-block text-[10px] font-medium px-2 py-0.5 rounded border border-pharma-600 text-pharma-300 mb-4">
          {product.volume_ml} | {product.is_ezipen ? 'Ezipen' : 'Multi-dose Pen'}
        </div>

        {/* Features (3 max) */}
        <ul className="space-y-1.5 mb-6">
          {product.features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-pharma-300">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {/* Price + Actions */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-pharma-500">Price</p>
            <p className="text-xl font-bold text-white">RM {product.price_myr.toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/product/${product.slug}`}
              className="px-3 py-2 text-xs font-medium rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors"
            >
              Details
            </Link>
            <button
              onClick={() => addItem(product.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-btn text-white transition-colors ${isAtheryx ? 'bg-brand-atheryx hover:bg-accent-600' : 'bg-brand-elysion hover:bg-accent-600'}`}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: `inset 0 0 40px ${isAtheryx ? 'rgba(124,58,237,0.08)' : 'rgba(149,117,205,0.08)'}` }} />
    </div>
  )
}
