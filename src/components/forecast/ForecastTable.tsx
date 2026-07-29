import { useState } from 'react';
import type { ForecastResult } from '../../lib/forecast-model';

interface Props {
  result: ForecastResult;
  color: string;
  borderColor: string;
}

export default function ForecastTable({ result, color, borderColor }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { rows, summary, brandName, titration_schedule } = result;

  const showRows = expanded ? rows : rows.slice(0, 12);

  return (
    <div className={`bg-gray-900/80 border ${borderColor} rounded-card overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold ${color}`}>{brandName}</h3>
          <span className="text-xs text-gray-500">{summary.product_name}</span>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>⏱ {summary.estimated_months}</span>
          <span>📉 {summary.total_loss_kg}kg ({summary.total_loss_pct}%)</span>
          <span>📊 {summary.average_weekly_loss_kg}kg/wk avg</span>
        </div>
      </div>

      {/* Titration */}
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/30">
        <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-1">Dose Titration</p>
        <div className="flex flex-wrap gap-1">
          {titration_schedule.map((step, i) => (
            <span
              key={i}
              className={`text-[0.6rem] px-2 py-0.5 rounded-full ${
                i === titration_schedule.length - 1
                  ? 'bg-white/10 text-white'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {step.dose_mg}mg
              {step.startWeek > 1 ? ` wk${step.startWeek}` : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[0.65rem]">
          <thead>
            <tr className="text-gray-500 uppercase border-b border-gray-700/30">
              <th className="px-3 py-2 text-left">Wk</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Dose</th>
              <th className="px-3 py-2 text-right">Weight</th>
              <th className="px-3 py-2 text-right">BMI</th>
              <th className="px-3 py-2 text-right">Loss</th>
              <th className="px-3 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {showRows.map((row) => (
              <tr key={row.week} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-3 py-1.5 text-gray-400">{row.week}</td>
                <td className="px-3 py-1.5 text-gray-500">{row.date}</td>
                <td className="px-3 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[0.6rem] font-medium ${
                    row.dose_mg === titration_schedule[titration_schedule.length - 1].dose_mg
                      ? 'bg-white/10 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {row.dose_mg}mg
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right text-gray-300 font-mono">{row.weight_kg}</td>
                <td className="px-3 py-1.5 text-right text-gray-500">{row.bmi}</td>
                <td className="px-3 py-1.5 text-right text-gray-300 font-mono">{row.cumulative_loss_kg}</td>
                <td className="px-3 py-1.5 text-right text-gray-400">{row.cumulative_loss_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand/collapse */}
      {rows.length > 12 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-[0.65rem] text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
        >
          {expanded ? '▲ Show less' : `▼ Show all ${rows.length} weeks`}
        </button>
      )}
    </div>
  );
}
