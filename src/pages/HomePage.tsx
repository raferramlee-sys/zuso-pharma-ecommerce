import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import TestimonialCarousel from '../components/home/TestimonialCarousel'
import TrustTicker from '../components/home/TrustTicker'
import ScienceInMotion from '../components/home/ScienceInMotion'
import { AtheryxFeaturedCard, ElysionFeaturedCard } from '../components/home/FeaturedProductCards'
import { useScrollMotion } from '../hooks/useScrollMotion'

const ProductSwiper = lazy(() => import('../components/home/ProductSwiper'))

export default function HomePage() {
  const canonicalUrl = 'https://pharma.zuso-boltz-agentic.app'
  const rootRef = useRef<HTMLDivElement>(null)
  useScrollMotion(rootRef)

  // Load Swiper only as the product section approaches the viewport
  const swiperSlotRef = useRef<HTMLDivElement>(null)
  const [showSwiper, setShowSwiper] = useState(false)
  useEffect(() => {
    const slot = swiperSlotRef.current
    if (!slot) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShowSwiper(true); io.disconnect() }
    }, { rootMargin: '400px 0px' })
    io.observe(slot)
    return () => io.disconnect()
  }, [])

  const staticCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AtheryxFeaturedCard />
      <ElysionFeaturedCard />
    </div>
  )

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
        <meta property="og:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_MY" />
        <link rel="alternate" hreflang="en-MY" href={canonicalUrl} />
        <link rel="alternate" hreflang="x-default" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zusopharma" />
        <meta name="twitter:title" content="ATHERYX™ & ELYSION™ — Peptide Therapy Malaysia | FDA Approved" />
        <meta name="twitter:description" content="Advanced peptide therapy in Malaysia. ATHERYX Retatrutide & ELYSION Tirzepatide — legit, FDA-approved weight loss injections." />
        <meta name="twitter:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(webJsonLd)}</script>
      </Helmet>

      <div ref={rootRef}>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="ambient-orb w-[520px] h-[520px] left-1/2 -translate-x-1/2 -top-40" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20 lg:pt-24">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="hero-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-600/30 bg-accent-600/5 mb-8">
                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                <span className="text-xs font-medium text-accent-400">Advanced Peptide Therapy</span>
              </div>

              <h1 className="hero-rise heading-display text-5xl sm:text-6xl lg:text-7xl text-white" style={{ animationDelay: '80ms' }}>
                Precision Peptide
                <br />
                Therapy{' '}
                <em
                  className="holographic-shimmer pr-1"
                  style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Redefined
                </em>
              </h1>

              {/* ATHERYX Pen — clean, no frame, no glow */}
              <div className="hero-rise mt-10 flex justify-center" style={{ animationDelay: '160ms' }}>
                <img
                  src="/atheryx-pen.webp"
                  alt="ATHERYX™ Precision Peptide Pen"
                  width={1280}
                  height={960}
                  fetchPriority="high"
                  decoding="async"
                  className="w-[480px] sm:w-[616px] md:w-[704px] h-auto object-contain"
                  style={{ mixBlendMode: 'lighten' }}
                />
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                {['FDA APPROVED', 'MAL REGULATED', 'STERILE A', 'Rx Only'].map(badge => (
                  <span key={badge} className="text-[11px] font-semibold tracking-widest text-pharma-400 border border-pharma-700/50 px-3 py-1 rounded">
                    {badge}
                  </span>
                ))}
              </div>

              <p className="mt-8 text-lg text-pharma-300 max-w-xl mx-auto leading-relaxed">
                ATHERYX™ Retatrutide and ELYSION™ Tirzepatide — 
                clinically advanced peptide therapies in precision multi-dose pens. 
                FDA approved, manufactured in Malaysia.
              </p>

              {/* Explore Products — packaging card */}
              <Link to="/products" className="block mt-10 max-w-md mx-auto group">
                <div className="relative rounded-xl overflow-hidden border border-brand-atheryx/20 hover:border-brand-atheryx/50 transition-all duration-300 shadow-lg shadow-brand-atheryx/10 hover:shadow-brand-atheryx/25">
                  <img
                    src="/atheryx-packaging.webp"
                    alt="ATHERYX™ Metabolism Modulator Pen — Explore Products"
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover aspect-[16/10] group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pharma-950/90 via-pharma-950/20 to-transparent flex items-end justify-center pb-5">
                    <span className="px-6 py-2.5 rounded-btn bg-accent-500/90 backdrop-blur-sm text-white text-sm font-semibold group-hover:bg-accent-500 transition-colors shadow-lg">
                      Explore Products →
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-pharma-400 mt-3">ATHERYX™ — Precision peptide therapy in Malaysia</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust ticker */}
        <TrustTicker />

        {/* Features Grid — numbered 01–04 */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div data-reveal-stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: '🎯', title: ['Precise', 'Dosing'], desc: 'Multi-dose pen with adjustable delivery' },
              { icon: '🔬', title: ['Research', 'Backed'], desc: 'Clinically proven peptide formulations' },
              { icon: '✨', title: ['Premium', 'Quality'], desc: 'Pharmaceutical grade manufacturing' },
              { icon: '🏆', title: ['Optimal', 'Results'], desc: 'Advanced agonist mechanisms' },
            ].map((f, i) => (
              <div key={i} className="group relative p-5 sm:p-6 rounded-card bg-pharma-850/50 border border-pharma-800/50 hover:border-accent-500/40 transition-colors duration-300">
                <div className="flex items-start justify-between mb-8 sm:mb-12">
                  <span className="heading-display text-3xl sm:text-4xl text-pharma-500 group-hover:text-accent-300 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xl" aria-hidden="true">{f.icon}</span>
                </div>
                <h3 className="heading-display text-lg sm:text-xl text-white mb-1.5">
                  {f.title[0]} <em>{f.title[1]}</em>
                </h3>
                <p className="text-xs sm:text-sm text-pharma-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products — swipeable */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
          <div data-reveal className="text-center mb-12">
            <h2 className="heading-display text-4xl sm:text-5xl text-white">Featured <em>Products</em></h2>
            <p className="mt-3 text-pharma-400 text-sm">Choose the right peptide therapy for your needs</p>
          </div>

          <div data-reveal ref={swiperSlotRef}>
            {showSwiper ? <Suspense fallback={staticCards}><ProductSwiper /></Suspense> : staticCards}
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

        {/* Science in motion */}
        <ScienceInMotion />

        {/* Testimonial Carousel */}
        <div data-reveal>
          <TestimonialCarousel />
        </div>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div data-reveal className="relative holographic-border rounded-[2rem] overflow-hidden bg-pharma-850/50 p-10 sm:p-16 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-accent-500/10 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="heading-display text-3xl sm:text-5xl text-white mb-5">
                Ready to experience advanced <em>peptide therapy?</em>
              </h2>
              <p className="text-pharma-300 text-sm max-w-md mx-auto mb-8">
                Browse our full range of ATHERYX™ and ELYSION™ peptide pens. 
                Prescription required — consult your healthcare provider.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/products"
                  className="px-8 py-3.5 rounded-full bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors"
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
