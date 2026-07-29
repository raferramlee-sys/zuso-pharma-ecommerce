import { useRef, useEffect, useState } from 'react';
import type { ForecastRow } from '../../lib/forecast-model';

interface Props {
  atheryxRows: ForecastRow[];
  elysionRows: ForecastRow[];
  targetWeight: number;
  activeBrand: 'atheryx' | 'elysion';
  onToggle: (brand: 'atheryx' | 'elysion') => void;
}

export default function ForecastChart({ atheryxRows, elysionRows, targetWeight, activeBrand, onToggle }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const [animProgress, setAnimProgress] = useState(0);

  const rows = activeBrand === 'atheryx' ? atheryxRows : elysionRows;
  const color = activeBrand === 'atheryx' ? '#7c3aed' : '#3b82f6';
  const glowColor = activeBrand === 'atheryx' ? '#a78bfa' : '#60a5fa';

  // Build path
  const maxWeeks = Math.max(atheryxRows.length, elysionRows.length, 1);
  const maxWeight = Math.max(
    rows.length > 0 ? rows[0].weight_kg + 5 : 100,
    targetWeight + 10
  );
  const minWeight = Math.min(targetWeight - 3, rows.length > 0 ? rows[rows.length - 1].weight_kg - 2 : 50);

  const padding = { top: 30, right: 40, bottom: 50, left: 55 };
  const width = 700;
  const height = 360;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xScale = (week: number) => padding.left + (week / maxWeeks) * plotW;
  const yScale = (kg: number) => padding.top + ((maxWeight - kg) / (maxWeight - minWeight)) * plotH;

  const pathD = rows.map((r, i) => `${i === 0 ? 'M' : 'L'} ${xScale(r.week)} ${yScale(r.weight_kg)}`).join(' ');

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;

    // Animate
    let start: number | null = null;
    const duration = 1500;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      el.style.strokeDashoffset = `${len * (1 - eased)}`;
      setAnimProgress(eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [activeBrand, rows]);

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const lastX = lastRow ? xScale(lastRow.week) : xScale(1);
  const lastY = lastRow ? yScale(lastRow.weight_kg) : yScale(maxWeight);

  // Y-axis ticks
  const yTicks: number[] = [];
  for (let kg = Math.ceil(minWeight); kg <= maxWeight; kg += Math.ceil((maxWeight - minWeight) / 6)) {
    yTicks.push(kg);
  }

  // X-axis ticks
  const xTicks: number[] = [];
  for (let w = 0; w <= maxWeeks; w += Math.max(4, Math.ceil(maxWeeks / 10))) {
    xTicks.push(w);
  }

  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Weight Loss Trajectory</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onToggle('atheryx')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeBrand === 'atheryx'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            ATHERYX™
          </button>
          <button
            onClick={() => onToggle('elysion')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeBrand === 'elysion'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            ELYSION™
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid */}
        {yTicks.map((kg) => (
          <g key={`y-${kg}`}>
            <line
              x1={padding.left} y1={yScale(kg)} x2={width - padding.right} y2={yScale(kg)}
              stroke="#374151" strokeWidth="0.5" strokeDasharray="4 4"
            />
            <text x={padding.left - 8} y={yScale(kg) + 4} textAnchor="end" fill="#6b7280" fontSize="10">
              {kg}
            </text>
          </g>
        ))}
        {xTicks.map((w) => (
          <g key={`x-${w}`}>
            <line
              x1={xScale(w)} y1={padding.top} x2={xScale(w)} y2={height - padding.bottom}
              stroke="#374151" strokeWidth="0.5" strokeDasharray="4 4"
            />
            <text x={xScale(w)} y={height - padding.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize="10">
              {w}
            </text>
          </g>
        ))}

        {/* Target line */}
        <line
          x1={padding.left} y1={yScale(targetWeight)}
          x2={width - padding.right} y2={yScale(targetWeight)}
          stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
        />
        <text x={width - padding.right} y={yScale(targetWeight) - 6} textAnchor="end" fill="#22c55e" fontSize="9">
          Target: {targetWeight}kg
        </text>

        {/* Animated path */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'none' }}
        />

        {/* Glow dot */}
        {lastRow && animProgress > 0.05 && (
          <g>
            <circle cx={lastX} cy={lastY} r="12" fill={glowColor} opacity="0.15">
              <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r="4" fill={color} />
            <text x={lastX + 8} y={lastY - 8} fill={color} fontSize="10" fontWeight="600">
              {lastRow.weight_kg}kg
            </text>
          </g>
        )}

        {/* Labels */}
        <text x={padding.left + plotW / 2} y={height - 5} textAnchor="middle" fill="#6b7280" fontSize="11">
          Weeks
        </text>
        <text
          x={12} y={padding.top + plotH / 2}
          textAnchor="middle" fill="#6b7280" fontSize="11"
          transform={`rotate(-90, 12, ${padding.top + plotH / 2})`}
        >
          Weight (kg)
        </text>
      </svg>
    </div>
  );
}
