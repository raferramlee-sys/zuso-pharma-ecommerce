import { useState, useEffect, useCallback } from 'react'
import type { CartItem, Product } from '../types'

const CART_KEY = 'pharma_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [isOpen, setIsOpen] = useState(false)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)

  useEffect(() => { saveCart(items) }, [items])

  const addItem = useCallback((product: Product, qty: number = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, {
        productId: product.id,
        slug: product.slug,
        brand: product.brand,
        name: product.name,
        peptide: product.peptide,
        dosage_mg: product.dosage_mg,
        price_myr: product.price_myr,
        quantity: qty,
      }]
    })

    // Visual feedback — flash + auto-open drawer
    setAddedProductId(product.id)
    setTimeout(() => setAddedProductId(null), 800)
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price_myr * i.quantity, 0)

  return { items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal, isOpen, setIsOpen, addedProductId }
}
