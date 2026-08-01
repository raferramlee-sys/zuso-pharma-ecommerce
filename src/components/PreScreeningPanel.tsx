/**
 * PreScreeningPanel — 3-stage WhatsApp pre-qualification sidebar
 *
 * Slides in from the right. Default BM, EN toggle.
 * Saves to Supabase + sends formatted answers to WhatsApp.
 */
import { useState, useCallback } from 'react'
import { submitPreScreening, type PreScreeningData } from '../lib/api'
import { useSellerDiscount } from '../hooks/useSellerDiscount'

type Lang = 'bm' | 'en'

const T = {
  bm: {
    skip: 'Skip → WhatsApp',
    progress: (s: number) => `Langkah ${s} / 3`,
    next: 'Seterusnya →',
    back: '← Kembali',
    send: 'Hantar ke WhatsApp →',
    sending: 'Menyimpan...',
    // Stage 1
    s1Title: 'Maklumat Peribadi',
    age: 'Umur',
    agePlaceholder: 'cth. 35',
    height: 'Tinggi (cm)',
    heightPlaceholder: 'cth. 168',
    weight: 'Berat (kg)',
    weightPlaceholder: 'cth. 85',
    // Stage 2
    s2Title: 'Maklumat Kesihatan',
    email: 'Emel',
    emailPlaceholder: 'cth. nama@gmail.com',
    coMorbids: 'Penyakit sedia ada (pilih yang berkaitan)',
    coOther: 'Lain-lain (nyatakan)',
    coOtherPlaceholder: 'Tulis di sini...',
    thyroid: 'Sejarah keluarga masalah tiroid?',
    yes: 'Ya',
    no: 'Tidak',
    // Stage 3
    s3Title: 'Gaya Hidup & Hantar',
    stepsTitle: 'Anggaran langkah sehari',
    stepsDesk: 'Kerja pejabat — banyak duduk (~2,000)',
    stepsLight: 'Aktiviti ringan — jalan sikit (~5,000)',
    stepsModerate: 'Sederhana — kerap berdiri (~8,000)',
    stepsActive: 'Aktif — selalu bersenam (~12,000+)',
    stepsCustom: 'Saya tahu jumlah langkah saya',
    stepsPlaceholder: 'Masukkan jumlah langkah',
    reviewTitle: 'Ringkasan Jawapan',
    reviewAge: 'Umur',
    reviewHeight: 'Tinggi',
    reviewWeight: 'Berat',
    reviewEmail: 'Emel',
    reviewCoMorbids: 'Penyakit sedia ada',
    reviewThyroid: 'Sejarah tiroid keluarga',
    reviewSteps: 'Langkah sehari',
    reviewNone: 'Tiada',
    waIntro: 'Hi Zuso Pharma, saya dah isi borang pre-screening untuk peptide weight loss.',
  },
  en: {
    skip: 'Skip → WhatsApp',
    progress: (s: number) => `Step ${s} / 3`,
    next: 'Next →',
    back: '← Back',
    send: 'Send to WhatsApp →',
    sending: 'Saving...',
    s1Title: 'Personal Info',
    age: 'Age',
    agePlaceholder: 'e.g. 35',
    height: 'Height (cm)',
    heightPlaceholder: 'e.g. 168',
    weight: 'Weight (kg)',
    weightPlaceholder: 'e.g. 85',
    s2Title: 'Health Info',
    email: 'Email',
    emailPlaceholder: 'e.g. name@gmail.com',
    coMorbids: 'Existing conditions (select all that apply)',
    coOther: 'Other (specify)',
    coOtherPlaceholder: 'Type here...',
    thyroid: 'Family history of thyroid issues?',
    yes: 'Yes',
    no: 'No',
    s3Title: 'Lifestyle & Send',
    stepsTitle: 'Estimated steps per day',
    stepsDesk: 'Desk job — mostly sitting (~2,000)',
    stepsLight: 'Light activity — some walking (~5,000)',
    stepsModerate: 'Moderate — on feet often (~8,000)',
    stepsActive: 'Active — exercise regularly (~12,000+)',
    stepsCustom: 'I know my step count',
    stepsPlaceholder: 'Enter step count',
    reviewTitle: 'Summary',
    reviewAge: 'Age',
    reviewHeight: 'Height',
    reviewWeight: 'Weight',
    reviewEmail: 'Email',
    reviewCoMorbids: 'Existing conditions',
    reviewThyroid: 'Family thyroid history',
    reviewSteps: 'Steps per day',
    reviewNone: 'None',
    waIntro: 'Hi Zuso Pharma, I completed the pre-screening form for peptide weight loss.',
  },
} as const

