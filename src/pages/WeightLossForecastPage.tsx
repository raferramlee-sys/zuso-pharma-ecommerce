import { useState, useCallback, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import ForecastForm from '../components/forecast/ForecastForm'
import ForecastChart from '../components/forecast/ForecastChart'
import ComparisonView from '../components/forecast/ComparisonView'
import { calculateForecast } from '../lib/forecast-model'
import type { PatientInput, ForecastResult, IntensityLevel } from '../lib/forecast-model'

// Intensity → uptitration interval
const INTENSITY_INTERVALS: Record<IntensityLevel, number> = {
  mild: 6,
  moderate: 4,
  aggressive: 2,
}

export default function WeightLossForecastPage() {
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [intervalWeeks, setIntervalWeeks] = useState(4)
  const [startingDoseAth, setStartingDoseAth] = useState<number | undefined>()
  const [startingDoseEly, setStartingDoseEly] = useState<number | undefined>()
  const lastInputRef = useRef<PatientInput | null>(null)

  const recalc = useCallback((input: PatientInput, doseAth?: number, doseEly?: number) => {
    try {
      const r = calculateForecast({
        ...input,
        startingDoseAth: doseAth,
        startingDoseEly: doseEly,
      })
      setResult(r)
      setIntervalWeeks(INTENSITY_INTERVALS[input.intensity])
    } catch (e: any) {
      setError(e.message || 'Calculation error')
    }
  }, [])

  const handleSubmit = (input: PatientInput) => {
    setLoading(true)
    setError('')
    lastInputRef.current = input
    setStartingDoseAth(undefined)
    setStartingDoseEly(undefined)
    recalc(input)
    setLoading(false)
  }

  const handleStartingDoseAthChange = useCallback((dose: number | undefined) => {
    setStartingDoseAth(dose)
    if (lastInputRef.current) recalc(lastInputRef.current, dose, startingDoseEly)
  }, [recalc, startingDoseEly])

  const handleStartingDoseElyChange = useCallback((dose: number | undefined) => {
    setStartingDoseEly(dose)
    if (lastInputRef.current) recalc(lastInputRef.current, startingDoseAth, dose)
  }, [recalc, startingDoseAth])

  return (
    <>
      <Helmet>
        <title>Weight Loss Forecast Calculator — Zuso Pharma</title>
        <meta name="description" content="Compare ATHERYX™ Retatrutide vs ELYSION™ Tirzepatide weight loss timeline. Select intensity — the calculator recommends the best product and dose titration for you." />
        <link rel="canonical" href="https://pharma.zuso-boltz-agentic.app/forecast" />
        <meta property="og:title" content="Weight Loss Forecast Calculator | Zuso Pharma" />
        <meta property="og:description" content="Compare ATHERYX™ vs ELYSION™ weight loss timeline with personalized dose titration." />
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
        <meta name="twitter:description" content="Compare ATHERYX™ vs ELYSION™ weight loss timeline with personalized dose titration." />
        <meta name="twitter:image" content="https://pharma.zuso-boltz-agentic.app/og-image.png" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/products" className="text-sm text-pharma-400 hover:text-white mb-6 inline-block">
          ← Back to Products
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Weight Loss Forecast <span className="text-accent-400">Calculator</span>
          </h1>
          <p className="text-pharma-400 text-sm max-w-xl mx-auto">
            Select your weight loss intensity. We compare ATHERYX™ Retatrutide vs ELYSION™ Tirzepatide
            — recommending the best product, dose titration, and projected timeline for each.
          </p>
        </div>

        <div className="rounded-xl border border-pharma-700 bg-pharma-800/20 p-5 mb-8">
          <ForecastForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 mb-6">{error}</div>
        )}

        {result && (
          <div className="space-y-6">
            <ForecastChart
              atheryxRows={result.atheryx.rows}
              elysionRows={result.elysion.rows}
              startingWeight={result.atheryx.summary.starting_weight}
              targetWeight={result.target_weight}
              intervalWeeks={intervalWeeks}
            />

            <ComparisonView
              atheryx={result.atheryx}
              elysion={result.elysion}
              biomarkerMultiplier={result.biomarker_multiplier}
              hasBiomarkers={result.has_biomarkers}
              startingDoseAth={startingDoseAth}
              startingDoseEly={startingDoseEly}
              onStartingDoseAthChange={handleStartingDoseAthChange}
              onStartingDoseElyChange={handleStartingDoseElyChange}
            />

            <p className="text-xs text-pharma-600 text-center">
              ⚠️ Forecast based on clinical trial averages (SURMOUNT-1, Retatrutide Phase 2)
              and optional biomarker adjustments. Individual results vary. Rx only.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
