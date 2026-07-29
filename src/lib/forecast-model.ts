import { products } from './products'

export interface BiomarkerInput {
  morningSerumInsulin?: number    // µIU/mL
  hsCRP?: number                  // mg/L
  vitaminD?: number               // ng/mL
  homocysteine?: number           // µmol/L
}

export interface PatientInput {
  height_cm: number
  weight_kg: number
  gender: 'male' | 'female'
  age: number
  target_weight_kg: number
  selectedProductSlug: string
  biomarkers?: BiomarkerInput
}

export interface ForecastRow {
  week: number
  date: string
  dose_mg: number
  dose_name: string
  weight_kg: number
  bmi: number
  bmi_classification: string
  cumulative_loss_kg: number
  cumulative_loss_pct: number
}

export interface ForecastResult {
  product: {
    slug: string
    brand: string
    peptide: string
    dosage_mg: number
    per_dose_mg: number
    name: string
  }
  starting_bmi: number
  starting_bmi_class: string
  target_bmi: number
  target_weight_loss_kg: number
  total_weeks: number
  weekly_loss_rate_pct: number
  titration_schedule: { startWeek: number; endWeek: number; dose_mg: number; per_dose_mg: number; label: string }[]
  rows: ForecastRow[]
  summary: {
    product_name: string
    starting_weight: number
    target_weight: number
    total_loss_kg: number
    total_loss_pct: number
    estimated_weeks: number
    estimated_months: string
    average_weekly_loss_kg: number
    first_dose_date: string
    last_dose_date: string
  }
}

// Asian (Malaysian) BMI classification
function classifyBMIMalaysian(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 23) return 'Normal'
  if (bmi < 27.5) return 'Overweight'
  return 'Obese'
}

// Base weekly weight loss rates from clinical trial data (% of body weight)
function getBaseWeeklyRate(peptide: string, dose_per_week_mg: number): number {
  if (peptide === 'Retatrutide') {
    if (dose_per_week_mg <= 2) return 0.30
    if (dose_per_week_mg <= 6) return 0.50
    return 0.70
  }
  // Tirzepatide
  if (dose_per_week_mg <= 2.5) return 0.25
  if (dose_per_week_mg <= 5) return 0.40
  if (dose_per_week_mg <= 10) return 0.55
  return 0.65
}

// Biomarker multiplier calculation
export function calcBiomarkerMultiplier(bio?: BiomarkerInput): number {
  if (!bio) return 1.0
  let multiplier = 1.0

  // High fasting insulin → insulin resistant → better GLP-1 response
  if (bio.morningSerumInsulin !== undefined) {
    if (bio.morningSerumInsulin > 25) multiplier *= 1.1
    else if (bio.morningSerumInsulin > 15) multiplier *= 1.05
  }

  // High inflammation → mildly slower initial response
  if (bio.hsCRP !== undefined) {
    if (bio.hsCRP > 3) multiplier *= 0.92
    else if (bio.hsCRP > 1) multiplier *= 0.96
  }

  // Low Vitamin D → reduced metabolic efficiency
  if (bio.vitaminD !== undefined) {
    if (bio.vitaminD < 20) multiplier *= 0.85
    else if (bio.vitaminD < 30) multiplier *= 0.92
  }

  // High homocysteine → metabolic/cardiovascular stress → slightly slower
  if (bio.homocysteine !== undefined) {
    if (bio.homocysteine > 15) multiplier *= 0.9
    else if (bio.homocysteine > 10) multiplier *= 0.95
  }

  return Math.round(multiplier * 100) / 100
}

// Titration schedule based on product and peptide
function buildTitrationSchedule(
  peptide: string,
  dosage_mg: number,
  per_dose_mg: number
): { startWeek: number; endWeek: number; dose_mg: number; per_dose_mg: number; label: string }[] {
  if (peptide === 'Retatrutide') {
    // Retatrutide: 2mg → 4mg → 6mg → 8mg → 12mg
    const steps: typeof schedule = []
    if (dosage_mg >= 10) steps.push({ startWeek: 1, endWeek: 4, dose_mg: 2, per_dose_mg: 2, label: '2mg starter' })
    if (dosage_mg >= 30) {
      steps.push({ startWeek: 5, endWeek: 8, dose_mg: 4, per_dose_mg: 4, label: '4mg titrate' })
      steps.push({ startWeek: 9, endWeek: 12, dose_mg: 6, per_dose_mg: 6, label: '6mg titrate' })
    }
    if (dosage_mg >= 60) {
      steps.push({ startWeek: 13, endWeek: 16, dose_mg: 8, per_dose_mg: 8, label: '8mg titrate' })
    }
    steps.push({ startWeek: dosage_mg >= 60 ? 17 : (dosage_mg >= 30 ? 13 : 5), endWeek: 999, dose_mg: per_dose_mg, per_dose_mg, label: `${per_dose_mg}mg maintenance` })
    return steps
  }

  // Tirzepatide: 2.5mg → 5mg → 7.5mg → 10mg → 12.5mg → 15mg
  const steps: { startWeek: number; endWeek: number; dose_mg: number; per_dose_mg: number; label: string }[] = []
  if (per_dose_mg >= 2.5) steps.push({ startWeek: 1, endWeek: 4, dose_mg: 2.5, per_dose_mg: 2.5, label: '2.5mg starter' })
  if (per_dose_mg >= 5) steps.push({ startWeek: 5, endWeek: 8, dose_mg: 5, per_dose_mg: 5, label: '5mg titrate' })
  if (per_dose_mg >= 10) steps.push({ startWeek: 9, endWeek: 12, dose_mg: 7.5, per_dose_mg: 7.5, label: '7.5mg titrate' })
  if (per_dose_mg >= 12.5) steps.push({ startWeek: 13, endWeek: 16, dose_mg: 10, per_dose_mg: 10, label: '10mg titrate' })
  const maintenanceStart = per_dose_mg >= 12.5 ? 17 : (per_dose_mg >= 10 ? 13 : (per_dose_mg >= 5 ? 9 : 5))
  steps.push({ startWeek: maintenanceStart, endWeek: 999, dose_mg: per_dose_mg, per_dose_mg, label: `${per_dose_mg}mg maintenance` })
  return steps
}

