import { useState } from 'react'
import type { ForecastRow } from '../../lib/forecast-model'

interface ForecastTableProps {
  rows: ForecastRow[]
}

export default function ForecastTable({ rows }: ForecastTableProps) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const displayRows = showAll ? rows : rows.slice(0, 12)

  return (
    <div className="rounded-xl border border-pharma-700 bg-pharma-800/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm text-white hover:bg-pharma-800/50 transition-colors"
      >
        <span className="font-semibold">📊 Weekly Dose & Weight Tracker</span>
        <span className="text-pharma-400 text-xs">{expanded ? '▴ Collapse' : '▸ Expand'} ({rows.length} weeks)</span>
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-pharma-700 text-pharma-400">
                <th className="text-left px-3 py-2 font-medium">Week</th>
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-left px-3 py-2 font-medium">Dose</th>
                <th className="text-right px-3 py-2 font-medium">Weight (kg)</th>
                <th className="text-right px-3 py-2 font-medium">BMI</th>
                <th className="text-left px-3 py-2 font-medium">Classification</th>
                <th className="text-right px-3 py-2 font-medium">Loss (kg)</th>
                <th className="text-right px-3 py-2 font-medium">Loss %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pharma-800/50">
              {displayRows.map((r, i) => (
                <tr
                  key={i}
                  className={`hover:bg-pharma-800/30 transition-colors ${
                    r.bmi_classification !== rows[Math.max(0, i - 1)]?.bmi_classification
                      ? 'border-l-2 border-l-accent-500'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 text-white font-mono">W{r.week}</td>
                  <td className="px-3 py-2 text-pharma-300">{r.date}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 font-mono text-xs">
                      {r.dose_mg}mg
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-white font-mono">{r.weight_kg}</td>
                  <td className="px-3 py-2 text-right text-pharma-300 font-mono">{r.bmi}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      r.bmi_classification === 'Normal' ? 'bg-green-500/20 text-green-400' :
                      r.bmi_classification === 'Overweight' ? 'bg-yellow-500/20 text-yellow-400' :
                      r.bmi_classification === 'Obese' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {r.bmi_classification}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-accent-400 font-mono">{r.cumulative_loss_kg}</td>
                  <td className="px-3 py-2 text-right text-pharma-400 font-mono">{r.cumulative_loss_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length > 12 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-xs text-accent-400 hover:text-accent-300 border-t border-pharma-700"
            >
              {showAll ? '▲ Show fewer (first 12 weeks)' : `▼ Show all ${rows.length} weeks`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
