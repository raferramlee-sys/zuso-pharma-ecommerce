import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { products } from '../lib/products'
import { useCart } from '../hooks/useCart'
import { useSellerDiscount, getDiscountedPrice } from '../hooks/useSellerDiscount'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { discountPct, isActive } = useSellerDiscount()
  const product = products.find(p => p.slug === slug)

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Product not found</h1>
        <Link to="/products" className="text-accent-400 mt-4 inline-block">← Back to products</Link>
      </div>
    )
  }

  const isAtheryx = product.brand === 'atheryx'
  const brandColor = isAtheryx ? 'text-brand-atheryx' : 'text-brand-elysion'
  const bgGlow = isAtheryx ? 'bg-brand-atheryx/10' : 'bg-brand-elysion/10'
  const brandName = isAtheryx ? 'ATHERYX' : 'ELYSION'

  const canonicalUrl = `https://pharma.zuso-boltz-agentic.app/product/${product.slug}`
  const pageTitle = `${brandName}™ ${product.peptide} ${product.dosage_mg}mg Malaysia — RM ${product.price_myr.toLocaleString()}`
  const descriptionExcerpt = product.description.length > 160 ? product.description.substring(0, 157) + '...' : product.description

  // JSON-LD Product schema
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brandName}™ ${product.peptide} ${product.dosage_mg}mg`,
    description: product.description,
    sku: product.lot,
    brand: {
      '@type': 'Brand',
      name: `${brandName}™`,
    },
    offers: {
      '@type': 'Offer',
      price: product.price_myr.toString(),
      priceCurrency: 'MYR',
      availability: product.active && product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Zuso Pharma',
    },
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={descriptionExcerpt} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={descriptionExcerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={product.price_myr.toString()} />
        <meta property="product:price:currency" content="MYR" />
        <meta property="og:image" content={isAtheryx ? 'https://pharma.zuso-boltz-agentic.app/atheryx-packaging.jpg' : 'https://pharma.zuso-boltz-agentic.app/elysion-packaging.jpg'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zusopharma" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={descriptionExcerpt} />
        <meta name="twitter:image" content={isAtheryx ? 'https://pharma.zuso-boltz-agentic.app/atheryx-packaging.jpg' : 'https://pharma.zuso-boltz-agentic.app/elysion-packaging.jpg'} />
        <meta property="og:locale" content="en_MY" />
        <link rel="alternate" hreflang="en-MY" href={canonicalUrl} />
        <link rel="alternate" hreflang="x-default" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-10">
          <Link to="/" className="text-pharma-400 hover:text-white transition-colors">Home</Link>
          <span className="text-pharma-600">/</span>
          <Link to="/products" className="text-pharma-400 hover:text-white transition-colors">Products</Link>
          <span className="text-pharma-600">/</span>
          <span className="text-pharma-200">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left — Product Image */}
          <div className="relative">
            {product.images[0] ? (
              <div className="rounded-card overflow-hidden border border-pharma-700/50">
                <img src={product.images[0]} alt={product.name} className="w-full object-cover aspect-square" />
              </div>
            ) : (
              <div className={`aspect-square rounded-card ${bgGlow} border border-pharma-700/50 flex items-center justify-center overflow-hidden`}>
                <div className="text-center p-10">
                  <div className={`text-8xl font-black ${brandColor} opacity-30 mb-4`}>
                    {isAtheryx ? 'A' : 'E'}
                  </div>
                  <p className="text-pharma-400 text-sm">Product Image</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — Product Info */}
          <div>
            {/* Brand + Badges */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-bold tracking-widest uppercase ${brandColor}`}>
                {brandName}™
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-accent-600/30 text-accent-400 bg-accent-600/10">
                FDA APPROVED
              </span>
            </div>

            <h1 className="text-3xl font-black text-white">{product.peptide}</h1>
            <p className="text-sm text-pharma-400 mt-1">For Subcutaneous Use Only</p>

            {/* Dosage */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-5xl font-black text-white">{product.dosage_mg}mg</span>
              <span className="text-sm text-pharma-400">({product.per_dose_mg}mg × {product.doses_per_pen} doses)</span>
            </div>

            <div className="inline-block text-xs font-medium px-3 py-1 rounded border border-pharma-600 text-pharma-300 mt-3">
              {product.volume_ml} | Multi-dose Pen
            </div>

            {/* Ezipen display name */}
            {product.is_ezipen && product.display_name && (
              <p className="mt-3 text-sm font-semibold text-pharma-200 bg-pharma-850/60 px-3 py-1.5 rounded border border-pharma-700/50">{product.display_name}</p>
            )}

            {/* Description */}
            <p className="mt-6 text-pharma-300 leading-relaxed text-sm">{product.description}</p>

            {/* Features */}
            <div className="mt-8 space-y-3">
              {product.features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-pharma-300">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            {/* Product Info */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ['LOT', product.lot],
                ['EXP', product.exp],
                ['MAL', product.mal_number],
                ['SN', product.lot + '00001'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded bg-pharma-850/50 border border-pharma-700/50">
                  <p className="text-[10px] text-pharma-500">{label}</p>
                  <p className="text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="mt-10 flex items-end justify-between">
              <div>
                <p className="text-xs text-pharma-500 mb-1">Price</p>
                {isActive && discountPct > 0 ? (
                  <>
                    <p className="text-xs text-pharma-500 line-through">RM {product.price_myr.toLocaleString()}</p>
                    <p className="text-3xl font-bold text-green-400">
                      RM {getDiscountedPrice(product.price_myr, discountPct).toLocaleString()}
                      <span className="ml-2 text-sm font-medium text-green-400/70">−{discountPct}%</span>
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-white">RM {product.price_myr.toLocaleString()}</p>
                )}
                <p className="text-xs text-pharma-500 mt-1">Sterile A · Rx Only</p>
              </div>
              <button
                onClick={() => addItem(product.id)}
                className={`px-8 py-3.5 rounded-btn text-white font-semibold transition-colors ${isAtheryx ? 'bg-brand-atheryx hover:bg-accent-600' : 'bg-brand-elysion hover:bg-accent-600'} shadow-lg ${isAtheryx ? 'shadow-brand-atheryx/20' : 'shadow-brand-elysion/20'}`}
              >
                Add to Cart — RM {(isActive && discountPct > 0 ? getDiscountedPrice(product.price_myr, discountPct) : product.price_myr).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
