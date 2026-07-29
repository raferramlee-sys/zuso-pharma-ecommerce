import { useState } from 'react'
import type { BrandPath, ForecastRow } from '../../lib/forecast-model'

interface ComparisonViewProps {
  atheryx: BrandPath
  elysion: BrandPath
  biomarkerMultiplier: number
  hasBiomarkers: boolean
  startingDoseAth?: number
  startingDoseEly?: number
  onStartingDoseAthChange: (dose: number | undefined) => void
  onStartingDoseElyChange: (dose: number | undefined) => void
}

const ATH_DOSES = [2, 4, 6, 8, 12]
const ELY_DOSES = [2.5, 5, 7.5, 10, 12.5, 15]

function MiniSummary({ path, colorClass, bgClass }: { path: BrandPath; colorClass: string; bgClass: string }) {
  const s = path.summary
  return (
    <div className={`${bgClass} rounded-xl p-4 flex-1`}>
      <div className="text-xs text-pharma-400 mb-2">Recommended Product</div>
      <div className={`text-sm font-bold ${colorClass} mb-1`}>{path.brandName}</div>
      <div className="text-white text-xs font-mono">{s.product_name}</div>
      <div className="text-pharma-500 text-xs mt-1">{path.product.dosage_mg}mg/{path.product.per_dose_mg}mg per dose</div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-pharma-700/50">
        <div>
          <div className="text-xs text-pharma-400">Timeline</div>
          <div className="text-sm font-bold text-white">{s.estimated_weeks} weeks</div>
          <div className="text-xs text-pharma-500">{s.estimated_months}</div>
        </div>
        <div>
          <div className="text-xs text-pharma-400">Weekly Rate</div>
          <div className="text-sm font-bold text-white">{s.average_weekly_loss_kg} kg/wk</div>
          <div className="text-xs text-pharma-500">Total {s.total_loss_kg} kg</div>
        </div>
      </div>

      {/* Titration path */}
      <div className="mt-2 pt-2 border-t border-pharma-700/50">
        <div className="text-xs text-pharma-500 mb-1">Titration:</div>
        <div className="flex flex-wrap gap-1">
          {path.titration_schedule.map((t, i) => (
            <span key={i} className="text-xs bg-pharma-700/50 rounded px-1.5 py-0.5 text-white font-mono">
              W{t.startWeek}:{t.dose_mg}mg
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function WeeklyTable({ rows, brandName }: { rows: ForecastRow[]; brandName: string }) {
  const [show, setShow] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const display = showAll ? rows : rows.slice(0, 16)

  return (
    <div className="rounded-xl border border-pharma-700 bg-pharma-800/20 overflow-hidden">
      <button onClick={() => setShow(!show)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm text-white hover:bg-pharma-800/30">
        <span className="font-semibold">📊 {brandName} — Weekly Dose & Weight Tracker</span>
        <span className="text-pharma-400 text-xs">{show ? '▴ Collapse' : `▸ Expand (${rows.length} weeks)`}</span>
      </button>
      {show && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-pharma-700 text-pharma-400">
                <th className="text-left px-3 py-2">Week</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Product Pen</th>
                <th className="text-right px-3 py-2">Dose</th>
                <th className="text-right px-3 py-2">Weight</th>
                <th className="text-right px-3 py-2">BMI</th>
                <th className="text-left px-3 py-2">Class</th>
                <th className="text-right px-3 py-2">Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pharma-800/50">
              {display.map((r, i) => (
                <tr key={i} className="hover:bg-pharma-800/20">
                  <td className="px-3 py-1.5 text-white font-mono">W{r.week}</td>
                  <td className="px-3 py-1.5 text-pharma-400">{r.date}</td>
                  <td className="px-3 py-1.5 text-pharma-300 text-xs">{r.productSku}</td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 text-xs">{r.dose_mg}mg</span>
                  </td>
                  <td className="px-3 py-1.5 text-right text-white font-mono">{r.weight_kg}</td>
                  <td className="px-3 py-1.5 text-right text-pharma-400">{r.bmi}</td>
                  <td className="px-3 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      r.bmi_classification === 'Underweight' ? 'bg-blue-500/20 text-blue-400' :
                      r.bmi_classification === 'Normal' ? 'bg-green-500/20 text-green-400' :
                      r.bmi_classification === 'Overweight' ? 'bg-yellow-500/20 text-yellow-400' :
                      r.bmi_classification === 'Obese I' ? 'bg-orange-500/20 text-orange-400' :
                      r.bmi_classification === 'Obese II' ? 'bg-amber-600/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{r.bmi_classification}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right text-accent-400 font-mono">−{r.cumulative_loss_kg}kg</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 16 && (
            <button onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-xs text-accent-400 hover:text-accent-300 border-t border-pharma-700">
              {showAll ? '▲ Show fewer' : `▼ Show all ${rows.length} weeks`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ComparisonView({ atheryx, elysion, biomarkerMultiplier, hasBiomarkers, startingDoseAth, startingDoseEly, onStartingDoseAthChange, onStartingDoseElyChange }: ComparisonViewProps) {
  return (
    <div className="space-y-6">
      {/* Side-by-side summaries */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>🎯</span> Your Weight Loss Dashboard — ATHERYX™ vs ELYSION™
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            {/* Starting dose selector */}
            <div className="flex items-center gap-2 px-1">
              <label className="text-[0.6rem] text-pharma-500 uppercase tracking-wider whitespace-nowrap">Start dose:</label>
              <select
                value={startingDoseAth ?? ''}
                onChange={e => onStartingDoseAthChange(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-pharma-800 border border-pharma-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">New patient (2mg)</option>
                {ATH_DOSES.filter(d => d > 2).map(d => (
                  <option key={d} value={d}>{d}mg</option>
                ))}
              </select>
            </div>
            <MiniSummary path={atheryx} colorClass="text-purple-400" bgClass="bg-purple-500/5 border border-purple-500/20" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {/* Starting dose selector */}
            <div className="flex items-center gap-2 px-1">
              <label className="text-[0.6rem] text-pharma-500 uppercase tracking-wider whitespace-nowrap">Start dose:</label>
              <select
                value={startingDoseEly ?? ''}
                onChange={e => onStartingDoseElyChange(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-pharma-800 border border-pharma-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">New patient (2.5mg)</option>
                {ELY_DOSES.filter(d => d > 2.5).map(d => (
                  <option key={d} value={d}>{d}mg</option>
                ))}
              </select>
            </div>
            <MiniSummary path={elysion} colorClass="text-blue-400" bgClass="bg-blue-500/5 border border-blue-500/20" />
          </div>
        </div>
        {hasBiomarkers && (
          <p className="text-xs text-pharma-500 mt-2">
            Biomarker adjustment applied: ×{biomarkerMultiplier}
          </p>
        )}
      </div>

      {/* Weekly tables side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyTable rows={atheryx.rows} brandName="ATHERYX™" />
        <WeeklyTable rows={elysion.rows} brandName="ELYSION™" />
      </div>
    </div>
  )
}
