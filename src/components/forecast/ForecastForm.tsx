import { useMemo, useState } from 'react'
import { autoTargetWeight } from '../../lib/forecast-model'
import type { BiomarkerInput, PatientInput, IntensityLevel } from '../../lib/forecast-model'

interface ForecastFormProps {
  onSubmit: (input: PatientInput) => void
  loading: boolean
}

const INTENSITY_OPTIONS: { value: IntensityLevel; label: string; desc: string; rate: string; icon: string }[] = [
  { value: 'mild',       label: 'Mild',       desc: 'Slow & steady — uptitrate every 6 weeks',      rate: '0.25–0.35%', icon: '🐢' },
  { value: 'moderate',   label: 'Moderate',   desc: 'Balanced — uptitrate every 4 weeks',            rate: '0.40–0.55%', icon: '⚡' },
  { value: 'aggressive', label: 'Aggressive',  desc: 'Maximum speed — uptitrate every 2 weeks',       rate: '0.60–0.70%', icon: '🚀' },
]

export default function ForecastForm({ onSubmit, loading }: ForecastFormProps) {
  const defaultHeight = 165
  const defaultWeight = 85

  const [height, setHeight] = useState(defaultHeight)
  const [weight, setWeight] = useState(defaultWeight)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState<'male' | 'female'>('female')
  const [intensity, setIntensity] = useState<IntensityLevel>('moderate')
  const [showBiomarkers, setShowBiomarkers] = useState(false)
  const [insulin, setInsulin] = useState('')
  const [hsCRP, setHsCRP] = useState('')
  const [vitaminD, setVitaminD] = useState('')
  const [homocysteine, setHomocysteine] = useState('')

  const targetWeight = useMemo(() => autoTargetWeight(height), [height])
  const bmi = weight / ((height / 100) * (height / 100))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const biomarkers: BiomarkerInput = {}
    if (insulin) biomarkers.morningSerumInsulin = parseFloat(insulin)
    if (hsCRP) biomarkers.hsCRP = parseFloat(hsCRP)
    if (vitaminD) biomarkers.vitaminD = parseFloat(vitaminD)
    if (homocysteine) biomarkers.homocysteine = parseFloat(homocysteine)

    onSubmit({
      height_cm: height,
      weight_kg: weight,
      age,
      gender,
      intensity,
      biomarkers: Object.keys(biomarkers).length > 0 ? biomarkers : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Height (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={140} max={220} step={0.1} />
        </div>
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={40} max={250} step={0.1} />
        </div>
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Age</label>
          <input type="number" value={age} onChange={e => setAge(Number(e.target.value))}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={18} max={100} />
        </div>
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Gender</label>
          <select value={gender} onChange={e => setGender(e.target.value as 'male' | 'female')}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500">
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      {/* BMI + target row */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-pharma-400">BMI:</span>
          <span className="font-bold text-white">{bmi.toFixed(1)}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            bmi < 18.5 ? 'bg-blue-500/20 text-blue-400' : bmi < 23 ? 'bg-green-500/20 text-green-400' :
            bmi < 27.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {bmi < 18.5 ? 'Underweight' : bmi < 23 ? 'Normal' : bmi < 27.5 ? 'Overweight' : 'Obese'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-pharma-400">Target:</span>
          <span className="font-bold text-green-400">{targetWeight} kg</span>
          <span className="text-pharma-500 text-xs">(BMI 22.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-pharma-400">To lose:</span>
          <span className="font-bold text-accent-400">{Math.max(0, Math.round((weight - targetWeight) * 10) / 10)} kg</span>
        </div>
      </div>

      {/* Intensity selector */}
      <div>
        <label className="block text-sm font-medium text-pharma-300 mb-3">
          Weight Loss Intensity
          <span className="text-pharma-500 text-xs ml-1">(the calculator recommends the best product for you)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INTENSITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setIntensity(opt.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                intensity === opt.value
                  ? 'border-accent-500 bg-accent-500/10 shadow-lg shadow-accent-500/10'
                  : 'border-pharma-700 bg-pharma-800/50 hover:border-pharma-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{opt.icon}</span>
                <span className={`font-bold text-sm ${intensity === opt.value ? 'text-accent-400' : 'text-white'}`}>{opt.label}</span>
              </div>
              <div className="text-xs text-pharma-400 mb-1">{opt.desc}</div>
              <div className={`text-xs font-mono ${intensity === opt.value ? 'text-accent-300' : 'text-pharma-500'}`}>
                ~{opt.rate} / week
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Biomarker toggle */}
      <div>
        <button type="button" onClick={() => setShowBiomarkers(!showBiomarkers)}
          className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1">
          <span>{showBiomarkers ? '▾' : '▸'} Optional: Biomarker Adjustments</span>
          <span className="text-pharma-500 text-xs">(insulin, HsCRP, Vit D, Homocysteine)</span>
        </button>
        {showBiomarkers && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-4 rounded-lg border border-pharma-700 bg-pharma-800/50">
            <div><label className="block text-xs text-pharma-400 mb-1">Morning Insulin (µIU/mL)</label>
              <input type="number" value={insulin} onChange={e => setInsulin(e.target.value)} placeholder="5-25"
                className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" /></div>
            <div><label className="block text-xs text-pharma-400 mb-1">HsCRP (mg/L)</label>
              <input type="number" value={hsCRP} onChange={e => setHsCRP(e.target.value)} placeholder="<3"
                className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" /></div>
            <div><label className="block text-xs text-pharma-400 mb-1">Vitamin D (ng/mL)</label>
              <input type="number" value={vitaminD} onChange={e => setVitaminD(e.target.value)} placeholder="30-100"
                className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" /></div>
            <div><label className="block text-xs text-pharma-400 mb-1">Homocysteine (µmol/L)</label>
              <input type="number" value={homocysteine} onChange={e => setHomocysteine(e.target.value)} placeholder="<15"
                className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" /></div>
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-accent-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
        {loading ? 'Calculating...' : 'Compare ATHERYX™ vs ELYSION™'}
      </button>
    </form>
  )
}
