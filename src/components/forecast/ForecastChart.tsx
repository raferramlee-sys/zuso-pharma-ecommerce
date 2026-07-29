import { useEffect, useRef, useState } from 'react'
import type { ForecastRow } from '../../lib/forecast-model'

interface ForecastChartProps {
  rows: ForecastRow[]
  startingWeight: number
  targetWeight: number
  totalWeeks: number
}

export default function ForecastChart({ rows, startingWeight, targetWeight, totalWeeks }: ForecastChartProps) {
  const [animated, setAnimated] = useState(false)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(timer)
  }, [])

  if (rows.length === 0) return null

  const svgW = 600
  const svgH = 300
  const padX = 50
  const padY = 30

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

  // Y-axis labels
  const yTicks = [maxW, maxW - (wRange / 4), maxW - (wRange / 2), maxW - (3 * wRange / 4), minW]

  // X-axis labels
  const xTickInterval = Math.max(1, Math.floor(rows.length / 6))

  return (
    <div className="relative">
      <h3 className="text-sm font-semibold text-white mb-4">📈 Projected Weight Loss Curve</h3>
      <div className="rounded-xl border border-pharma-700 bg-pharma-800/30 p-4 overflow-hidden">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
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
          </defs>

          {/* Grid lines */}
          {yTicks.map((y, i) => {
            const sy = padY + ((maxW - y) / wRange) * (svgH - padY * 2)
            return (
              <g key={i}>
                <line x1={padX} y1={sy} x2={svgW - padX} y2={sy} stroke="#2d1b4e" strokeWidth="0.5" strokeDasharray="4 4" />
                <text x={padX - 5} y={sy + 4} textAnchor="end" fill="#6b5b8a" fontSize="9">{Math.round(y)}</text>
              </g>
            )
          })}

          {/* X-axis labels */}
          {rows.filter((_, i) => i % xTickInterval === 0).map((r, i) => {
            const idx = i * xTickInterval
            const x = padX + (idx / Math.max(rows.length - 1, 1)) * (svgW - padX * 2)
            return (
              <text key={i} x={x} y={svgH - 5} textAnchor="middle" fill="#6b5b8a" fontSize="8">
                W{r.week}
              </text>
            )
          })}

          {/* Fill area */}
          <path d={fillD} fill="url(#chartGrad)" opacity={animated ? 1 : 0} style={{ transition: 'opacity 0.8s ease-out' }} />

          {/* Main curve */}
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
            strokeDasharray={animated ? 'none' : '1000'}
            strokeDashoffset={animated ? '0' : '1000'}
            style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
          />

          {/* Target line */}
          <line
            x1={padX} y1={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)}
            x2={svgW - padX} y2={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2)}
            stroke="#22c55e" strokeWidth="1" strokeDasharray="6 3" opacity="0.6"
          />
          <text
            x={svgW - padX - 5}
            y={padY + ((maxW - targetWeight) / wRange) * (svgH - padY * 2) - 6}
            textAnchor="end" fill="#22c55e" fontSize="9"
          >
            Target {targetWeight}kg
          </text>

          {/* Start dot */}
          <circle cx={points[0].x} cy={points[0].y} r="4" fill="#a78bfa" filter="url(#glow)" />
          {/* End dot */}
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#c084fc" filter="url(#glow)" />
        </svg>
      </div>
    </div>
  )
}
