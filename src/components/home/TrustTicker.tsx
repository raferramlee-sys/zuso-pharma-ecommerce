/**
 * Infinite CSS marquee of proof points. Edit TRUST_POINTS to change what scrolls.
 * The list is rendered twice so the -50% translate loops seamlessly; the copy
 * is hidden from screen readers (and from view under reduced motion).
 */
const TRUST_POINTS = [
  'Prescription only',
  'Pre-screening before every order',
  'Stored at 2–8 °C',
  'Precision multi-dose pens',
  'WhatsApp support',
  'Free shipping available',
  'Leverage Medical Sdn. Bhd.',
]

function Group({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {TRUST_POINTS.map(point => (
        <li key={point} className="flex items-center gap-6 px-6 whitespace-nowrap text-xs sm:text-sm text-pharma-200 tracking-wide">
          <span>{point}</span>
          <span className="w-1 h-1 rounded-full bg-accent-400" aria-hidden="true" />
        </li>
      ))}
    </ul>
  )
}

export default function TrustTicker() {
  return (
    <section aria-label="Why patients choose Zuso Pharma" className="border-y border-pharma-800/60 bg-pharma-900/60 py-4">
      <div className="ticker">
        <div className="ticker-track">
          <Group />
          <Group hidden />
        </div>
      </div>
    </section>
  )
}
