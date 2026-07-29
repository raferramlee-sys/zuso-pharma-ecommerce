import { useEffect, useState, useCallback, useRef } from 'react'
import type { ForecastRow } from '../../lib/forecast-model'

interface ForecastChartProps {
  atheryxRows: ForecastRow[]
  elysionRows: ForecastRow[]
  startingWeight: number
  targetWeight: number
  intervalWeeks: number
}

type TooltipData = {
  week: number
  date: string
  dose_mg: number
  weight_kg: number
  cumulative_loss_kg: number
  cumulative_loss_pct: number
} | null

// ── Catmull-Rom → Cubic Bezier conversion (alpha=0.5 centripetal) ──
function catmullRomToBezier(
  points: { x: number; y: number }[],
  alpha: number = 0.5
): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const dt = (p0: { x: number; y: number }, p1: { x: number; y: number }) => {
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    return Math.pow(dx * dx + dy * dy, alpha / 2)
  }

  const n = points.length
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]

    const t01 = dt(p0, p1)
    const t12 = dt(p1, p2)
    const t23 = dt(p2, p3)

    const m1x = (p2.x - p1.x + t12 * ((p1.x - p0.x) / (t01 || 1) - (p2.x - p0.x) / (t01 + t12 || 1))) * (i > 0 ? 1 : 0)
    const m1y = (p2.y - p1.y + t12 * ((p1.y - p0.y) / (t01 || 1) - (p2.y - p0.y) / (t01 + t12 || 1))) * (i > 0 ? 1 : 0)
    const m2x = (p2.x - p1.x + t12 * ((p3.x - p2.x) / (t23 || 1) - (p3.x - p1.x) / (t12 + t23 || 1))) * (i < n - 2 ? 1 : 0)
    const m2y = (p2.y - p1.y + t12 * ((p3.y - p2.y) / (t23 || 1) - (p3.y - p1.y) / (t12 + t23 || 1))) * (i < n - 2 ? 1 : 0)

    const c1x = p1.x + m1x / 3
    const c1y = p1.y + m1y / 3
    const c2x = p2.x - m2x / 3
    const c2y = p2.y - m2y / 3

    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return d
}

