// ── Types ──
export interface Biomarkers {
  morningSerumInsulin?: number; // µIU/mL
  hsCRP?: number;               // mg/L
  vitaminD?: number;            // ng/mL
  homocysteine?: number;        // µmol/L
}

export interface ForecastInput {
  height_cm: number;
  weight_kg: number;
  age: number;
  gender: 'Male' | 'Female';
  intensity: 'mild' | 'moderate' | 'aggressive';
  biomarkers?: Biomarkers;
}

export interface TitrationStep {
  startWeek: number;
  endWeek: number;
  dose_mg: number;
  productSku: string;
  productDosageMg: number;
  label: string;
}

export interface ForecastRow {
  week: number;
  date: string;
  brand: string;
  productSku: string;
  dose_mg: number;
  weight_kg: number;
  bmi: number;
  bmi_classification: string;
  cumulative_loss_kg: number;
  cumulative_loss_pct: number;
}

export interface ForecastSummary {
  product_name: string;
  product_slug: string;
  starting_weight: number;
  target_weight: number;
  total_loss_kg: number;
  total_loss_pct: number;
  estimated_weeks: number;
  estimated_months: string;
  average_weekly_loss_kg: number;
  first_dose_date: string;
  last_dose_date: string;
}

export interface ForecastResult {
  brand: string;
  brandName: string;
  product: ProductInfo;
  peptide: string;
  rows: ForecastRow[];
  total_weeks: number;
  titration_schedule: TitrationStep[];
  summary: ForecastSummary;
}

export interface ComparisonResult {
  atheryx: ForecastResult;
  elysion: ForecastResult;
  starting_bmi: number;
  starting_bmi_class: string;
  target_weight: number;
  target_bmi: number;
  biomarker_multiplier: number;
  has_biomarkers: boolean;
}

export interface ProductInfo {
  id: string;
  slug: string;
  brand: string;
  name: string;
  peptide: string;
  dosage_mg: number;
  per_dose_mg: number;
  price_myr: number;
  is_ezipen?: boolean;
  description: string;
  features: string[];
}

export interface IntensityOption {
  value: string;
  label: string;
  desc: string;
  rate: string;
  icon: string;
}

// ── Intensity Config ──
interface IntensityConfig {
  weeklyRateMin: number;
  weeklyRateMax: number;
  atheryxMaxDose: number;
  elysionMaxDose: number;
}

const INTENSITY_CONFIG: Record<string, IntensityConfig> = {
  mild:      { weeklyRateMin: 0.25, weeklyRateMax: 0.35, atheryxMaxDose: 4,  elysionMaxDose: 5 },
  moderate:  { weeklyRateMin: 0.40, weeklyRateMax: 0.55, atheryxMaxDose: 8,  elysionMaxDose: 10 },
  aggressive:{ weeklyRateMin: 0.60, weeklyRateMax: 0.70, atheryxMaxDose: 12, elysionMaxDose: 15 },
};

export const INTENSITY_OPTIONS: IntensityOption[] = [
  { value: 'mild',       label: 'Mild',       desc: 'Slow & steady — minimal side effects', rate: '0.25–0.35%', icon: '🐢' },
  { value: 'moderate',   label: 'Moderate',   desc: 'Balanced — standard clinical ramp',    rate: '0.40–0.55%', icon: '⚡' },
  { value: 'aggressive', label: 'Aggressive',  desc: 'Maximum speed — full dose titration',  rate: '0.60–0.70%', icon: '🚀' },
];

// ── Dose Tiers ──
const RETATRUTIDE_DOSES = [2, 4, 6, 8, 12];
const TIRZEPATIDE_DOSES = [2.5, 5, 7.5, 10, 12.5, 15];

// ── Dose → Weekly Rate Maps (% of body weight per week) ──
// Calibrated so max-dose produces ~22% (Tirz) / ~33% (Reta) annual loss
// with 4-weekly titration ramp + decay factor floor 0.3
const RETATRUTIDE_RATES: Record<number, number> = {
  2:  0.003,  // 0.30%/wk
  4:  0.004,  // 0.40%/wk
  6:  0.005,  // 0.50%/wk
  8:  0.006,  // 0.60%/wk
  12: 0.015,  // 1.50%/wk ← recalibrated for ~33% annual
};

