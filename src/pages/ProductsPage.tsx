import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/product/ProductCard'
import { products } from '../lib/products'

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const brandFilter = searchParams.get('brand')
  const canonicalUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://zuso-pharma-ecommerce.vercel.app/products'

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

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-pharma-400">No products found.</p>
          </div>
        )}
      </div>
    </>
  )
}
