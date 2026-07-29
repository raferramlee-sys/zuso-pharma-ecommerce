import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ForecastForm from '../components/forecast/ForecastForm';
import ForecastChart from '../components/forecast/ForecastChart';
import ForecastTable from '../components/forecast/ForecastTable';
import ForecastSummary from '../components/forecast/ForecastSummary';
import { compareForecast, type ForecastInput, type ComparisonResult } from '../lib/forecast-model';
import { products } from '../lib/products';

export default function WeightLossForecastPage() {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'atheryx' | 'elysion'>('atheryx');

  const handleSubmit = (input: ForecastInput) => {
    setLoading(true);
    // Small delay for UX
    setTimeout(() => {
      try {
        const result = compareForecast(input, products);
        setComparison(result);
        setActiveChart('atheryx');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <>
      <Helmet>
        <title>Weight Loss Forecast Calculator — Zuso Pharma</title>
        <meta name="description" content="Compare ATHERYX™ Retatrutide vs ELYSION™ Tirzepatide. Personalized weight loss forecast with dose titration, BMI tracking, and biomarker adjustments." />
        <meta property="og:title" content="Weight Loss Forecast Calculator — Zuso Pharma" />
        <meta property="og:description" content="Compare ATHERYX™ Retatrutide vs ELYSION™ Tirzepatide. Personalized weight loss forecast." />
        <meta name="twitter:title" content="Weight Loss Forecast Calculator — Zuso Pharma" />
        <meta name="twitter:description" content="Compare ATHERYX™ Retatrutide vs ELYSION™ Tirzepatide. Personalized weight loss forecast." />
        <link rel="canonical" href="https://pharma.zuso-boltz-agentic.app/forecast" />
        <link rel="alternate" hrefLang="en-MY" href="https://pharma.zuso-boltz-agentic.app/forecast" />
        <link rel="alternate" hrefLang="x-default" href="https://pharma.zuso-boltz-agentic.app/forecast" />
      </Helmet>

      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/products" className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block">
            ← Back to Products
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">Weight Loss Forecast Calculator</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-2xl">
            Select your weight loss intensity. We compare ATHERYX™ Retatrutide vs ELYSION™ Tirzepatide —
            recommending the best product, dose titration, and projected timeline for each.
          </p>

          <div className="space-y-8">
            <ForecastForm onSubmit={handleSubmit} loading={loading} />

            {comparison && (
              <>
                {/* Chart */}
                <ForecastChart
                  atheryxRows={comparison.atheryx.rows}
                  elysionRows={comparison.elysion.rows}
                  targetWeight={comparison.target_weight}
                  activeBrand={activeChart}
                  onToggle={setActiveChart}
                />

                {/* Summary */}
                <ForecastSummary comparison={comparison} />

                {/* Side-by-side tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ForecastTable
                    result={comparison.atheryx}
                    color="text-purple-400"
                    borderColor="border-purple-500/30"
                  />
                  <ForecastTable
                    result={comparison.elysion}
                    color="text-blue-400"
                    borderColor="border-blue-500/30"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