const TIRZEPATIDE_RATES: Record<number, number> = {
  2.5:  0.0025, // 0.25%/wk
  5:    0.004,  // 0.40%/wk
  7.5:  0.005,  // 0.50%/wk
  10:   0.0055, // 0.55%/wk
  12.5: 0.006,  // 0.60%/wk
  15:   0.0122, // 1.22%/wk ← recalibrated for ~22% annual
};

// ── Helpers ──

/** Calculate target weight from height using BMI 22.5 (Asian mid-normal) */
export function calculateTargetWeight(heightCm: number): number {
  const meters = heightCm / 100;
  return Math.round(22.5 * meters * meters * 10) / 10;
}

/** Asian BMI classification */
export function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 23)   return 'Normal';
  if (bmi < 27.5) return 'Overweight';
  return 'Obese';
}

/** Biomarker multiplier — adjusts loss rate based on metabolic markers */
export function biomarkerMultiplier(biomarkers?: Biomarkers): number {
  if (!biomarkers) return 1;
  let multiplier = 1;
  if (biomarkers.morningSerumInsulin && biomarkers.morningSerumInsulin > 25) multiplier *= 1.10;
  if (biomarkers.hsCRP && biomarkers.hsCRP > 3)                      multiplier *= 0.92;
  if (biomarkers.vitaminD && biomarkers.vitaminD < 30)               multiplier *= 0.85;
  if (biomarkers.homocysteine && biomarkers.homocysteine > 15)       multiplier *= 0.90;
  return Math.round(multiplier * 1000) / 1000;
}

/** Look up weekly loss rate for a given product class and dose */
export function getWeeklyLossRate(peptide: string, doseMg: number): number {
  const map = peptide.toLowerCase().includes('tirzepatide') ? TIRZEPATIDE_RATES : RETATRUTRIDE_RATES;
  const doses = Object.keys(map).map(Number).sort((a, b) => a - b);
  let closest = doses[0];
  for (const d of doses) {
    if (Math.abs(d - doseMg) < Math.abs(closest - doseMg)) closest = d;
  }
  return map[closest] || 0.003;
}

/** Build titration schedule for a brand up to max dose */
export function buildTitrationSchedule(
  brand: 'atheryx' | 'elysion',
  maxDose: number,
  product: ProductInfo
): TitrationStep[] {
  const tiers = (brand === 'atheryx' ? RETATRUTRIDE_DOSES : TIRZEPATIDE_DOSES)
    .filter(d => d <= maxDose);

  if (tiers.length === 0) {
    return [{
      startWeek: 1, endWeek: 999, dose_mg: maxDose,
      productSku: product.slug, productDosageMg: product.dosage_mg,
      label: `${maxDose}mg/dose (${product.name})`,
    }];
  }

  const steps: TitrationStep[] = [];
  let week = 1;
  for (let i = 0; i < tiers.length; i++) {
    const dose = tiers[i];
    const isLast = i === tiers.length - 1;
    steps.push({
      startWeek: week,
      endWeek: isLast ? 999 : week + 3,
      dose_mg: dose,
      productSku: product.slug,
      productDosageMg: product.dosage_mg,
      label: `${dose}mg/dose${isLast ? ' (maintenance)' : ''} — ${product.name}`,
    });
    week += 4;
  }
  return steps;
}

/** Find the matching product SKU for a brand at a target dose */
export function findProduct(
  brand: 'atheryx' | 'elysion',
  targetDoseMg: number,
  products: ProductInfo[]
): ProductInfo | undefined {
  const brandProducts = products
    .filter(p => p.brand === brand)
    .sort((a, b) => a.per_dose_mg - b.per_dose_mg);
  return brandProducts.find(p => p.per_dose_mg >= targetDoseMg)
    || brandProducts[brandProducts.length - 1];
}

