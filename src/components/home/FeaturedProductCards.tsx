import { Link } from 'react-router-dom'

/** Featured ATHERYX™ / ELYSION™ cards shown in the homepage product carousel. */
export function AtheryxFeaturedCard() {
  return (
    <Link to="/product/atheryx-retatrutide-30mg" className="group relative block h-full atheryx-card rounded-card p-6 transition-all duration-300 overflow-hidden">
      <div className="-mx-6 -mt-6 mb-5 overflow-hidden aspect-[16/10]">
        <img
          src="/atheryx-packaging.webp"
          alt="ATHERYX™ Metabolism Modulator Pen packaging"
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-atheryx/10 rounded-full blur-3xl group-hover:bg-brand-atheryx/20 transition-colors" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-lg font-black text-brand-atheryx tracking-tight">ATHERYX™</span>
            <p className="text-xs font-semibold text-white mt-0.5">METABOLISM MODULATOR PEN</p>
            <p className="text-[10px] text-pharma-400 mt-0.5">TRIPLE INCRETIN-GLUCAGON RECEPTOR AGONIST</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-accent-600/30 text-accent-400 bg-accent-600/10 shrink-0">FDA APPROVED</span>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-3xl font-black text-white">30mg</span>
          <span className="text-xs text-pharma-400">(6mg × 5 doses)</span>
          <span className="ml-auto text-lg font-bold text-white">RM 1,280</span>
        </div>

        {/* Icon row */}
        <div className="flex justify-center gap-3 mt-5 pt-4 border-t border-brand-atheryx/10">
          {[
            ['🎯', 'Precise Dosing'],
            ['🛡️', 'Premium Quality'],
            ['📊', 'Optimal Result'],
            ['🧪', 'Research Backed'],
          ].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-sm opacity-70">{icon}</span>
              <span className="text-[0.55rem] font-semibold text-pharma-400 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function ElysionFeaturedCard() {
  return (
    <Link to="/product/elysion-tirzepatide-30mg" className="group relative block h-full elysion-card rounded-card p-6 transition-all duration-300 overflow-hidden">
      <div className="-mx-6 -mt-6 mb-5 overflow-hidden aspect-[16/10]">
        <img
          src="/elysion-packaging.webp"
          alt="ELYSION™ Metabolism Modulator Pen packaging"
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-elysion/10 rounded-full blur-3xl group-hover:bg-brand-elysion/20 transition-colors" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-lg font-black text-brand-elysion tracking-tight">ELYSION™</span>
            <p className="text-xs font-semibold text-white mt-0.5">METABOLISM MODULATOR PEN</p>
            <p className="text-[10px] text-pharma-400 mt-0.5">DUAL GIP/GLP-1 RECEPTOR AGONIST</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-accent-600/30 text-accent-400 bg-accent-600/10 shrink-0">FDA APPROVED</span>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-3xl font-black text-white">30mg</span>
          <span className="text-xs text-pharma-400">(6mg × 5 doses)</span>
          <span className="ml-auto text-lg font-bold text-white">RM 1,088</span>
        </div>

        {/* Icon row */}
        <div className="flex justify-center gap-3 mt-5 pt-4 border-t border-brand-elysion/10">
          {[
            ['🎯', 'Precise Dosing'],
            ['🛡️', 'Premium Quality'],
            ['📊', 'Optimal Result'],
            ['🧪', 'Research Backed'],
          ].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-sm opacity-70">{icon}</span>
              <span className="text-[0.55rem] font-semibold text-pharma-400 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
