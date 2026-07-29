import type { ForecastResult } from '../../lib/forecast-model'

interface ForecastSummaryProps {
  result: ForecastResult
  biomarkerMultiplier: number
  hasBiomarkers: boolean
}

export default function ForecastSummary({ result, biomarkerMultiplier, hasBiomarkers }: ForecastSummaryProps) {
  const { summary, starting_bmi, starting_bmi_class, target_bmi } = result

  return (
    <div className="rounded-xl border border-accent-500/30 bg-gradient-to-br from-accent-500/5 to-purple-600/5 p-5 space-y-5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <span>🎯</span> Your Weight Loss Dashboard
      </h3>

      {/* Top row: product + timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-pharma-800/50 rounded-lg p-3">
          <div className="text-xs text-pharma-400 mb-1">Recommended Product</div>
          <div className="text-sm font-bold text-white">{summary.product_name}</div>
          <div className="text-xs text-accent-400 mt-1">
            {result.product.brand === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'} • {result.product.per_dose_mg}mg/dose
          </div>
        </div>

        <div className="bg-pharma-800/50 rounded-lg p-3">
          <div className="text-xs text-pharma-400 mb-1">Estimated Timeline</div>
          <div className="text-2xl font-bold text-white">{summary.estimated_weeks} <span className="text-sm text-pharma-400">weeks</span></div>
          <div className="text-xs text-pharma-400 mt-1">{summary.estimated_months}</div>
        </div>

        <div className="bg-pharma-800/50 rounded-lg p-3">
          <div className="text-xs text-pharma-400 mb-1">First → Last Dose</div>
          <div className="text-sm text-white">{summary.first_dose_date}</div>
          <div className="text-xs text-pharma-500">→</div>
          <div className="text-sm text-white">{summary.last_dose_date}</div>
        </div>
      </div>

      {/* Weight metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-pharma-800/30 rounded-lg p-3 text-center">
          <div className="text-xs text-pharma-400">Starting Weight</div>
          <div className="text-lg font-bold text-white">{summary.starting_weight} <span className="text-xs text-pharma-400">kg</span></div>
          <div className="text-xs text-pharma-400">BMI {starting_bmi} <span className={`font-medium ${starting_bmi_class === 'Obese' ? 'text-red-400' : starting_bmi_class === 'Overweight' ? 'text-yellow-400' : 'text-green-400'}`}>({starting_bmi_class})</span></div>
        </div>

        <div className="bg-pharma-800/30 rounded-lg p-3 text-center">
          <div className="text-xs text-pharma-400">Target Weight</div>
          <div className="text-lg font-bold text-green-400">{summary.target_weight} <span className="text-xs text-pharma-400">kg</span></div>
          <div className="text-xs text-pharma-400">BMI {target_bmi}</div>
        </div>

        <div className="bg-pharma-800/30 rounded-lg p-3 text-center">
          <div className="text-xs text-pharma-400">Total Loss</div>
          <div className="text-lg font-bold text-accent-400">{summary.total_loss_kg} <span className="text-xs text-pharma-400">kg</span></div>
          <div className="text-xs text-accent-400">{summary.total_loss_pct}% of body weight</div>
        </div>

        <div className="bg-pharma-800/30 rounded-lg p-3 text-center">
          <div className="text-xs text-pharma-400">Weekly Rate</div>
          <div className="text-lg font-bold text-purple-400">{summary.average_weekly_loss_kg} <span className="text-xs text-pharma-400">kg/wk</span></div>
          <div className="text-xs text-pharma-400">
            ~{Math.round((summary.total_loss_kg / summary.estimated_weeks) * 100) / 100} kg/week
            {hasBiomarkers && (
              <span className="text-accent-400 ml-1">(×{biomarkerMultiplier})</span>
            )}
          </div>
        </div>
      </div>

      {/* Dose titration path */}
      <div className="bg-pharma-800/30 rounded-lg p-3">
        <div className="text-xs text-pharma-400 mb-2">Dose Titration Path</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {result.titration_schedule.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="px-2 py-1 rounded text-xs font-mono bg-accent-500/20 text-accent-400">
                {step.label}
              </span>
              {i < result.titration_schedule.length - 1 && (
                <span className="text-pharma-600 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-pharma-500 mt-1">
          {result.titration_schedule.map((step, i) => (
            <span key={i}>
              {i > 0 ? ' • ' : ''}W{step.startWeek}-W{step.endWeek > 100 ? 'end' : step.endWeek}: {step.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
