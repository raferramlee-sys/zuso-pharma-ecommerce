import { Helmet } from 'react-helmet-async'
import { useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/product/ProductCard'
import { useProducts } from '../hooks/useProducts'

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const brandFilter = searchParams.get('brand')
  const canonicalUrl = 'https://pharma.zuso-boltz-agentic.app/products'

  const { products, loading } = useProducts()

  const filtered = brandFilter
    ? products.filter(p => p.brand === brandFilter)
    : products

  const pageTitle = brandFilter === 'atheryx'
    ? 'ATHERYX™ Retatrutide Injections Malaysia — FDA Approved Weight Loss Pens'
    : brandFilter === 'elysion'
    ? 'ELYSION™ Tirzepatide Injections Malaysia — FDA Approved Weight Loss Pens'
    : 'Weight Loss Peptides Malaysia — ATHERYX & ELYSION Pens | FDA Approved'

  const pageDesc = brandFilter
    ? `Browse legit ${brandFilter === 'atheryx' ? 'Retatrutide' : 'Tirzepatide'} injections in Malaysia. Precision multi-dose pens, FDA approved. Rx only.`
    : 'Browse legit Retatrutide & Tirzepatide injections in Malaysia. ATHERYX & ELYSION precision multi-dose pens. FDA approved, Rx only. Free shipping available.'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zusopharma" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
        <meta property="og:locale" content="en_MY" />
        <link rel="alternate" hreflang="en-MY" href={canonicalUrl} />
        <link rel="alternate" hreflang="x-default" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Product',
              name: `${p.brand === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'} ${p.peptide} ${p.dosage_mg}mg`,
              url: `https://pharma.zuso-boltz-agentic.app/product/${p.slug}`,
            },
          })),
        })}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">
            {brandFilter === 'atheryx' ? (
              <span className="text-brand-atheryx">ATHERYX™</span>
            ) : brandFilter === 'elysion' ? (
              <span className="text-brand-elysion">ELYSION™</span>
            ) : (
              'All Products'
            )}
          </h1>
          <p className="mt-2 text-pharma-400 text-sm">
            {brandFilter
              ? `${brandFilter === 'atheryx' ? 'Retatrutide' : 'Tirzepatide'} peptide therapy — precision multi-dose pens`
              : 'Advanced peptide therapies in precision multi-dose pens'
            }
          </p>
        </div>

        {/* Brand tabs */}
        {!brandFilter && (
          <div className="flex gap-3 mb-8">
            <a href="/products" className="px-4 py-2 text-sm font-medium rounded-btn bg-accent-500 text-white">All</a>
            <a href="/products?brand=atheryx" className="px-4 py-2 text-sm font-medium rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors">ATHERYX™</a>
            <a href="/products?brand=elysion" className="px-4 py-2 text-sm font-medium rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors">ELYSION™</a>
          </div>
        )}

        {/* Forecast CTA */}
        <div className="mb-8">
          <Link to="/forecast" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-purple-600/30 to-accent-500/20 border border-purple-500/30 hover:border-purple-400 text-sm text-white font-medium transition-all group">
            <span className="text-lg">📊</span>
            <span>Forecast Your BMI</span>
            <span className="text-pharma-400 group-hover:text-white transition-colors">→</span>
          </Link>
          <p className="text-xs text-pharma-500 mt-1.5">Calculate your personalized weight loss timeline with our clinical data-driven calculator</p>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="border-2 border-accent-500 border-t-transparent rounded-full animate-spin w-10 h-10" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-pharma-400">No products found.</p>
          </div>
        )}
      </div>
    </>
  )
}
