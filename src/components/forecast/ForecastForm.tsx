import { useState } from 'react'
import { products } from '../../lib/products'
import type { BiomarkerInput, PatientInput } from '../../lib/forecast-model'

interface ForecastFormProps {
  onSubmit: (input: PatientInput) => void
  loading: boolean
}

export default function ForecastForm({ onSubmit, loading }: ForecastFormProps) {
  const [height, setHeight] = useState(165)
  const [weight, setWeight] = useState(85)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState<'male' | 'female'>('female')
  const [targetWeight, setTargetWeight] = useState(65)
  const [selectedSlug, setSelectedSlug] = useState(products[0].slug)
  const [showBiomarkers, setShowBiomarkers] = useState(false)
  const [insulin, setInsulin] = useState('')
  const [hsCRP, setHsCRP] = useState('')
  const [vitaminD, setVitaminD] = useState('')
  const [homocysteine, setHomocysteine] = useState('')

  // Auto-calculate target weight as ~75% of current (healthy weight loss)
  const suggestTarget = (w: number) => Math.round(w * 0.76 * 10) / 10

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
      target_weight_kg: targetWeight,
      selectedProductSlug: selectedSlug,
      biomarkers: Object.keys(biomarkers).length > 0 ? biomarkers : undefined,
    })
  }

  const bmi = weight / ((height / 100) * (height / 100))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={140} max={220} step={0.1}
          />
        </div>
        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => { const w = Number(e.target.value); setWeight(w); setTargetWeight(suggestTarget(w)) }}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={40} max={250} step={0.1}
          />
        </div>
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={18} max={100}
          />
        </div>
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value as 'male' | 'female')}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      {/* BMI indicator */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-pharma-400">Current BMI:</span>
        <span className="font-bold text-white">{bmi.toFixed(1)}</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pharma-700 text-pharma-300">
          {bmi < 18.5 ? 'Underweight' : bmi < 23 ? 'Normal' : bmi < 27.5 ? 'Overweight' : 'Obese'}
        </span>
      </div>

      {/* Target weight + Product */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Target Weight (kg)</label>
          <input
            type="number"
            value={targetWeight}
            onChange={e => setTargetWeight(Number(e.target.value))}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            min={40} max={weight} step={0.1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-pharma-300 mb-1">Product</label>
          <select
            value={selectedSlug}
            onChange={e => setSelectedSlug(e.target.value)}
            className="w-full bg-pharma-800 border border-pharma-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
          >
            {products.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.brand === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'} {p.peptide} {p.dosage_mg}mg ({p.per_dose_mg}mg/dose)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Biomarker toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowBiomarkers(!showBiomarkers)}
          className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1"
        >
          <span>{showBiomarkers ? '▾' : '▸'} Optional: Biomarker Adjustments</span>
          <span className="text-pharma-500 text-xs">(insulin, HsCRP, Vit D, Homocysteine)</span>
        </button>

        {showBiomarkers && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-4 rounded-lg border border-pharma-700 bg-pharma-800/50">
            <div>
              <label className="block text-xs text-pharma-400 mb-1">Morning Insulin (µIU/mL)</label>
              <input type="number" value={insulin} onChange={e => setInsulin(e.target.value)}
                placeholder="5-25" className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" />
            </div>
            <div>
              <label className="block text-xs text-pharma-400 mb-1">HsCRP (mg/L)</label>
              <input type="number" value={hsCRP} onChange={e => setHsCRP(e.target.value)}
                placeholder="<3" className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" />
            </div>
            <div>
              <label className="block text-xs text-pharma-400 mb-1">Vitamin D (ng/mL)</label>
              <input type="number" value={vitaminD} onChange={e => setVitaminD(e.target.value)}
                placeholder="30-100" className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" />
            </div>
            <div>
              <label className="block text-xs text-pharma-400 mb-1">Homocysteine (µmol/L)</label>
              <input type="number" value={homocysteine} onChange={e => setHomocysteine(e.target.value)}
                placeholder="<15" className="w-full bg-pharma-900 border border-pharma-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-500" />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-accent-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {loading ? 'Calculating...' : 'Calculate Weight Loss Forecast'}
      </button>
    </form>
  )
}
