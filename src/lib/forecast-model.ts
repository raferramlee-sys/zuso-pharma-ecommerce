import { products } from './products'
import type { Product } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface BiomarkerInput {
  morningSerumInsulin?: number
  hsCRP?: number
  vitaminD?: number
  homocysteine?: number
}

export type IntensityLevel = 'mild' | 'moderate' | 'aggressive'

export interface PatientInput {
  height_cm: number
  weight_kg: number
  age: number
  gender: 'male' | 'female'
  intensity: IntensityLevel
  biomarkers?: BiomarkerInput
}

export interface TitrationStep {
  startWeek: number
  endWeek: number
  dose_mg: number          // per-dose mg
  productSku: string       // product slug of the pen used
  productDosageMg: number  // total pen mg
  label: string
}

export interface ForecastRow {
  week: number
  date: string
  brand: 'atheryx' | 'elysion'
  productSku: string       // which pen to use
  dose_mg: number          // per-dose mg this week
  weight_kg: number
  bmi: number
  bmi_classification: string
  cumulative_loss_kg: number
  cumulative_loss_pct: number
}

export interface BrandPath {
  brand: 'atheryx' | 'elysion'
  brandName: string
  product: Product          // recommended product SKU
  peptide: string
  rows: ForecastRow[]
  total_weeks: number
  titration_schedule: TitrationStep[]
  summary: {
    product_name: string
    product_slug: string
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

export interface ForecastResult {
  atheryx: BrandPath
  elysion: BrandPath
  starting_bmi: number
  starting_bmi_class: string
  target_weight: number
  target_bmi: number
  biomarker_multiplier: number
  has_biomarkers: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function autoTargetWeight(height_cm: number): number {
  const height_m = height_cm / 100
  return Math.round(22.5 * height_m * height_m * 10) / 10
}

function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 23) return 'Normal'
  if (bmi < 27.5) return 'Overweight'
  return 'Obese'
}

export function calcBiomarkerMultiplier(bio?: BiomarkerInput): number {
  if (!bio) return 1.0
  let m = 1.0
  if (bio.morningSerumInsulin && bio.morningSerumInsulin > 25) m *= 1.1
  if (bio.hsCRP && bio.hsCRP > 3) m *= 0.92
  if (bio.vitaminD && bio.vitaminD < 30) m *= 0.85
  if (bio.homocysteine && bio.homocysteine > 15) m *= 0.90
  return Math.round(m * 1000) / 1000
}

// ── Intensity → Clinical Parameters ───────────────────────────────────────

interface IntensityConfig {
  weeklyRateMin: number
  weeklyRateMax: number
  atheryxMaxDose: number
  elysionMaxDose: number
}

const INTENSITY_MAP: Record<IntensityLevel, IntensityConfig> = {
  mild:       { weeklyRateMin: 0.25, weeklyRateMax: 0.35, atheryxMaxDose: 4,  elysionMaxDose: 5 },
  moderate:   { weeklyRateMin: 0.40, weeklyRateMax: 0.55, atheryxMaxDose: 8,  elysionMaxDose: 10 },
  aggressive: { weeklyRateMin: 0.60, weeklyRateMax: 0.70, atheryxMaxDose: 12, elysionMaxDose: 15 },
}

// Peptide titration steps: [dose_mg, ...]
const RETATRUTIDE_STEPS = [2, 4, 6, 8, 12]
const TIRZEPATIDE_STEPS = [2.5, 5, 7.5, 10, 12.5, 15]

// Clinical trial weekly weight loss rates (% of current body weight)
function getWeeklyLossRate(peptide: string, doseMg: number): number {
  // RATE TABLES: Clinical trial weekly weight loss rates (% of current body weight)
  // Max dose calibrated to ~22% (Tirz 15mg) / ~33% (Reta 12mg) annual loss
  const RETA_RATES: Record<number, number> = { 2: 0.30, 4: 0.40, 6: 0.50, 8: 0.60, 12: 1.50 }
  const TIRZ_RATES: Record<number, number> = { 2.5: 0.25, 5: 0.40, 7.5: 0.50, 10: 0.55, 12.5: 0.60, 15: 1.22 }
  const rates = peptide.toLowerCase().includes('tirzepatide') ? TIRZ_RATES : RETA_RATES
  const keys = Object.keys(rates).map(Number).sort((a, b) => a - b)
  let closest = keys[0]
  for (const k of keys) if (Math.abs(k - doseMg) < Math.abs(closest - doseMg)) closest = k
  return rates[closest] || 0.30
}

// Find the product that can deliver up to maxDose mg/dose (multi-click adjustable pen)
function findProductForDose(brand: 'atheryx' | 'elysion', maxDoseMg: number): Product | undefined {
  const brandProducts = products.filter(p => p.brand === brand)
  // Sort by per_dose_mg ascending — pick the smallest pen that can cover max dose
  const sorted = [...brandProducts].sort((a, b) => a.per_dose_mg - b.per_dose_mg)
  return sorted.find(p => p.per_dose_mg >= maxDoseMg) || sorted[sorted.length - 1]
}

// ── Build Titration Schedule ──────────────────────────────────────────────

function buildTitration(
  brand: 'atheryx' | 'elysion',
  maxDoseMg: number,
  product: Product,
): TitrationStep[] {
  const steps = brand === 'atheryx' ? RETATRUTIDE_STEPS : TIRZEPATIDE_STEPS
  // Filter steps up to max dose
  const active = steps.filter(d => d <= maxDoseMg)
  if (active.length === 0) {
    return [{
      startWeek: 1, endWeek: 999,
      dose_mg: maxDoseMg, productSku: product.slug, productDosageMg: product.dosage_mg,
      label: `${maxDoseMg}mg/dose (${product.name})`,
    }]
  }

  const schedule: TitrationStep[] = []
  let week = 1
  for (let i = 0; i < active.length; i++) {
    const dose = active[i]
    const isLast = i === active.length - 1
    schedule.push({
      startWeek: week,
      endWeek: isLast ? 999 : week + 3,
      dose_mg: dose,
      productSku: product.slug,
      productDosageMg: product.dosage_mg,
      label: `${dose}mg/dose${isLast ? ' (maintenance)' : ''} — ${product.name}`,
    })
    week += 4
  }
  return schedule
}

// ── Build one brand's forecast ────────────────────────────────────────────

function buildBrandPath(
  brand: 'atheryx' | 'elysion',
  brandName: string,
  peptide: string,
  maxDoseMg: number,
  product: Product,
  input: PatientInput,
  targetWeight: number,
  biomarkerMult: number,
  startDate: Date,
): BrandPath {
  const titration = buildTitration(brand, maxDoseMg, product)
  const rows: ForecastRow[] = []
  let currentWeight = input.weight_kg
  let week = 1
  const maxWeeks = 104

  while (currentWeight > targetWeight && week <= maxWeeks) {
    let currentDose = maxDoseMg
    for (const step of titration) {
      if (week >= step.startWeek && week <= step.endWeek) { currentDose = step.dose_mg; break }
    }

    const baseRate = getWeeklyLossRate(peptide, currentDose) / 100
    const proximity = (currentWeight - targetWeight) / (input.weight_kg - targetWeight)
    const effectiveRate = baseRate * biomarkerMult * Math.max(0.3, proximity)
    const weeklyLoss = currentWeight * effectiveRate
    currentWeight = Math.max(targetWeight, Math.round((currentWeight - weeklyLoss) * 10) / 10)

    const bmi = currentWeight / ((input.height_cm / 100) ** 2)
    const cumLoss = input.weight_kg - currentWeight
    const rowDate = new Date(startDate)
    rowDate.setDate(rowDate.getDate() + (week - 1) * 7)

    rows.push({
      week,
      date: rowDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      brand,
      productSku: product.slug,
      dose_mg: currentDose,
      weight_kg: currentWeight,
      bmi: Math.round(bmi * 10) / 10,
      bmi_classification: classifyBMI(bmi),
      cumulative_loss_kg: Math.round(cumLoss * 10) / 10,
      cumulative_loss_pct: Math.round((cumLoss / input.weight_kg) * 1000) / 10,
    })
    week++
  }

  const totalWeeks = rows.length
  const lastRow = rows[totalWeeks - 1]
  const totalLoss = Math.round((input.weight_kg - lastRow.weight_kg) * 10) / 10
  const totalLossPct = Math.round((totalLoss / input.weight_kg) * 1000) / 10
  const months = Math.floor(totalWeeks / 4)
  const remWeeks = totalWeeks % 4

  return {
    brand,
    brandName,
    product,
    peptide,
    rows,
    total_weeks: totalWeeks,
    titration_schedule: titration,
    summary: {
      product_name: product.name,
      product_slug: product.slug,
      starting_weight: input.weight_kg,
      target_weight: targetWeight,
      total_loss_kg: totalLoss,
      total_loss_pct: totalLossPct,
      estimated_weeks: totalWeeks,
      estimated_months: `${months} months${remWeeks > 0 ? `, ${remWeeks} weeks` : ''}`,
      average_weekly_loss_kg: Math.round((totalLoss / totalWeeks) * 100) / 100,
      first_dose_date: rows[0].date,
      last_dose_date: lastRow.date,
    },
  }
}

// ── Main calculator ───────────────────────────────────────────────────────

export function calculateForecast(input: PatientInput): ForecastResult {
  const targetWeight = autoTargetWeight(input.height_cm)
  const heightM = input.height_cm / 100
  const startingBmi = input.weight_kg / (heightM * heightM)
  const biomarkerMult = calcBiomarkerMultiplier(input.biomarkers)
  const config = INTENSITY_MAP[input.intensity]
  const startDate = new Date()

  // Find best products for each brand at this intensity
  const athProduct = findProductForDose('atheryx', config.atheryxMaxDose)
  const elyProduct = findProductForDose('elysion', config.elysionMaxDose)

  if (!athProduct || !elyProduct) {
    throw new Error('Could not find matching products for this intensity')
  }

  const atheryx = buildBrandPath(
    'atheryx', 'ATHERYX™', athProduct.peptide,
    config.atheryxMaxDose, athProduct, input, targetWeight, biomarkerMult, startDate,
  )

  const elysion = buildBrandPath(
    'elysion', 'ELYSION™', elyProduct.peptide,
    config.elysionMaxDose, elyProduct, input, targetWeight, biomarkerMult, startDate,
  )

  return {
    atheryx,
    elysion,
    starting_bmi: Math.round(startingBmi * 10) / 10,
    starting_bmi_class: classifyBMI(startingBmi),
    target_weight: targetWeight,
    target_bmi: Math.round(22.5 * 10) / 10,
    biomarker_multiplier: biomarkerMult,
    has_biomarkers: !!input.biomarkers && Object.keys(input.biomarkers).length > 0,
  }
}
