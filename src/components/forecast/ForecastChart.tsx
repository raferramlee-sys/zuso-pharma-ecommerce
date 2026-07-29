import { useEffect, useRef, useState } from 'react'
import type { ForecastRow } from '../../lib/forecast-model'

interface ForecastChartProps {
  rows: ForecastRow[]
  startingWeight: number
  targetWeight: number
  totalWeeks: number
}

export default function ForecastChart({ rows, startingWeight, targetWeight, totalWeeks }: ForecastChartProps) {
  const [animPhase, setAnimPhase] = useState(0) // 0=idle, 1=line drawing, 2=done
  const [dotProgress, setDotProgress] = useState(0)

  useEffect(() => {
    if (rows.length === 0) return
    // Trigger animation
    setAnimPhase(0)
    setDotProgress(0)

    const t1 = setTimeout(() => setAnimPhase(1), 200) // Start line draw
    const t2 = setTimeout(() => setAnimPhase(2), 2500) // Line done

    // Animate dot position
    const start = Date.now()
    const duration = 2200
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(1, elapsed / duration)
      setDotProgress(p)
      if (p >= 1) clearInterval(interval)
    }, 30)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(interval)
    }
  }, [rows])

  if (rows.length === 0) return null

  const svgW = 600
  const svgH = 300
  const padX = 55
  const padY = 35

  const weightValues = rows.map(r => r.weight_kg)
  const minW = targetWeight - 2
  const maxW = startingWeight + 2
  const wRange = maxW - minW

  // Generate smooth bezier path
  const points = rows.map((r, i) => {
    const x = padX + (i / Math.max(rows.length - 1, 1)) * (svgW - padX * 2)
    const y = padY + ((maxW - r.weight_kg) / wRange) * (svgH - padY * 2)
    return { x, y }
  })

  // Create smooth curve using cubic bezier
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 3
    const cp2x = points[i].x + (2 * (points[i + 1].x - points[i].x)) / 3
    pathD += ` C ${cp1x} ${points[i].y}, ${cp2x} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`
  }

  // Fill path
  const fillD = `${pathD} L ${points[points.length - 1].x} ${svgH - padY} L ${points[0].x} ${svgH - padY} Z`

  // Calculate path length for stroke-dasharray animation
  // Approximate: use number of segments × average segment length
  const approxPathLength = points.length * 15

  // Dot position along the curve
  const dotIndex = Math.floor(dotProgress * (points.length - 1))
  const dotFraction = dotProgress * (points.length - 1) - dotIndex
  const nextIdx = Math.min(dotIndex + 1, points.length - 1)
  const dotX = points[dotIndex].x + (points[nextIdx].x - points[dotIndex].x) * dotFraction
  const dotY = points[dotIndex].y + (points[nextIdx].y - points[dotIndex].y) * dotFraction

  // Y-axis labels
  const yTicks = [maxW, maxW - (wRange / 4), maxW - (wRange / 2), maxW - (3 * wRange / 4), minW]

  // Weight at current dot position (for live counter)
  const dotWeight = rows[Math.min(dotIndex, rows.length - 1)]?.weight_kg ?? startingWeight
  const dotLoss = startingWeight - dotWeight

  return (
    <div className="relative">
      <h3 className="text-sm font-semibold text-white mb-4">📈 Projected Weight Loss Curve</h3>

      {/* Animated counters */}
      {animPhase > 0 && (
        <div className="flex gap-6 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-pharma-400">Current:</span>
            <span className="text-white font-mono font-bold">{dotWeight.toFixed(1)} kg</span>
            <span className="text-accent-400">(−{dotLoss.toFixed(1)} kg)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pharma-400">Target:</span>
            <span className="text-green-400 font-mono">{targetWeight} kg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pharma-400">Week:</span>
            <span className="text-purple-400 font-mono">{Math.max(1, dotIndex + 1)} / {totalWeeks}</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-pharma-700 bg-pharma-800/30 p-4 overflow-hidden">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="dotGrad">
              <stop offset="0%" stopColor="#f0abfc" stopOpacity="1" />
              <stop offset="40%" stopColor="#c084fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((y, i) => {
            const sy = padY + ((maxW - y) / wRange) * (svgH - padY * 2)
            return (
              <g key={i}>
                <line x1={padX} y1={sy} x2={svgW - padX} y2={sy} stroke="#2d1b4e" strokeWidth="0.5" strokeDasharray="4 4" />
                <text x={padX - 8} y={sy + 4} textAnchor="end" fill="#6b5b8a" fontSize="9">{Math.round(y)}</text>
              </g>
            )
          })}

          {/* X-axis labels */}
          {rows.filter((_, i) => i % Math.max(1, Math.floor(totalWeeks / 6)) === 0 || i === rows.length - 1).map((r, i) => {
            const idx = rows.indexOf(r)
            const x = padX + (idx / Math.max(rows.length - 1, 1)) * (svgW - padX * 2)
            return (
              <text key={i} x={x} y={svgH - 8} textAnchor="middle" fill="#6b5b8a" fontSize="8">
                W{r.week}
              </text>
            )
          })}

          {/* Fill area — fades in */}
          <path
            d={fillD}
            fill="url(#chartGrad)"
            opacity={animPhase >= 1 ? 1 : 0}
            style={{ transition: 'opacity 0.6s ease-out' }}
          />

          {/* Animated line — stroke-dasharray reveal */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
            strokeDasharray={approxPathLength}
            strokeDashoffset={animPhase >= 1 ? 0 : approxPathLength}
            style={{ transition: animPhase >= 1 ? 'stroke-dashoffset 2.2s ease-in-out' : 'none' }}
          />

          {/* Target line */}
          <line
            x1={padX} y1={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)}
            x2={svgW - padX} y2={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)}
            stroke="#22c55e" strokeWidth="1" strokeDasharray="6 3" opacity="0.5"
          />
          <text
            x={svgW - padX - 5}
            y={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2) - 6}
            textAnchor="end" fill="#22c55e" fontSize="9"
          >
            Normal BMI 22.5 → {targetWeight}kg
          </text>

          {/* Start dot */}
          <circle cx={points[0].x} cy={points[0].y} r="4" fill="#a78bfa" filter="url(#glow)" />

          {/* Animated tracing dot with glow ring */}
          {animPhase >= 1 && (
            <>
              {/* Outer glow ring */}
              <circle
                cx={dotX} cy={dotY} r="18"
                fill="url(#dotGrad)"
                filter="url(#dotGlow)"
                opacity={0.6}
              />
              {/* Inner dot */}
              <circle
                cx={dotX} cy={dotY} r="5"
                fill="#f0abfc"
                filter="url(#dotGlow)"
              />
              {/* Pulse ring */}
              <circle
                cx={dotX} cy={dotY} r="10"
                fill="none"
                stroke="#f0abfc"
                strokeWidth="1.5"
                opacity={0.5}
              >
                <animate attributeName="r" from="8" to="16" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="5"
            fill="#22c55e"
            filter="url(#glow)"
            opacity={animPhase >= 2 ? 1 : 0}
            style={{ transition: 'opacity 0.4s ease-out' }}
          />
        </svg>
      </div>
    </div>
  )
}
