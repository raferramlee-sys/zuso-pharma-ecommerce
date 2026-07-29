import { useState } from 'react';
import type { ForecastInput, Biomarkers, IntensityOption } from '../../lib/forecast-model';
import { calculateTargetWeight, classifyBMI, INTENSITY_OPTIONS } from '../../lib/forecast-model';

interface Props {
  onSubmit: (input: ForecastInput) => void;
  loading: boolean;
}

export default function ForecastForm({ onSubmit, loading }: Props) {
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(85);
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [intensity, setIntensity] = useState<string>('moderate');
  const [showBiomarkers, setShowBiomarkers] = useState(false);
  const [biomarkers, setBiomarkers] = useState<Biomarkers>({});

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const targetWeight = calculateTargetWeight(height);
  const bmiClass = classifyBMI(bmi);
  const toLose = Math.max(0, weight - targetWeight);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      height_cm: height,
      weight_kg: weight,
      age,
      gender,
      intensity: intensity as ForecastInput['intensity'],
      biomarkers: showBiomarkers && Object.keys(biomarkers).length > 0 ? biomarkers : undefined,
    });
  };

  const updateBiomarker = (key: keyof Biomarkers, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      const next = { ...biomarkers };
      delete next[key];
      setBiomarkers(next);
    } else {
      setBiomarkers({ ...biomarkers, [key]: num });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[0.7rem] text-gray-400 mb-1">Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={130} max={220}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] text-gray-400 mb-1">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={30} max={250}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] text-gray-400 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            min={18} max={100}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] text-gray-400 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'Female' | 'Male')}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option>Female</option>
            <option>Male</option>
          </select>
        </div>
      </div>

      {/* BMI display */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">BMI: <strong className="text-white">{bmi.toFixed(1)}</strong></span>
        <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${
          bmiClass === 'Obese' ? 'bg-red-900/40 text-red-400' :
          bmiClass === 'Overweight' ? 'bg-amber-900/40 text-amber-400' :
          'bg-green-900/40 text-green-400'
        }`}>{bmiClass}</span>
        <span className="text-gray-500">Target: <strong className="text-green-400">{targetWeight}</strong> kg</span>
        <span className="text-gray-500">(BMI 22.5)</span>
        {toLose > 0 && (
          <span className="text-gray-500">To lose: <strong className="text-purple-400">{toLose.toFixed(1)}</strong> kg</span>
        )}
      </div>

      {/* Intensity selection */}
      <div>
        <label className="block text-[0.7rem] text-gray-400 mb-2">Weight Loss Intensity</label>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITY_OPTIONS.map((opt: IntensityOption) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setIntensity(opt.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                intensity === opt.value
                  ? 'border-purple-500/50 bg-purple-600/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-lg mb-1">{opt.icon}</div>
              <div className="text-sm font-semibold text-white">{opt.label}</div>
              <div className="text-[0.6rem] text-gray-500 mt-0.5">{opt.desc}</div>
              <div className="text-[0.65rem] text-gray-400 mt-1">~{opt.rate} / week</div>
            </button>
          ))}
        </div>
      </div>

      {/* Biomarkers toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowBiomarkers(!showBiomarkers)}
          className="text-[0.7rem] text-gray-500 hover:text-gray-300 flex items-center gap-1"
        >
          {showBiomarkers ? '▾' : '▸'} Optional: Biomarker Adjustments (insulin, HsCRP, Vit D, Homocysteine)
        </button>
        {showBiomarkers && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-800/30 rounded-lg p-3">
            {([
              { key: 'morningSerumInsulin', label: 'Insulin (µIU/mL)', hint: '>25 = faster loss' },
              { key: 'hsCRP', label: 'HsCRP (mg/L)', hint: '>3 = slower loss' },
              { key: 'vitaminD', label: 'Vitamin D (ng/mL)', hint: '<30 = slower loss' },
              { key: 'homocysteine', label: 'Homocysteine (µmol/L)', hint: '>15 = slower loss' },
            ] as const).map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-[0.6rem] text-gray-500 mb-1">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={biomarkers[key] ?? ''}
                  onChange={(e) => updateBiomarker(key, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white"
                  placeholder="—"
                />
                <p className="text-[0.55rem] text-gray-600 mt-0.5">{hint}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 transition-all text-sm"
      >
        {loading ? 'Calculating...' : 'Compare ATHERYX™ vs ELYSION™'}
      </button>
    </form>
  );
}