export function calculateForecast(input: PatientInput): ForecastResult {
  const { height_cm, weight_kg, target_weight_kg, selectedProductSlug, biomarkers } = input
  const height_m = height_cm / 100
  const starting_bmi = weight_kg / (height_m * height_m)

  // Product lookup from static products
  const product = products.find((p) => p.slug === selectedProductSlug)
  if (!product) throw new Error(`Product not found: ${selectedProductSlug}`)

  const peptide = product.peptide
  const dosage_mg = product.dosage_mg
  const per_dose_mg = product.per_dose_mg
  const brand = product.brand

  const biomult = calcBiomarkerMultiplier(biomarkers)
  const titration = buildTitrationSchedule(peptide, dosage_mg, per_dose_mg)

  // Calculate weeks needed
  let totalLossNeeded = weight_kg - target_weight_kg
  if (totalLossNeeded <= 0) totalLossNeeded = 1 // minimum 1kg

  // Simulate week by week
  const rows: ForecastRow[] = []
  let currentWeight = weight_kg
  let cumulativeLoss = 0
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  let week = 1
  while (currentWeight > target_weight_kg && week <= 104) {
    const date = new Date(startDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
    const doseStep = titration.find(s => week >= s.startWeek && week <= s.endWeek) || titration[titration.length - 1]
    const dose_mg_val = doseStep.per_dose_mg
    const baseRate = getBaseWeeklyRate(peptide, dose_mg_val)
    const effectiveRate = baseRate * biomult

    const weeklyLoss = currentWeight * (effectiveRate / 100)
    currentWeight = Math.max(currentWeight - weeklyLoss, target_weight_kg)
    cumulativeLoss = weight_kg - currentWeight

    const bmi = currentWeight / (height_m * height_m)

    rows.push({
      week,
      date: date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }),
      dose_mg: dose_mg_val,
      dose_name: doseStep.label,
      weight_kg: Math.round(currentWeight * 10) / 10,
      bmi: Math.round(bmi * 10) / 10,
      bmi_classification: classifyBMIMalaysian(bmi),
      cumulative_loss_kg: Math.round(cumulativeLoss * 10) / 10,
      cumulative_loss_pct: Math.round((cumulativeLoss / weight_kg) * 1000) / 10,
    })

    week++
  }

  const totalWeeks = rows.length
  const avgWeeklyLoss = cumulativeLoss / totalWeeks
  const finalDate = new Date(startDate.getTime() + (totalWeeks - 1) * 7 * 24 * 60 * 60 * 1000)

  return {
    product: {
      slug: product.slug,
      brand,
      peptide,
      dosage_mg,
      per_dose_mg,
      name: product.name,
    },
    starting_bmi: Math.round(starting_bmi * 10) / 10,
    starting_bmi_class: classifyBMIMalaysian(starting_bmi),
    target_bmi: Math.round((target_weight_kg / (height_m * height_m)) * 10) / 10,
    target_weight_loss_kg: Math.round(totalLossNeeded * 10) / 10,
    total_weeks: totalWeeks,
    weekly_loss_rate_pct: Math.round(avgWeeklyLoss / weight_kg * 10000) / 100,
    titration_schedule: titration.filter(t => t.endWeek < 999 || t.startWeek <= totalWeeks),
    rows,
    summary: {
      product_name: `${brand === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'} ${peptide} ${dosage_mg}mg`,
      starting_weight: weight_kg,
      target_weight: target_weight_kg,
      total_loss_kg: Math.round(cumulativeLoss * 10) / 10,
      total_loss_pct: Math.round((cumulativeLoss / weight_kg) * 1000) / 10,
      estimated_weeks: totalWeeks,
      estimated_months: `${Math.floor(totalWeeks / 4)} months, ${totalWeeks % 4} weeks`,
      average_weekly_loss_kg: Math.round(avgWeeklyLoss * 100) / 100,
      first_dose_date: startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }),
      last_dose_date: finalDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
  }
}
