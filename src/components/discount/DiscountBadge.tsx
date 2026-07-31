import { useSellerDiscount } from '../../hooks/useSellerDiscount'

export default function DiscountBadge() {
  const { sellerCode, discountPct, isActive } = useSellerDiscount()
  if (!isActive || !discountPct) return null
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs">
      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-green-400 font-medium">−{discountPct}%</span>
      <span className="text-pharma-500 font-mono">| {sellerCode}</span>
    </div>
  )
}
