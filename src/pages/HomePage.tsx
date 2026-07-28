import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { products } from '../lib/products'
import ProductCard from '../components/product/ProductCard'

export default function HomePage() {
  const canonicalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zuso-pharma-ecommerce.vercel.app'

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'Zuso Pharma',
    url: canonicalUrl,
    description: 'Advanced peptide therapy clinic in Malaysia — ATHERYX Retatrutide & ELYSION Tirzepatide injections.',
    areaServed: 'Malaysia',
    knowsAbout: ['Retatrutide', 'Tirzepatide', 'GLP-1', 'GIP', 'Peptide Therapy', 'Weight Loss'],
  }

  const webJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zuso Pharma — Peptide Therapy Malaysia',
    url: canonicalUrl,
    description: 'Advanced peptide therapy in Malaysia. ATHERYX Retatrutide & ELYSION Tirzepatide — legit, FDA-approved weight loss injections.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${canonicalUrl}/products`,
      'query-input': 'required name=search_term',
    },
  }

  return (
    <>
      <Helmet>
        <title>ATHERYX™ & ELYSION™ — Peptide Therapy Malaysia | FDA Approved</title>
        <meta name="description" content="Advanced peptide therapy in Malaysia. ATHERYX Retatrutide & ELYSION Tirzepatide — legit, FDA-approved weight loss injections in precision multi-dose pens. Rx only." />
        <meta name="keywords" content="retatrutide Malaysia legit, tirzepatide Malaysia, weight loss injection Malaysia, peptide therapy Malaysia FDA approved, GLP-1 Malaysia clinic, rawatan kurus Malaysia, suntikan penurunan berat badan" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="ATHERYX™ & ELYSION™ — Peptide Therapy Malaysia | FDA Approved" />
        <meta property="og:description" content="Advanced peptide therapy in Malaysia. ATHERYX Retatrutide & ELYSION Tirzepatide — legit, FDA-approved weight loss injections." />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(webJsonLd)}</script>
      </Helmet>

      <div>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-600/5 via-transparent to-pharma-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent-500/10 rounded-full blur-[120px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-600/30 bg-accent-600/5 mb-8">
                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                <span className="text-xs font-medium text-accent-400">Advanced Peptide Therapy</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                <span className="text-white">Precision Peptide</span>
                <br />
                <span className="holographic-shimmer bg-clip-text text-transparent">
                  Therapy Redefined
                </span>
              </h1>

              <p className="mt-6 text-lg text-pharma-300 max-w-xl mx-auto leading-relaxed">
                ATHERYX™ Retatrutide and ELYSION™ Tirzepatide — 
                clinically advanced peptide therapies in precision multi-dose pens. 
                FDA approved, manufactured in Malaysia.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <Link
                  to="/products"
                  className="px-8 py-3.5 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors shadow-lg shadow-accent-500/20"
                >
                  Explore Products
                </Link>
                <Link
                  to="/products"
                  className="px-8 py-3.5 rounded-btn border border-pharma-600 text-pharma-200 hover:text-white hover:border-pharma-400 transition-colors"
                >
                  Learn More
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
                {['FDA APPROVED', 'MAL REGULATED', 'STERILE A', 'Rx Only'].map(badge => (
                  <span key={badge} className="text-[11px] font-semibold tracking-widest text-pharma-500 border border-pharma-700/50 px-3 py-1 rounded">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🎯', title: 'Precise Dosing', desc: 'Multi-dose pen with adjustable delivery' },
              { icon: '🔬', title: 'Research Backed', desc: 'Clinically proven peptide formulations' },
              { icon: '✨', title: 'Premium Quality', desc: 'Pharmaceutical grade manufacturing' },
              { icon: '🏆', title: 'Optimal Results', desc: 'Advanced agonist mechanisms' },
            ].map((f, i) => (
              <div key={i} className="p-5 rounded-card bg-pharma-850/50 border border-pharma-800/50 text-center hover:border-pharma-600/50 transition-colors">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-pharma-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Products</h2>
            <p className="mt-2 text-pharma-400 text-sm">Choose the right peptide therapy for your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ATHERYX Featured Card */}
            <Link to="/product/atheryx-retatrutide-30mg" className="group relative holographic-border rounded-card p-6 bg-pharma-850/80 hover:bg-pharma-800 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-atheryx/10 rounded-full blur-3xl group-hover:bg-brand-atheryx/20 transition-colors" />
              <div className="relative">
                <span className="text-xs font-bold tracking-widest uppercase text-brand-atheryx">ATHERYX™</span>
                <h3 className="text-xl font-bold text-white mt-2">Retatrutide</h3>
                <p className="text-sm text-pharma-400 mt-1">Triple-agonist • GLP-1 / GIP / Glucagon</p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-3xl font-black text-white">30mg</span>
                  <span className="text-xs text-pharma-400">(6mg × 5 doses)</span>
                  <span className="ml-auto text-lg font-bold text-white">RM 1,280</span>
                </div>
              </div>
            </Link>

            {/* ELYSION Featured Card */}
            <Link to="/product/elysion-tirzepatide-30mg" className="group relative holographic-border rounded-card p-6 bg-pharma-850/80 hover:bg-pharma-800 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-elysion/10 rounded-full blur-3xl group-hover:bg-brand-elysion/20 transition-colors" />
              <div className="relative">
                <span className="text-xs font-bold tracking-widest uppercase text-brand-elysion">ELYSION™</span>
                <h3 className="text-xl font-bold text-white mt-2">Tirzepatide</h3>
                <p className="text-sm text-pharma-400 mt-1">Dual-agonist • GIP / GLP-1</p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-3xl font-black text-white">30mg</span>
                  <span className="text-xs text-pharma-400">(6mg × 5 doses)</span>
                  <span className="ml-auto text-lg font-bold text-white">RM 1,088</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors text-sm font-medium"
            >
              View all products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative holographic-border rounded-card overflow-hidden bg-pharma-850/50 p-10 sm:p-16 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-accent-500/10 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to experience advanced peptide therapy?
              </h2>
              <p className="text-pharma-300 text-sm max-w-md mx-auto mb-8">
                Browse our full range of ATHERYX™ and ELYSION™ peptide pens. 
                Prescription required — consult your healthcare provider.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/products"
                  className="px-8 py-3.5 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors"
                >
                  Shop Now
                </Link>
                <span className="text-xs text-pharma-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  FDA Approved • Rx Only
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
