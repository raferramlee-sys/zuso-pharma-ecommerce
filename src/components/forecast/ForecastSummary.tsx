import type { ComparisonResult } from '../../lib/forecast-model';

interface Props {
  comparison: ComparisonResult;
}

export default function ForecastSummary({ comparison }: Props) {
  const { atheryx, elysion, starting_bmi, starting_bmi_class, target_weight, target_bmi, biomarker_multiplier, has_biomarkers } = comparison;

  const StatRow = ({ label, atheryxVal, elysionVal, unit = '' }: { label: string; atheryxVal: string | number; elysionVal: string | number; unit?: string }) => (
    <div className="flex items-center py-2 border-b border-gray-700/20 text-[0.7rem]">
      <span className="w-32 text-gray-500">{label}</span>
      <span className="flex-1 text-center text-purple-400 font-medium">{atheryxVal}{unit}</span>
      <span className="flex-1 text-center text-blue-400 font-medium">{elysionVal}{unit}</span>
    </div>
  );

  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-card p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">📋 Comparison Summary</h3>

      {/* Header row */}
      <div className="flex items-center py-2 border-b border-gray-600/50 mb-1">
        <span className="w-32" />
        <span className="flex-1 text-center text-xs font-bold text-purple-400">ATHERYX™</span>
        <span className="flex-1 text-center text-xs font-bold text-blue-400">ELYSION™</span>
      </div>

      <div className="space-y-0">
        <StatRow label="Product" atheryxVal={atheryx.summary.product_name} elysionVal={elysion.summary.product_name} />
        <StatRow label="Starting Weight" atheryxVal={atheryx.summary.starting_weight} elysionVal={elysion.summary.starting_weight} unit=" kg" />
        <StatRow label="Target Weight" atheryxVal={target_weight} elysionVal={target_weight} unit=" kg" />
        <StatRow label="Total Loss" atheryxVal={`${atheryx.summary.total_loss_kg}kg (${atheryx.summary.total_loss_pct}%)`} elysionVal={`${elysion.summary.total_loss_kg}kg (${elysion.summary.total_loss_pct}%)`} />
        <StatRow label="Timeline" atheryxVal={atheryx.summary.estimated_months} elysionVal={elysion.summary.estimated_months} />
        <StatRow label="Avg Weekly Loss" atheryxVal={atheryx.summary.average_weekly_loss_kg} elysionVal={elysion.summary.average_weekly_loss_kg} unit=" kg" />
        <StatRow label="1st Dose" atheryxVal={atheryx.summary.first_dose_date} elysionVal={elysion.summary.first_dose_date} />
        <StatRow label="Last Dose" atheryxVal={atheryx.summary.last_dose_date} elysionVal={elysion.summary.last_dose_date} />
      </div>

      {/* Starting stats */}
      <div className="mt-4 pt-3 border-t border-gray-700/30 text-[0.65rem] text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
        <span>Starting BMI: <strong className="text-gray-300">{starting_bmi}</strong> ({starting_bmi_class})</span>
        <span>Target BMI: <strong className="text-gray-300">{target_bmi}</strong></span>
        {has_biomarkers && (
          <span>Biomarker multiplier: <strong className={biomarker_multiplier >= 1 ? 'text-green-400' : 'text-amber-400'}>×{biomarker_multiplier}</strong></span>
        )}
      </div>

      {/* Winner highlight */}
      {atheryx.summary.total_loss_pct !== elysion.summary.total_loss_pct && (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-[0.7rem] text-gray-400">
          🏆 <strong className={atheryx.summary.total_loss_pct > elysion.summary.total_loss_pct ? 'text-purple-400' : 'text-blue-400'}>
            {atheryx.summary.total_loss_pct > elysion.summary.total_loss_pct ? 'ATHERYX™' : 'ELYSION™'}
          </strong> shows {Math.abs(atheryx.summary.total_loss_pct - elysion.summary.total_loss_pct).toFixed(1)}% more weight loss at this intensity.
        </div>
      )}
    </div>
  );
}
