import { useEffect, useState } from 'react'
import type { ForecastRow } from '../../lib/forecast-model'

interface ForecastChartProps {
  atheryxRows: ForecastRow[]
  elysionRows: ForecastRow[]
  startingWeight: number
  targetWeight: number
}

export default function ForecastChart({ atheryxRows, elysionRows, startingWeight, targetWeight }: ForecastChartProps) {
  const [animPhase, setAnimPhase] = useState(0)
  const [dotProgress, setDotProgress] = useState(0)
  const [selectedPath, setSelectedPath] = useState<'atheryx' | 'elysion'>('atheryx')

  const activeRows = selectedPath === 'atheryx' ? atheryxRows : elysionRows
  const brandColor = selectedPath === 'atheryx' ? '#c084fc' : '#60a5fa'
  const brandColor2 = selectedPath === 'atheryx' ? '#a78bfa' : '#3b82f6'
  const brandName = selectedPath === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'

  useEffect(() => {
    if (activeRows.length === 0) return
    setAnimPhase(0); setDotProgress(0)
    const t1 = setTimeout(() => setAnimPhase(1), 200)
    const t2 = setTimeout(() => setAnimPhase(2), 2500)
    const start = Date.now()
    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 2200)
      setDotProgress(p); if (p >= 1) clearInterval(interval)
    }, 30)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval) }
  }, [activeRows])

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

  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 3
    const cp2x = points[i].x + (2 * (points[i + 1].x - points[i].x)) / 3
    pathD += ` C ${cp1x} ${points[i].y}, ${cp2x} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`
  }

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

      {/* Ghost of other path */}
      <p className="text-xs text-pharma-500 mb-2">
        {selectedPath === 'atheryx' ? 'ELYSION™' : 'ATHERYX™'} path shown as faint reference
      </p>

      {animPhase > 0 && (
        <div className="flex gap-6 mb-3 text-xs">
          <span className="text-pharma-400">Week <span className="text-white font-mono">{Math.max(1, dotIndex + 1)}</span></span>
          <span className="text-pharma-400">Weight <span className="text-white font-mono">{points[dotIndex] ? activeRows[Math.min(dotIndex, activeRows.length - 1)].weight_kg.toFixed(1) : startingWeight} kg</span></span>
          <span className="text-pharma-400">Loss <span className="text-accent-400 font-mono">−{(startingWeight - activeRows[Math.min(dotIndex, activeRows.length - 1)].weight_kg).toFixed(1)} kg</span></span>
        </div>
      )}

      <div className="rounded-xl border border-pharma-700 bg-pharma-800/30 p-4 overflow-hidden">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
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

          {/* Target line */}
          <line x1={padX} y1={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)} x2={svgW - padX} y2={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)}
            stroke="#22c55e" strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />
          <text x={svgW - padX - 5} y={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2) - 6}
            textAnchor="end" fill="#22c55e" fontSize="9">Target {targetWeight}kg</text>

          {/* Fill */}
          <path d={fillD} fill="url(#cg)" opacity={animPhase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.6s ease-out' }} />
          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)"
            strokeDasharray={approxPathLength} strokeDashoffset={animPhase >= 1 ? 0 : approxPathLength}
            style={{ transition: animPhase >= 1 ? 'stroke-dashoffset 2.2s ease-in-out' : 'none' }} />
          {/* Start */}
          <circle cx={points[0].x} cy={points[0].y} r="4" fill={brandColor2} filter="url(#glow)" />
          {/* Animated dot */}
          {animPhase >= 1 && <>
            <circle cx={dotX} cy={dotY} r="5" fill={brandColor} filter="url(#dg)" />
            <circle cx={dotX} cy={dotY} r="10" fill="none" stroke={brandColor} strokeWidth="1.5" opacity="0.5">
              <animate attributeName="r" from="8" to="16" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </>}
          {/* End */}
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#22c55e" filter="url(#glow)"
            opacity={animPhase >= 2 ? 1 : 0} style={{ transition: 'opacity 0.4s ease-out' }} />
        </svg>
      </div>
    </div>
  )
}
