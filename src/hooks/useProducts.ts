import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

/**
 * Custom sort: ATHERYX first, then ELYSION.
 * Within each brand: regular pens first (by ascending dosage), then ezipens (by ascending dosage).
 */
function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // Brand priority: atheryx first
    if (a.brand !== b.brand) return a.brand === 'atheryx' ? -1 : 1
    // Within same brand: regular pens before ezipens
    if (!!a.is_ezipen !== !!b.is_ezipen) return a.is_ezipen ? 1 : -1
    // Then by dosage ascending
    return (a.dosage_mg || 0) - (b.dosage_mg || 0)
  })
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)

      if (!cancelled) {
        setProducts(sortProducts((data || []) as Product[]))
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { products }
}
