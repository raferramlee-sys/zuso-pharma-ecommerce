import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import ForecastForm from '../components/forecast/ForecastForm'
import ForecastChart from '../components/forecast/ForecastChart'
import ForecastTable from '../components/forecast/ForecastTable'
import ForecastSummary from '../components/forecast/ForecastSummary'
import { calculateForecast, calcBiomarkerMultiplier } from '../lib/forecast-model'
import type { PatientInput, ForecastResult } from '../lib/forecast-model'

export default function WeightLossForecastPage() {
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [biomarkerMultiplier, setBiomarkerMultiplier] = useState(1.0)
  const [hasBiomarkers, setHasBiomarkers] = useState(false)

  const handleSubmit = (input: PatientInput) => {
    setLoading(true)
    setError('')
    try {
      const r = calculateForecast(input)
      setResult(r)
      setBiomarkerMultiplier(calcBiomarkerMultiplier(input.biomarkers))
      setHasBiomarkers(!!input.biomarkers && Object.keys(input.biomarkers).length > 0)
    } catch (e: any) {
      setError(e.message || 'Calculation error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Weight Loss Forecast Calculator — Zuso Pharma</title>
        <meta name="description" content="Calculate your personalized weight loss timeline with FDA-approved peptide therapy. Enter height, weight, biomarkers — get weekly dose schedule, BMI tracker, and target date." />
        <link rel="canonical" href="https://pharma.zuso-boltz-agentic.app/forecast" />
        <meta property="og:title" content="Weight Loss Forecast Calculator | Zuso Pharma" />
        <meta property="og:description" content="Calculate your personalized weight loss timeline with FDA-approved peptide therapy." />
        <meta property="og:url" content="https://pharma.zuso-boltz-agentic.app/forecast" />
        <meta property="og:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_MY" />
        <link rel="alternate" hrefLang="en-MY" href="https://pharma.zuso-boltz-agentic.app/forecast" />
        <link rel="alternate" hrefLang="x-default" href="https://pharma.zuso-boltz-agentic.app/forecast" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zusopharma" />
        <meta name="twitter:title" content="Weight Loss Forecast Calculator | Zuso Pharma" />
        <meta name="twitter:description" content="Calculate your personalized weight loss timeline with FDA-approved peptide therapy." />
        <meta name="twitter:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link to="/products" className="text-sm text-pharma-400 hover:text-white mb-6 inline-block">
          ← Back to Products
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Weight Loss Forecast <span className="text-accent-400">Calculator</span>
          </h1>
          <p className="text-pharma-400 text-sm max-w-xl mx-auto">
            Enter your metrics and optional biomarkers. We calculate a personalized weekly dose schedule,
            projected weight loss curve, and estimated time to reach your target — based on clinical trial data.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-pharma-700 bg-pharma-800/20 p-5 mb-8">
          <ForecastForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in">
            <ForecastSummary
              result={result}
              biomarkerMultiplier={biomarkerMultiplier}
              hasBiomarkers={hasBiomarkers}
            />

            <ForecastChart
              rows={result.rows}
              startingWeight={result.summary.starting_weight}
              targetWeight={result.summary.target_weight}
              totalWeeks={result.total_weeks}
            />

            <ForecastTable rows={result.rows} />

            {/* Disclaimer */}
            <p className="text-xs text-pharma-600 text-center">
              ⚠️ This forecast is based on clinical trial averages (SURMOUNT-1, Retatrutide Phase 2) 
              and optional biomarker adjustments. Individual results vary. Consult a doctor before starting peptide therapy.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