/** Generate the full forecast for one brand path */
export function generateForecast(
  brand: 'atheryx' | 'elysion',
  brandName: string,
  peptide: string,
  maxDose: number,
  product: ProductInfo,
  input: ForecastInput,
  targetWeight: number,
  biomarkerMult: number,
  startDate: Date
): ForecastResult {
  const titration = buildTitrationSchedule(brand, maxDose, product);
  const rows: ForecastRow[] = [];
  let currentWeight = input.weight_kg;
  const totalToLose = input.weight_kg - targetWeight;
  let week = 1;

  while (currentWeight > targetWeight && week <= 104) {
    // Find current dose from titration schedule
    let doseMg = maxDose;
    for (const step of titration) {
      if (week >= step.startWeek && week <= step.endWeek) {
        doseMg = step.dose_mg;
        break;
      }
    }

    const rate = getWeeklyLossRate(peptide, doseMg) / 100;
    const remaining = currentWeight - targetWeight;
    const decay = Math.max(0.3, remaining / totalToLose);
    const weeklyLoss = currentWeight * rate * decay * biomarkerMult;

    currentWeight = Math.max(targetWeight, Math.round((currentWeight - weeklyLoss) * 10) / 10);

    const bmi = currentWeight / ((input.height_cm / 100) ** 2);
    const cumulativeLoss = input.weight_kg - currentWeight;

    const date = new Date(startDate);
    date.setDate(date.getDate() + (week - 1) * 7);

    rows.push({
      week,
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      brand,
      productSku: product.slug,
      dose_mg: doseMg,
      weight_kg: currentWeight,
      bmi: Math.round(bmi * 10) / 10,
      bmi_classification: classifyBMI(bmi),
      cumulative_loss_kg: Math.round(cumulativeLoss * 10) / 10,
      cumulative_loss_pct: Math.round((cumulativeLoss / input.weight_kg) * 1000) / 10,
    });

    week++;
  }

  const lastRow = rows[rows.length - 1];
  const totalLossKg = Math.round((input.weight_kg - lastRow.weight_kg) * 10) / 10;
  const totalLossPct = Math.round((totalLossKg / input.weight_kg) * 1000) / 10;
  const totalWeeks = rows.length;
  const months = Math.floor(totalWeeks / 4);
  const extraWeeks = totalWeeks % 4;

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
      total_loss_kg: totalLossKg,
      total_loss_pct: totalLossPct,
      estimated_weeks: totalWeeks,
      estimated_months: `${months} months${extraWeeks > 0 ? `, ${extraWeeks} weeks` : ''}`,
      average_weekly_loss_kg: Math.round((totalLossKg / totalWeeks) * 100) / 100,
      first_dose_date: rows[0].date,
      last_dose_date: lastRow.date,
    },
  };
}

/** Full comparison: ATHERYX vs ELYSION */
export function compareForecast(
  input: ForecastInput,
  products: ProductInfo[]
): ComparisonResult {
  const targetWeight = calculateTargetWeight(input.height_cm);
  const heightM = input.height_cm / 100;
  const bmi = input.weight_kg / (heightM * heightM);
  const bioMult = biomarkerMultiplier(input.biomarkers);
  const intensity = INTENSITY_CONFIG[input.intensity];
  const startDate = new Date();

  const atheryxProduct = findProduct('atheryx', intensity.atheryxMaxDose, products);
  const elysionProduct = findProduct('elysion', intensity.elysionMaxDose, products);

  if (!atheryxProduct || !elysionProduct) {
    throw new Error('Could not find matching products for this intensity');
  }

  return {
    atheryx: generateForecast(
      'atheryx', 'ATHERYX™', atheryxProduct.peptide,
      intensity.atheryxMaxDose, atheryxProduct, input, targetWeight, bioMult, startDate
    ),
    elysion: generateForecast(
      'elysion', 'ELYSION™', elysionProduct.peptide,
      intensity.elysionMaxDose, elysionProduct, input, targetWeight, bioMult, startDate
    ),
    starting_bmi: Math.round(bmi * 10) / 10,
    starting_bmi_class: classifyBMI(bmi),
    target_weight: targetWeight,
    target_bmi: 22.5,
    biomarker_multiplier: bioMult,
    has_biomarkers: !!(input.biomarkers && Object.keys(input.biomarkers).length > 0),
  };
}
