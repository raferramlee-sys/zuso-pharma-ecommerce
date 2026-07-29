import { products } from './products'
import type { Product } from '../types'

export interface BiomarkerInput {
  morningSerumInsulin?: number    // µIU/mL
  hsCRP?: number                  // mg/L
  vitaminD?: number               // ng/mL
  homocysteine?: number           // µmol/L
}

export interface PatientInput {
  height_cm: number
  weight_kg: number
  age: number
  gender: 'male' | 'female'
  selectedProductSlug: string
  biomarkers?: BiomarkerInput
  // target_weight_kg is AUTO-CALCULATED: BMI 22.5 × height²
}

export interface ForecastRow {
  week: number
  date: string
  dose_mg: number
  weight_kg: number
  bmi: number
  bmi_classification: string
  cumulative_loss_kg: number
  cumulative_loss_pct: number
}

export interface ForecastResult {
  product: Product
  rows: ForecastRow[]
  total_weeks: number
  starting_bmi: number
  starting_bmi_class: string
  target_bmi: number
  titration_schedule: { startWeek: number; endWeek: number; dose_mg: number; per_dose_mg: number; label: string }[]
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

// Auto-calculate target weight from BMI 22.5 (Asian middle-normal)
export function autoTargetWeight(height_cm: number): number {
  const height_m = height_cm / 100
  return Math.round(22.5 * height_m * height_m * 10) / 10
}

// Asian BMI classification
function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 23) return 'Normal'
  if (bmi < 27.5) return 'Overweight'
  return 'Obese'
}

// Biomarker multiplier calculation
export function calcBiomarkerMultiplier(bio?: BiomarkerInput): number {
  if (!bio) return 1.0
  let multiplier = 1.0

  // High insulin = better GLP-1 response (insulin resistance responds well)
  if (bio.morningSerumInsulin && bio.morningSerumInsulin > 25) multiplier *= 1.1
  // High inflammation = slower response
  if (bio.hsCRP && bio.hsCRP > 3) multiplier *= 0.92
  // Low vitamin D = slower metabolic response
  if (bio.vitaminD && bio.vitaminD < 30) multiplier *= 0.85
  // High homocysteine = cardiovascular stress, slower
  if (bio.homocysteine && bio.homocysteine > 15) multiplier *= 0.90

  return Math.round(multiplier * 1000) / 1000
}

// Clinical trial weekly weight loss rates (percentage of current body weight per week)
// Key: peptide type | Value: { dose_mg: weekly_loss_pct }
const RETATRUTIDE_RATES: Record<number, number> = {
  2: 0.30,   // Starter
  4: 0.40,
  6: 0.50,
  8: 0.60,
  12: 0.70,  // Max efficacy
}

const TIRZEPATIDE_RATES: Record<number, number> = {
  2.5: 0.25,  // Starter
  5: 0.40,
  7.5: 0.50,
  10: 0.55,
  12.5: 0.60,
  15: 0.65,   // Max efficacy
}

// Peptide titration steps: [dose_mg, ...]
const RETATRUTIDE_STEPS = [2, 4, 6, 8, 12]
const TIRZEPATIDE_STEPS = [2.5, 5, 7.5, 10, 12.5, 15]

function buildTitrationSchedule(peptide: string, ceilingDoseMg: number, perDoseMg: number): { startWeek: number; endWeek: number; dose_mg: number; per_dose_mg: number; label: string }[] {
  const steps = peptide.toLowerCase().includes('tirzepatide') ? TIRZEPATIDE_STEPS : RETATRUTIDE_STEPS
  // Filter steps up to ceiling dose
  const activeSteps = steps.filter(d => d <= perDoseMg)
  // If ceiling is below the first step, just use the ceiling
  if (activeSteps.length === 0) {
    return [{ startWeek: 1, endWeek: 999, dose_mg: ceilingDoseMg, per_dose_mg: perDoseMg, label: `${perDoseMg}mg maintenance` }]
  }

  const schedule: { startWeek: number; endWeek: number; dose_mg: number; per_dose_mg: number; label: string }[] = []
  let week = 1
  // Titration: 4 weeks per step
  for (let i = 0; i < activeSteps.length; i++) {
    const dose = activeSteps[i]
    const isLast = i === activeSteps.length - 1
    schedule.push({
      startWeek: week,
      endWeek: isLast ? 999 : week + 3, // 4-week blocks
      dose_mg: ceilingDoseMg, // total pen dose (for display in product context)
      per_dose_mg: dose,
      label: `${dose}mg/dose${isLast ? ' (maintenance)' : ''}`,
    })
    week += 4
  }

  return schedule
}

