import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import type { Product } from '../../types'

/* SVG outline icons matching ATHERYX promo graphic */
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const GraphIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)
const FlaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M10 3v5.5L5 19h14L14 8.5V3" />
  </svg>
)

const ATHERYX_ICONS = [
  { icon: TargetIcon, label: 'Precise Dosing' },
  { icon: ShieldIcon, label: 'Premium Quality' },
  { icon: GraphIcon, label: 'Optimal Result' },
  { icon: FlaskIcon, label: 'Research Backed' },
]

const ELYSION_ICONS = [
  { icon: TargetIcon, label: 'Precise Dosing' },
  { icon: ShieldIcon, label: 'Premium Quality' },
  { icon: GraphIcon, label: 'Optimal Result' },
  { icon: FlaskIcon, label: 'Research Backed' },
]

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const isAtheryx = product.brand === 'atheryx'

  // ─── ATHERYX variant — promo-matched layout ───
  if (isAtheryx) {
    return (
      <div className="group relative atheryx-card rounded-card overflow-hidden transition-all duration-300">
        <div className="p-6">
          {/* Header: ATHERYX™ + FDA badge */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-lg font-black text-brand-atheryx tracking-tight">ATHERYX™</span>
              <p className="text-xs font-semibold text-white mt-0.5">METABOLISM MODULATOR PEN</p>
              <p className="text-[10px] text-pharma-400 mt-0.5">TRIPLE INCRETIN-GLUCAGON RECEPTOR AGONIST</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-accent-600/30 text-accent-400 bg-accent-600/10 shrink-0">
              FDA APPROVED
            </span>
          </div>

          {/* Dosage badge */}
          <div className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-brand-atheryx/15 text-brand-atheryx border border-brand-atheryx/20 mb-4">
            {product.volume_ml} PER DOSE
          </div>

          {/* Packaging image */}
          {product.images[0] && (
            <div className="mb-4 rounded-lg overflow-hidden border border-brand-atheryx/15">
              <img src={product.images[0]} alt={product.name} className="w-full object-cover aspect-[16/10]" />
            </div>
          )}

          {/* Peptide name + dosage — KEPT as requested */}
          <p className="text-xs text-pharma-400 mb-1">{product.peptide}</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">{product.dosage_mg}mg</span>
            <span className="text-xs text-pharma-400">({product.per_dose_mg}mg × {product.doses_per_pen} doses)</span>
          </div>
          <p className="text-[10px] font-medium uppercase text-pharma-300 mb-5">{product.doses_per_pen} DOSES</p>

          {/* Icon row */}
          <div className="atheryx-icon-row mb-5">
            {ATHERYX_ICONS.map(({ icon: Icon, label }) => (
              <div key={label} className="atheryx-icon-item">
                <Icon />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Feature boxes */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="atheryx-feature-box">
              <h4>Easy to Use</h4>
              <p>300 clicks dose adjustment. 60 clicks per dose. Needle & alcohol swab included.</p>
            </div>
            <div className="atheryx-feature-box">
              <h4>Purity Certified</h4>
              <p>COA certificate & endotoxin laboratory certified. Safe for use.</p>
            </div>
          </div>

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
                className="px-3 py-2 text-xs font-semibold rounded-btn text-white bg-brand-atheryx hover:bg-accent-600 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(124,58,237,0.1)' }} />
      </div>
    )
  }

  // ─── ELYSION variant — promo-matched layout ───
  return (
    <div className="group relative elysion-card rounded-card overflow-hidden transition-all duration-300">
      <div className="p-6">
        {/* Header: ELYSION™ + FDA badge */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-lg font-black text-brand-elysion tracking-tight">ELYSION™</span>
            {product.is_ezipen && product.display_name ? (
              <p className="text-xs font-semibold text-white mt-0.5">{product.display_name}</p>
            ) : (
              <p className="text-xs font-semibold text-white mt-0.5">METABOLISM MODULATOR PEN</p>
            )}
            <p className="text-[10px] text-pharma-400 mt-0.5">DUAL GIP/GLP-1 RECEPTOR AGONIST</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-accent-600/30 text-accent-400 bg-accent-600/10 shrink-0">
            FDA APPROVED
          </span>
        </div>

        {/* Dosage badge */}
        <div className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-brand-elysion/15 text-brand-elysion border border-brand-elysion/20 mb-4">
          {product.volume_ml} PER DOSE
        </div>

        {/* Packaging image */}
        {product.images[0] && (
          <div className="mb-4 rounded-lg overflow-hidden border border-brand-elysion/15">
            <img src={product.images[0]} alt={product.name} className="w-full object-cover aspect-[16/10]" />
          </div>
        )}

        {/* Peptide name + dosage */}
        <p className="text-xs text-pharma-400 mb-1">{product.peptide}</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-white">{product.dosage_mg}mg</span>
          <span className="text-xs text-pharma-400">({product.per_dose_mg}mg × {product.doses_per_pen} doses)</span>
        </div>
        <p className="text-[10px] font-medium uppercase text-pharma-300 mb-5">{product.doses_per_pen} DOSES</p>

        {/* Icon row */}
        <div className="elysion-icon-row mb-5">
          {ELYSION_ICONS.map(({ icon: Icon, label }) => (
            <div key={label} className="elysion-icon-item">
              <Icon />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Feature boxes */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="elysion-feature-box">
            <h4>Easy to Use</h4>
            <p>300 clicks dose adjustment. 60 clicks per dose. Needle & alcohol swab included.</p>
          </div>
          <div className="elysion-feature-box">
            <h4>Purity Certified</h4>
            <p>COA certificate & endotoxin laboratory certified. Safe for use.</p>
          </div>
        </div>

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
              className="px-3 py-2 text-xs font-semibold rounded-btn text-white bg-brand-elysion hover:bg-accent-600 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(74,90,160,0.1)' }} />
    </div>
  )
}
