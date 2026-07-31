/**
 * useSellerDiscount — shared discount state via React Context
 *
 * URL param ?code=XYZ takes priority, localStorage is fallback.
 * On apply: validates against Supabase, stores both, updates URL.
 * On remove: clears both, removes URL param.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { lookupSellerCode } from '../lib/api'
import type { Seller } from '../types'

const STORAGE_KEY = 'pharma_seller_discount'

interface DiscountState {
  sellerCode: string | null
  discountPct: number
  sellerName: string | null
  isActive: boolean
  isLoading: boolean
  applyCode: (code: string) => Promise<{ success: boolean; error?: string }>
  removeCode: () => void
}

const DiscountContext = createContext<DiscountState>({
  sellerCode: null,
  discountPct: 0,
  sellerName: null,
  isActive: false,
  isLoading: false,
  applyCode: async () => ({ success: false }),
  removeCode: () => {},
})

function getStoredCode(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { code: string; discountPct: number; expiresAt: string }
    // 30-day expiry
    if (new Date(data.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data.code
  } catch {
    return null
  }
}

function storeCode(code: string, discountPct: number) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, discountPct, expiresAt }))
}

function clearStoredCode() {
  localStorage.removeItem(STORAGE_KEY)
}

function getCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('code')?.toUpperCase().trim() || null
}

function updateURL(code: string | null) {
  const url = new URL(window.location.href)
  if (code) {
    url.searchParams.set('code', code)
  } else {
    url.searchParams.delete('code')
  }
  window.history.replaceState({}, '', url.toString())
}

export function SellerDiscountProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<Seller | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // ── Initialize from URL or localStorage ──────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      const urlCode = getCodeFromURL()
      const storedCode = getStoredCode()
      const codeToTry = urlCode || storedCode

      if (codeToTry) {
        setIsLoading(true)
        try {
          const s = await lookupSellerCode(codeToTry)
          if (!cancelled) {
            if (s) {
              setSeller(s)
              storeCode(codeToTry, s.discount_pct)
              if (!urlCode) updateURL(codeToTry)
            } else {
              clearStoredCode()
              if (urlCode) updateURL(null)
            }
          }
        } catch {
          // Network error — keep stored code
        } finally {
          if (!cancelled) {
            setIsLoading(false)
            setInitialized(true)
          }
        }
      } else {
        setInitialized(true)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // ── Apply code ────────────────────────────────────────
  const applyCode = useCallback(async (code: string) => {
    const cleanCode = code.toUpperCase().trim()
    if (!cleanCode) return { success: false, error: 'Please enter a code' }

    setIsLoading(true)
    try {
      const s = await lookupSellerCode(cleanCode)
      if (!s) {
        setIsLoading(false)
        return { success: false, error: 'Invalid seller code' }
      }

      setSeller(s)
      storeCode(cleanCode, s.discount_pct)
      updateURL(cleanCode)
      setIsLoading(false)
      return { success: true }
    } catch {
      setIsLoading(false)
      return { success: false, error: 'Network error — try again' }
    }
  }, [])

  // ── Remove code ───────────────────────────────────────
  const removeCode = useCallback(() => {
    setSeller(null)
    clearStoredCode()
    updateURL(null)
  }, [])

  const value: DiscountState = {
    sellerCode: seller?.seller_code || null,
    discountPct: seller?.discount_pct || 0,
    sellerName: seller?.email?.split('@')[0] || null,
    isActive: !!seller,
    isLoading: isLoading || !initialized,
    applyCode,
    removeCode,
  }

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  )
}

export function useSellerDiscount() {
  return useContext(DiscountContext)
}

/**
 * Calculate discounted price
 */
export function getDiscountedPrice(originalPrice: number, discountPct: number): number {
  if (!discountPct) return originalPrice
  return Math.round(originalPrice * (1 - discountPct / 100))
}