function getWeeklyLossRate(peptide: string, doseMg: number): number {
  const rates = peptide.toLowerCase().includes('tirzepatide') ? TIRZEPATIDE_RATES : RETATRUTRIDE_RATES
  // Find closest rate
  const keys = Object.keys(rates).map(Number).sort((a, b) => a - b)
  let closest = keys[0]
  for (const k of keys) {
    if (Math.abs(k - doseMg) < Math.abs(closest - doseMg)) closest = k
  }
  return rates[closest] || 0.25
}

export function calculateForecast(input: PatientInput): ForecastResult {
  const { height_cm, weight_kg, age, gender, selectedProductSlug, biomarkers } = input
  const height_m = height_cm / 100
  const target_weight_kg = autoTargetWeight(height_cm)
  const starting_bmi = weight_kg / (height_m * height_m)
  const target_bmi = Math.round((22.5) * 10) / 10

  // Product lookup
  const product = products.find((p) => p.slug === selectedProductSlug)
  if (!product) throw new Error(`Product not found: ${selectedProductSlug}`)

  const peptide = product.peptide
  const per_dose_mg = product.per_dose_mg // This is the CEILING dose

  // Build titration schedule (product dose = ceiling)
  const titration = buildTitrationSchedule(peptide, product.dosage_mg, per_dose_mg)

  // Biomarker multiplier
  const biomarkerMult = calcBiomarkerMultiplier(biomarkers)

  // Generate weekly forecast
  const rows: ForecastRow[] = []
  let currentWeight = weight_kg
  let week = 1
  const startDate = new Date()
  const maxWeeks = 104 // 2 year cap

  while (currentWeight > target_weight_kg && week <= maxWeeks) {
    // Find current dose from titration schedule
    let currentDose = per_dose_mg // fallback
    for (const step of titration) {
      if (week >= step.startWeek && week <= step.endWeek) {
        currentDose = step.per_dose_mg
        break
      }
    }

    // Weekly loss rate adjusted by biomarker
    const baseRate = getWeeklyLossRate(peptide, currentDose) / 100
    const adjustedRate = baseRate * biomarkerMult

    // Apply diminishing returns as weight decreases
    const proximityFactor = (currentWeight - target_weight_kg) / (weight_kg - target_weight_kg)
    const effectiveRate = adjustedRate * Math.max(0.3, proximityFactor)

    const weeklyLoss = currentWeight * effectiveRate
    currentWeight = Math.max(target_weight_kg, Math.round((currentWeight - weeklyLoss) * 10) / 10)

    const currentBMI = currentWeight / (height_m * height_m)
    const cumulativeLoss = weight_kg - currentWeight
    const cumulativeLossPct = Math.round((cumulativeLoss / weight_kg) * 1000) / 10

    // Date calculation
    const rowDate = new Date(startDate)
    rowDate.setDate(rowDate.getDate() + (week - 1) * 7)

    rows.push({
      week,
      date: rowDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      dose_mg: currentDose,
      weight_kg: currentWeight,
      bmi: Math.round(currentBMI * 10) / 10,
      bmi_classification: classifyBMI(currentBMI),
      cumulative_loss_kg: Math.round(cumulativeLoss * 10) / 10,
      cumulative_loss_pct: cumulativeLossPct,
    })

    week++
  }

  const totalWeeks = rows.length
  const finalRow = rows[rows.length - 1]

  // Summary
  const totalLossKg = Math.round((weight_kg - finalRow.weight_kg) * 10) / 10
  const totalLossPct = Math.round((totalLossKg / weight_kg) * 1000) / 10
  const avgWeeklyLoss = Math.round((totalLossKg / totalWeeks) * 100) / 100

  const firstDate = rows[0].date
  const lastDate = totalWeeks > 0 ? rows[totalWeeks - 1].date : firstDate
  const months = Math.floor(totalWeeks / 4)
  const remWeeks = totalWeeks % 4

  return {
    product,
    rows,
    total_weeks: totalWeeks,
    starting_bmi: Math.round(starting_bmi * 10) / 10,
    starting_bmi_class: classifyBMI(starting_bmi),
    target_bmi,
    titration_schedule: titration,
    summary: {
      product_name: product.name,
      starting_weight: weight_kg,
      target_weight: target_weight_kg,
      total_loss_kg: totalLossKg,
      total_loss_pct: totalLossPct,
      estimated_weeks: totalWeeks,
      estimated_months: `${months} months${remWeeks > 0 ? `, ${remWeeks} weeks` : ''}`,
      average_weekly_loss_kg: avgWeeklyLoss,
      first_dose_date: firstDate,
      last_dose_date: lastDate,
    },
  }
}