const CO_MORBID_OPTIONS = [
  { key: 'diabetes', bm: 'Diabetes', en: 'Diabetes' },
  { key: 'hypertension', bm: 'Darah Tinggi', en: 'Hypertension' },
  { key: 'heart_disease', bm: 'Sakit Jantung', en: 'Heart Disease' },
  { key: 'sleep_apnea', bm: 'Sleep Apnea', en: 'Sleep Apnea' },
  { key: 'pcos', bm: 'PCOS', en: 'PCOS' },
] as const

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function PreScreeningPanel({ isOpen, onClose }: Props) {
  const [lang, setLang] = useState<Lang>('bm')
  const [stage, setStage] = useState(1)
  const [sending, setSending] = useState(false)
  const { sellerCode } = useSellerDiscount()

  // Form state
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [email, setEmail] = useState('')
  const [coMorbids, setCoMorbids] = useState<string[]>([])
  const [coOther, setCoOther] = useState('')
  const [thyroid, setThyroid] = useState<boolean | null>(null)
  const [stepsPreset, setStepsPreset] = useState<string>('')
  const [stepsCustom, setStepsCustom] = useState('')

  const t = T[lang]

  const getStepsValue = (): number | undefined => {
    if (stepsPreset === 'custom') {
      const v = parseInt(stepsCustom)
      return isNaN(v) ? undefined : v
    }
    if (!stepsPreset) return undefined
    return parseInt(stepsPreset)
  }

  const buildWaMessage = useCallback((): string => {
    const lines: string[] = [t.waIntro, '']
    if (age) lines.push(`- ${t.reviewAge}: ${age}`)
    if (height) lines.push(`- ${t.reviewHeight}: ${height}cm`)
    if (weight) lines.push(`- ${t.reviewWeight}: ${weight}kg`)
    if (email) lines.push(`- ${t.reviewEmail}: ${email}`)
    if (coMorbids.length > 0) {
      const labels = coMorbids.map(k => {
        const opt = CO_MORBID_OPTIONS.find(o => o.key === k)
        return opt ? opt[lang] : k
      })
      lines.push(`- ${t.reviewCoMorbids}: ${labels.join(', ')}${coOther ? ` + ${coOther}` : ''}`)
    } else if (coOther) {
      lines.push(`- ${t.reviewCoMorbids}: ${coOther}`)
    }
    if (thyroid !== null) lines.push(`- ${t.reviewThyroid}: ${thyroid ? t.yes : t.no}`)
    const steps = getStepsValue()
    if (steps !== undefined) lines.push(`- ${t.reviewSteps}: ~${steps.toLocaleString()}`)

    return lines.join('\n')
  }, [age, height, weight, email, coMorbids, coOther, thyroid, stepsPreset, stepsCustom, t, lang])

  const openWa = (message: string) => {
    const waLink = `https://wa.me/60179094510?text=${encodeURIComponent(message)}`
    window.open(waLink, '_blank', 'noopener,noreferrer')
  }

  const handleSkip = () => {
    const msg = lang === 'bm'
      ? 'Hi Zuso Pharma, saya nak tanya pasal peptide untuk weight loss.'
      : 'Hi Zuso Pharma, I want to ask about peptide for weight loss.'
    openWa(msg)
    onClose()
  }

  const handleSubmit = async () => {
    setSending(true)
    const data: PreScreeningData = {
      age: age ? parseInt(age) : undefined,
      height_cm: height ? parseFloat(height) : undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
      email: email || undefined,
      co_morbids: coMorbids.length > 0 ? coMorbids : undefined,
      co_morbids_other: coOther || undefined,
      family_thyroid: thyroid ?? undefined,
      steps_per_day: getStepsValue(),
      seller_code: sellerCode || undefined,
    }

    // Fire-and-forget — don't block on DB
    submitPreScreening(data).catch(() => {})

    // Open WhatsApp
    openWa(buildWaMessage())

    // Small delay so user sees the sending state
    setTimeout(() => {
      setSending(false)
      onClose()
      // Reset form
      setStage(1)
      setAge(''); setHeight(''); setWeight('')
      setEmail(''); setCoMorbids([]); setCoOther(''); setThyroid(null)
      setStepsPreset(''); setStepsCustom('')
    }, 600)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-pharma-950 border-l border-pharma-700/50 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pharma-800/50">
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'bm' ? 'en' : 'bm')}
            className="text-xs font-bold px-2.5 py-1 rounded border border-pharma-600 text-pharma-400 hover:text-accent-400 hover:border-accent-500/50 transition-colors"
          >
            {lang === 'bm' ? 'EN' : 'BM'}
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  s === stage ? 'bg-accent-500' : s < stage ? 'bg-green-500/60' : 'bg-pharma-600'
                }`}
              />
            ))}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-pharma-800 hover:bg-pharma-700 text-pharma-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Skip link */}
        <div className="px-5 pt-3 pb-1">
          <button
            onClick={handleSkip}
            className="text-xs text-pharma-400 hover:text-accent-400 transition-colors underline underline-offset-2"
          >
            {t.skip}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ─── STAGE 1: Personal Info ─── */}
          {stage === 1 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white">{t.s1Title}</h3>

              <div>
                <label className="block text-sm text-pharma-300 mb-1.5">{t.age}</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder={t.agePlaceholder}
                  className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-600 focus:border-accent-500 focus:outline-none text-sm"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm text-pharma-300 mb-1.5">{t.height}</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder={t.heightPlaceholder}
                  className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-600 focus:border-accent-500 focus:outline-none text-sm"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="block text-sm text-pharma-300 mb-1.5">{t.weight}</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder={t.weightPlaceholder}
                  className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-600 focus:border-accent-500 focus:outline-none text-sm"
                  inputMode="decimal"
                />
              </div>
            </div>
          )}

          {/* ─── STAGE 2: Health Info ─── */}
          {stage === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white">{t.s2Title}</h3>

              <div>
                <label className="block text-sm text-pharma-300 mb-1.5">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-600 focus:border-accent-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-pharma-300 mb-2">{t.coMorbids}</label>
                <div className="space-y-2">
                  {CO_MORBID_OPTIONS.map(opt => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-btn bg-pharma-900/50 border border-pharma-700/50 cursor-pointer hover:border-pharma-600/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={coMorbids.includes(opt.key)}
                        onChange={() => {
                          setCoMorbids(prev =>
                            prev.includes(opt.key)
                              ? prev.filter(k => k !== opt.key)
                              : [...prev, opt.key]
                          )
                        }}
                        className="accent-accent-500 w-4 h-4"
                      />
                      <span className="text-sm text-white">{opt[lang]}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={coOther}
                  onChange={e => setCoOther(e.target.value)}
                  placeholder={t.coOtherPlaceholder}
                  className="w-full mt-2 bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-600 focus:border-accent-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-pharma-300 mb-2">{t.thyroid}</label>
                <div className="flex gap-3">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setThyroid(val)}
                      className={`flex-1 py-2.5 rounded-btn border text-sm font-medium transition-colors ${
                        thyroid === val
                          ? 'bg-accent-500/20 border-accent-500 text-accent-400'
                          : 'bg-pharma-900/50 border-pharma-700/50 text-pharma-300 hover:border-pharma-600/50'
                      }`}
                    >
                      {val ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STAGE 3: Lifestyle + Review ─── */}
          {stage === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">{t.s3Title}</h3>

              {/* Steps estimation */}
              <div>
                <label className="block text-sm text-pharma-300 mb-2">{t.stepsTitle}</label>
                <div className="space-y-2">
                  {[
                    { key: '2000', bm: t.stepsDesk, en: t.stepsDesk },
                    { key: '5000', bm: t.stepsLight, en: t.stepsLight },
                    { key: '8000', bm: t.stepsModerate, en: t.stepsModerate },
                    { key: '12000', bm: t.stepsActive, en: t.stepsActive },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setStepsPreset(opt.key); setStepsCustom('') }}
                      className={`w-full text-left px-4 py-3 rounded-btn border text-sm transition-colors ${
                        stepsPreset === opt.key
                          ? 'bg-accent-500/20 border-accent-500 text-accent-400'
                          : 'bg-pharma-900/50 border-pharma-700/50 text-pharma-300 hover:border-pharma-600/50'
                      }`}
                    >
                      {opt[lang]}
                    </button>
                  ))}
                  <label
                    className={`flex items-center gap-3 px-4 py-3 rounded-btn border cursor-pointer transition-colors ${
                      stepsPreset === 'custom'
                        ? 'bg-accent-500/20 border-accent-500 text-accent-400'
                        : 'bg-pharma-900/50 border-pharma-700/50 text-pharma-300 hover:border-pharma-600/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="steps"
                      checked={stepsPreset === 'custom'}
                      onChange={() => setStepsPreset('custom')}
                      className="accent-accent-500"
                    />
                    <span className="text-sm">{t.stepsCustom}</span>
                  </label>
                  {stepsPreset === 'custom' && (
                    <input
                      type="number"
                      value={stepsCustom}
                      onChange={e => setStepsCustom(e.target.value)}
                      placeholder={t.stepsPlaceholder}
                      className="w-full bg-pharma-900 border border-pharma-700 rounded-btn px-4 py-3 text-white placeholder:text-pharma-600 focus:border-accent-500 focus:outline-none text-sm"
                      inputMode="numeric"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Review summary */}
              <div className="bg-pharma-900/50 border border-pharma-700/50 rounded-card p-4">
                <h4 className="text-sm font-semibold text-accent-400 mb-3">{t.reviewTitle}</h4>
                <div className="space-y-1.5 text-sm">
                  {age && <ReviewRow label={t.reviewAge} value={age} />}
                  {height && <ReviewRow label={t.reviewHeight} value={`${height}cm`} />}
                  {weight && <ReviewRow label={t.reviewWeight} value={`${weight}kg`} />}
                  {email && <ReviewRow label={t.reviewEmail} value={email} />}
                  {coMorbids.length > 0 && (
                    <ReviewRow
                      label={t.reviewCoMorbids}
                      value={coMorbids.map(k => {
                        const opt = CO_MORBID_OPTIONS.find(o => o.key === k)
                        return opt ? opt[lang] : k
                      }).join(', ') + (coOther ? ` + ${coOther}` : '')}
                    />
                  )}
                  {coMorbids.length === 0 && coOther && (
                    <ReviewRow label={t.reviewCoMorbids} value={coOther} />
                  )}
                  {thyroid !== null && (
                    <ReviewRow label={t.reviewThyroid} value={thyroid ? t.yes : t.no} />
                  )}
                  {getStepsValue() !== undefined && (
                    <ReviewRow label={t.reviewSteps} value={`~${getStepsValue()!.toLocaleString()}`} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-pharma-800/50 flex gap-3">
          {stage > 1 && (
            <button
              onClick={() => setStage(s => s - 1)}
              className="px-4 py-3 rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors text-sm"
            >
              {t.back}
            </button>
          )}

          {stage < 3 ? (
            <button
              onClick={() => setStage(s => s + 1)}
              className="flex-1 py-3 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-colors text-sm"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="flex-1 py-3 rounded-btn bg-green-600 hover:bg-green-500 disabled:bg-pharma-700 disabled:text-pharma-500 text-white font-semibold transition-colors text-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {t.send}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Animation style */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

/** Small review row for summary */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-pharma-400">{label}</span>
      <span className="text-white font-medium text-right ml-4">{value}</span>
    </div>
  )
}
