import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (!cancelled) {
        setProducts((data || []) as Product[])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { products, loading }
}