export default function ForecastChart({ atheryxRows, elysionRows, startingWeight, targetWeight, intervalWeeks }: ForecastChartProps) {
  const [animPhase, setAnimPhase] = useState(0)
  const [dotProgress, setDotProgress] = useState(0)
  const [selectedPath, setSelectedPath] = useState<'atheryx' | 'elysion'>('atheryx')
  const [tooltip, setTooltip] = useState<TooltipData>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const activeRows = selectedPath === 'atheryx' ? atheryxRows : elysionRows
  const brandColor = selectedPath === 'atheryx' ? '#c084fc' : '#60a5fa'
  const brandColor2 = selectedPath === 'atheryx' ? '#a78bfa' : '#3b82f6'
  const brandAccent = selectedPath === 'atheryx' ? '#7c3aed' : '#2563eb'

  useEffect(() => {
    if (activeRows.length === 0) return
    setAnimPhase(0); setDotProgress(0); setTooltip(null)
    const t1 = setTimeout(() => setAnimPhase(1), 200)
    const t2 = setTimeout(() => setAnimPhase(2), 2500)
    const start = Date.now()
    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 2200)
      setDotProgress(p); if (p >= 1) clearInterval(interval)
    }, 30)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval) }
  }, [activeRows])

  const handlePointClick = useCallback((row: ForecastRow, idx: number, points: { x: number; y: number }[]) => {
    setTooltip({
      week: row.week,
      date: row.date,
      dose_mg: row.dose_mg,
      weight_kg: row.weight_kg,
      cumulative_loss_kg: row.cumulative_loss_kg,
      cumulative_loss_pct: row.cumulative_loss_pct,
    })
    // Position tooltip above the point
    const pt = points[idx]
    setTooltipPos({ x: pt.x, y: pt.y - 20 })
  }, [])

  if (activeRows.length === 0) return null

  const svgW = 600; const svgH = 280
  const padX = 55; const padY = 35
  const maxW = startingWeight + 2
  const minW = targetWeight - 2
  const wRange = maxW - minW

  const points = activeRows.map((r, i) => {
    const x = padX + (i / Math.max(activeRows.length - 1, 1)) * (svgW - padX * 2)
    const y = padY + ((maxW - r.weight_kg) / wRange) * (svgH - padY * 2)
    return { x, y }
  })

  const pathD = catmullRomToBezier(points)
  const fillD = `${pathD} L ${points[points.length - 1].x} ${svgH - padY} L ${points[0].x} ${svgH - padY} Z`
  const approxPathLength = points.length * 15

  const dotIndex = Math.floor(dotProgress * (points.length - 1))
  const dotFrac = dotProgress * (points.length - 1) - dotIndex
  const ni = Math.min(dotIndex + 1, points.length - 1)
  const dotX = points[dotIndex].x + (points[ni].x - points[dotIndex].x) * dotFrac
  const dotY = points[dotIndex].y + (points[ni].y - points[dotIndex].y) * dotFrac

  return (
    <div>
      {/* Path toggle */}
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-semibold text-white">📈 Projected Weight Loss Curve</h3>
        <div className="flex rounded-lg overflow-hidden border border-pharma-700 text-xs">
          <button onClick={() => setSelectedPath('atheryx')}
            className={`px-3 py-1.5 ${selectedPath === 'atheryx' ? 'bg-purple-600/30 text-purple-300' : 'bg-pharma-800 text-pharma-400'}`}>
            ATHERYX
          </button>
          <button onClick={() => setSelectedPath('elysion')}
            className={`px-3 py-1.5 ${selectedPath === 'elysion' ? 'bg-blue-600/30 text-blue-300' : 'bg-pharma-800 text-pharma-400'}`}>
            ELYSION
          </button>
        </div>
      </div>

      {/* Kinesthetic hint */}
      <p className="text-xs text-pharma-500 mb-2">
        👆 Tap any point on the curve to see dose & weight details
      </p>

      {animPhase > 0 && (
        <div className="flex gap-6 mb-3 text-xs">
          <span className="text-pharma-400">Week <span className="text-white font-mono">{Math.max(1, dotIndex + 1)}</span></span>
          <span className="text-pharma-400">Weight <span className="text-white font-mono">{points[dotIndex] ? activeRows[Math.min(dotIndex, activeRows.length - 1)].weight_kg.toFixed(1) : startingWeight} kg</span></span>
          <span className="text-pharma-400">Loss <span className="text-accent-400 font-mono">−{(startingWeight - activeRows[Math.min(dotIndex, activeRows.length - 1)].weight_kg).toFixed(1)} kg</span></span>
        </div>
      )}

      <div className="relative rounded-xl border border-pharma-700 bg-pharma-800/30 p-4 overflow-hidden">
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={brandColor} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={brandColor2} /><stop offset="100%" stopColor={brandColor} />
            </linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="dg"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* Background click to dismiss */}
          <rect x={0} y={0} width={svgW} height={svgH} fill="transparent"
            onClick={() => setTooltip(null)} />

          {/* Target line */}
          <line x1={padX} y1={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)} x2={svgW - padX} y2={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)}
            stroke="#22c55e" strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />
          <text x={svgW - padX - 5} y={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2) - 6}
            textAnchor="end" fill="#22c55e" fontSize="9">Target {targetWeight}kg</text>

          {/* Fill */}
          <path d={fillD} fill="url(#cg)" opacity={animPhase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.6s ease-out' }} />

          {/* Animated line */}
          <path d={pathD} fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)"
            strokeDasharray={approxPathLength} strokeDashoffset={animPhase >= 1 ? 0 : approxPathLength}
            style={{ transition: animPhase >= 1 ? 'stroke-dashoffset 2.2s ease-in-out' : 'none' }} />

          {/* Clickable hit areas + visible dots */}
          {activeRows.map((row, i) => {
            const pt = points[i]
            const isEvery4th = row.week % 4 === 0 || i === 0 || i === activeRows.length - 1
            return (
              <g key={i}>
                {/* Invisible wide hit area */}
                <rect
                  x={pt.x - 12} y={pt.y - 12} width={24} height={24}
                  fill="transparent" style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); handlePointClick(row, i, points) }}
                />
                {/* Visible dot (every 4th week + first/last) */}
                {isEvery4th && (
                  <circle cx={pt.x} cy={pt.y} r={i === activeRows.length - 1 ? 4 : 2.5}
                    fill={i === activeRows.length - 1 ? '#22c55e' : brandColor}
                    opacity={0.7} filter="url(#glow)"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); handlePointClick(row, i, points) }}
                  />
                )}
              </g>
            )
          })}

          {/* Tooltip */}
          {tooltip && (
            <g>
              {/* Connector line */}
              <line x1={tooltipPos.x} y1={tooltipPos.y + 18} x2={tooltipPos.x} y2={tooltipPos.y + 8}
                stroke={brandColor} strokeWidth="1" opacity="0.6" />
              {/* Tooltip background */}
              <rect x={tooltipPos.x - 70} y={tooltipPos.y - 48} width={140} height={46}
                rx="6" fill="#1e1b4b" stroke={brandColor} strokeWidth="1" opacity="0.95" />
              <text x={tooltipPos.x} y={tooltipPos.y - 32} textAnchor="middle" fill="#a5b4fc" fontSize="8" fontWeight="600">
                Week {tooltip.week} — {tooltip.date}
              </text>
              <text x={tooltipPos.x} y={tooltipPos.y - 18} textAnchor="middle" fill={brandColor} fontSize="9" fontWeight="700">
                {tooltip.dose_mg}mg · {tooltip.weight_kg}kg · −{tooltip.cumulative_loss_kg}kg ({tooltip.cumulative_loss_pct}%)
              </text>
              {/* Close hint */}
              <text x={tooltipPos.x} y={tooltipPos.y - 4} textAnchor="middle" fill="#6b7280" fontSize="6">
                tap anywhere to close
              </text>
            </g>
          )}

          {/* Start dot */}
          <circle cx={points[0].x} cy={points[0].y} r="4" fill={brandColor2} filter="url(#glow)" />

          {/* Auto-animating dot (intro) */}
          {animPhase >= 1 && (
            <>
              <circle cx={dotX} cy={dotY} r="5" fill={brandColor} filter="url(#dg)" />
              <circle cx={dotX} cy={dotY} r="10" fill="none" stroke={brandColor} strokeWidth="1.5" opacity="0.5">
                <animate attributeName="r" from="8" to="16" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* End dot */}
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#22c55e" filter="url(#glow)"
            opacity={animPhase >= 2 ? 1 : 0} style={{ transition: 'opacity 0.4s ease-out' }} />
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-[0.6rem] text-pharma-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: brandColor2 }} /> {selectedPath === 'atheryx' ? 'ATHERYX' : 'ELYSION'} dose every {intervalWeeks} weeks
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} /> Target {targetWeight}kg
          </span>
        </div>
      </div>
    </div>
  )
}
