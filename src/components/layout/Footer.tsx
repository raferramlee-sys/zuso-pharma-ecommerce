export default function Footer() {
  return (
    <footer className="border-t border-pharma-800/50 bg-pharma-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-accent-500">PHARMA</span>
              <span className="text-white/80">.zuso</span>
            </span>
            <p className="mt-2 text-sm text-pharma-300">
              Advanced peptide therapy by Leverage Medical Sdn. Bhd.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Products</h4>
            <ul className="space-y-2 text-sm text-pharma-300">
              <li>ATHERYX™ — Retatrutide</li>
              <li>ELYSION™ — Tirzepatide</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Important</h4>
            <ul className="space-y-2 text-sm text-pharma-300">
              <li>Rx Only — Prescription Required</li>
              <li>Store at 2–8°C — Do Not Freeze</li>
              <li>FDA Approved • MAL Regulated</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-pharma-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-pharma-500">
            © 2026 Leverage Medical Sdn. Bhd. Malaysia. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-pharma-500 font-medium border border-pharma-700 px-2 py-0.5 rounded">FDA APPROVED</span>
            <span className="text-xs text-pharma-500">MAL23056078XZ</span>
            <span className="text-xs text-pharma-500">STERILE A</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
