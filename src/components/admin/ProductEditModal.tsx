import { useState, useEffect } from 'react'
import type { Product } from '../../types'

interface ProductEditModalProps {
  mode: 'create' | 'edit'
  product?: Product
  onSave: (data: Partial<Product>) => Promise<void>
  onClose: () => void
}

const BRANDS = ['atheryx', 'elysion'] as const

export default function ProductEditModal({ mode, product, onSave, onClose }: ProductEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    brand: product?.brand || ('atheryx' as string),
    name: product?.name || '',
    display_name: product?.display_name || '',
    peptide: product?.peptide || '',
    dosage_mg: product?.dosage_mg?.toString() || '',
    price_myr: product?.price_myr?.toString() || '',
    stock: product?.stock?.toString() || '',
    active: product?.active ?? true,
    is_ezipen: product?.is_ezipen ?? false,
    description: product?.description || '',
    features: product?.features?.join('\n') || '',
    images: product?.images?.join('\n') || '',
    lot: product?.lot || '',
    exp: product?.exp || '',
    mal_number: product?.mal_number || '',
    fda_approved: product?.fda_approved ?? true,
    doses_per_pen: product?.doses_per_pen?.toString() || '',
    per_dose_mg: product?.per_dose_mg?.toString() || '',
    volume_ml: product?.volume_ml || '',
  })

  const update = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setError(null)

    // Validate required
    if (!form.brand || !form.name || !form.peptide || !form.dosage_mg || !form.price_myr) {
      setError('Brand, Name, Peptide, Dosage, and Price are required.')
      return
    }

    setSaving(true)
    try {
      const data: Partial<Product> = {
        brand: form.brand as 'atheryx' | 'elysion',
        name: form.name,
        peptide: form.peptide,
        dosage_mg: Number(form.dosage_mg),
        price_myr: Number(form.price_myr),
        stock: form.stock ? Number(form.stock) : 0,
        active: form.active,
        is_ezipen: form.is_ezipen,
        description: form.description || undefined,
        features: form.features
          ? form.features.split('\n').map(f => f.trim()).filter(Boolean)
          : [],
        images: form.images
          ? form.images.split('\n').map(u => u.trim()).filter(Boolean)
          : [],
        lot: form.lot || undefined,
        exp: form.exp || undefined,
        mal_number: form.mal_number || undefined,
        fda_approved: form.fda_approved,
        doses_per_pen: form.doses_per_pen ? Number(form.doses_per_pen) : undefined,
        per_dose_mg: form.per_dose_mg ? Number(form.per_dose_mg) : undefined,
        volume_ml: form.volume_ml || undefined,
      }

      if (form.display_name) {
        data.display_name = form.display_name
      }

      await onSave(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to save product')
    }
    setSaving(false)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const inputClass = 'bg-pharma-900 border border-pharma-700 rounded-btn px-3 py-2 text-white placeholder:text-pharma-500 focus:border-accent-500 focus:outline-none w-full'
  const labelClass = 'block text-sm font-medium text-pharma-300 mb-1'
  const checkboxClass = 'w-4 h-4 rounded border-pharma-600 bg-pharma-900 text-accent-500 focus:ring-accent-500 focus:ring-offset-0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card bg-pharma-850 border border-pharma-700/50 shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(20,20,40,0.98), rgba(16,16,32,0.98))',
          borderColor: 'rgba(124,58,237,0.2)',
          boxShadow: '0 0 40px rgba(124,58,237,0.08), 0 0 80px rgba(124,58,237,0.04)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-pharma-700/50 bg-pharma-850/95 backdrop-blur-sm rounded-t-card">
          <h2 className="text-lg font-bold text-white">
            {mode === 'create' ? 'Add Product' : 'Edit Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-pharma-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-btn px-3 py-2">
              {error}
            </div>
          )}

          {/* Row: Brand + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Brand</label>
              <select
                value={form.brand}
                onChange={e => update('brand', e.target.value)}
                className={inputClass}
              >
                {BRANDS.map(b => (
                  <option key={b} value={b}>
                    {b === 'atheryx' ? 'ATHERYX™' : 'ELYSION™'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. ATHERYX™ Retatrutide"
              />
            </div>
          </div>

          {/* Row: Display Name */}
          <div>
            <label className={labelClass}>Display Name (optional, for Ezipen)</label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => update('display_name', e.target.value)}
              className={inputClass}
              placeholder="e.g. ELYSION 12.5MG GENERIC TIRZEPATIDE EZIPEN"
            />
          </div>

          {/* Row: Peptide + Dosage + Price */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Peptide</label>
              <input
                type="text"
                value={form.peptide}
                onChange={e => update('peptide', e.target.value)}
                className={inputClass}
                placeholder="e.g. Retatrutide Injection"
              />
            </div>
            <div>
              <label className={labelClass}>Dosage (mg)</label>
              <input
                type="number"
                value={form.dosage_mg}
                onChange={e => update('dosage_mg', e.target.value)}
                className={inputClass}
                placeholder="10"
                step="0.1"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Price (RM)</label>
              <input
                type="number"
                value={form.price_myr}
                onChange={e => update('price_myr', e.target.value)}
                className={inputClass}
                placeholder="778"
                step="1"
                min="0"
              />
            </div>
          </div>

          {/* Row: Stock + Doses per pen + Per dose mg + Volume */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => update('stock', e.target.value)}
                className={inputClass}
                placeholder="100"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Doses/Pen</label>
              <input
                type="number"
                value={form.doses_per_pen}
                onChange={e => update('doses_per_pen', e.target.value)}
                className={inputClass}
                placeholder="5"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Per Dose (mg)</label>
              <input
                type="number"
                value={form.per_dose_mg}
                onChange={e => update('per_dose_mg', e.target.value)}
                className={inputClass}
                placeholder="2"
                step="0.1"
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>Volume</label>
              <input
                type="text"
                value={form.volume_ml}
                onChange={e => update('volume_ml', e.target.value)}
                className={inputClass}
                placeholder="0.6 mL"
              />
            </div>
          </div>

          {/* Toggles: Active + Ezipen + FDA */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => update('active', e.target.checked)}
                className={checkboxClass}
              />
              <span className="text-sm text-pharma-300">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_ezipen}
                onChange={e => update('is_ezipen', e.target.checked)}
                className={checkboxClass}
              />
              <span className="text-sm text-pharma-300">Ezipen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.fda_approved}
                onChange={e => update('fda_approved', e.target.checked)}
                className={checkboxClass}
              />
              <span className="text-sm text-pharma-300">FDA Approved</span>
            </label>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className={`${inputClass} h-20 resize-y`}
              placeholder="Product description..."
            />
          </div>

          {/* Features */}
          <div>
            <label className={labelClass}>Features (one per line)</label>
            <textarea
              value={form.features}
              onChange={e => update('features', e.target.value)}
              className={`${inputClass} h-24 resize-y font-mono text-xs`}
              placeholder="Triple-agonist mechanism&#10;FDA Approved&#10;Sterile A — Rx Only"
            />
          </div>

          {/* Images */}
          <div>
            <label className={labelClass}>Images (one URL per line)</label>
            <textarea
              value={form.images}
              onChange={e => update('images', e.target.value)}
              className={`${inputClass} h-20 resize-y font-mono text-xs`}
              placeholder="/atheryx-packaging.jpg&#10;https://..."
            />
          </div>

          {/* Row: LOT + EXP + MAL */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>LOT</label>
              <input
                type="text"
                value={form.lot}
                onChange={e => update('lot', e.target.value)}
                className={inputClass}
                placeholder="ATH250701"
              />
            </div>
            <div>
              <label className={labelClass}>EXP</label>
              <input
                type="text"
                value={form.exp}
                onChange={e => update('exp', e.target.value)}
                className={inputClass}
                placeholder="2028-07"
              />
            </div>
            <div>
              <label className={labelClass}>MAL Number</label>
              <input
                type="text"
                value={form.mal_number}
                onChange={e => update('mal_number', e.target.value)}
                className={inputClass}
                placeholder="MAL23056078XZ"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-pharma-700/50 bg-pharma-850/95 backdrop-blur-sm rounded-b-card">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-btn border border-pharma-600 text-pharma-300 hover:text-white hover:border-pharma-400 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-btn bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
