/**
 * useCart — shared cart state via React Context
 *
 * All components (ProductCard, CartDrawer, CartPage, CheckoutPage)
 * share the same cart state. addItem auto-opens drawer for all.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'

const CART_KEY = 'pharma_cart'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addedProductId: string | null
}

const CartContext = createContext<CartState | null>(null)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [isOpen, setIsOpen] = useState(false)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(items)) }, [items])

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

    // Flash feedback + auto-open drawer
    setAddedProductId(product.id)
    setTimeout(() => setAddedProductId(null), 800)
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId))
      return
    }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price_myr * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal, isOpen, setIsOpen, addedProductId }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
