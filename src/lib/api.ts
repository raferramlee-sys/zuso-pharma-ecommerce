/**
 * API helpers for orders, sellers, and email notifications
 */
import { supabase } from './supabase'
import type { PharmaOrder, Seller, CartItem, OrderStatus } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Submit a new order
 */
export async function submitOrder(params: {
  seller_code: string
  patient_name: string
  patient_email: string
  patient_phone: string
  patient_address: string
  items: CartItem[]
  subtotal_myr: number
  discount_pct: number
  discount_myr: number
  total_myr: number
  commission_pct: number
  commission_myr: number
}): Promise<PharmaOrder | { error: string }> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      seller_code: params.seller_code,
      patient_name: params.patient_name,
      patient_email: params.patient_email,
      patient_phone: params.patient_phone,
      patient_address: params.patient_address,
      items: params.items,
      subtotal_myr: params.subtotal_myr,
      discount_pct: params.discount_pct,
      discount_myr: params.discount_myr,
      total_myr: params.total_myr,
      commission_pct: params.commission_pct,
      commission_myr: params.commission_myr,
      status: 'ordered',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return data as PharmaOrder
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  return !error
}

/**
 * Upload payment receipt
 */
export async function uploadReceipt(
  orderId: string,
  file: File
): Promise<string | null> {
  const filePath = `receipts/${orderId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage
    .from('pharma-receipts')
    .upload(filePath, file)

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('pharma-receipts')
    .getPublicUrl(filePath)

  const url = urlData?.publicUrl
  if (url) {
    await supabase
      .from('orders')
      .update({ payment_receipt_url: url })
      .eq('id', orderId)
  }
  return url
}

/**
 * Lookup seller by code
 */
export async function lookupSellerCode(
  code: string
): Promise<Seller | null> {
  const { data } = await supabase
    .from('sellers')
    .select('*')
    .eq('seller_code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  return data as Seller | null
}

/**
 * Get orders by seller code
 */
export async function getOrdersBySeller(sellerCode: string): Promise<PharmaOrder[]> {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_code', sellerCode)
    .order('created_at', { ascending: false })

  return (data || []) as PharmaOrder[]
}

/**
 * Get all orders (admin)
 */
export async function getAllOrders(): Promise<PharmaOrder[]> {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return (data || []) as PharmaOrder[]
}

/**
 * Get all sellers (admin)
 */
export async function getAllSellers(): Promise<Seller[]> {
  const { data } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false })

  return (data || []) as Seller[]
}

/**
 * Update seller config (admin)
 */
export async function updateSellerConfig(
  sellerId: string,
  config: { discount_pct?: number; commission_pct?: number; is_active?: boolean }
): Promise<boolean> {
  const { error } = await supabase
    .from('sellers')
    .update(config)
    .eq('id', sellerId)

  return !error
}

/**
 * Send email notification
 */
export async function sendEmailNotification(params: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  try {
    // Call the edge function (uses service role key internally)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/pharma-send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(params),
    })
    return res.ok
  } catch (err) {
    console.error('Email send failed:', err)
    return false
  }
}

/**
 * Send new order notification (seller + admin)
 */
export async function notifyNewOrder(order: PharmaOrder, sellerEmail: string) {
  const itemsHtml = (order.items as CartItem[])
    .map(
      (item) =>
        `<tr><td style="padding:8px;border:1px solid #ddd">${item.name} ${item.peptide}</td><td style="padding:8px;border:1px solid #ddd">${item.dosage_mg}mg</td><td style="padding:8px;border:1px solid #ddd">${item.quantity}x</td><td style="padding:8px;border:1px solid #ddd">RM ${(item.price_myr * item.quantity).toLocaleString()}</td></tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#7c3aed">🆕 New Order — ${order.id.slice(0, 8)}</h2>
      <p><strong>Patient:</strong> ${order.patient_name}</p>
      <p><strong>Email:</strong> ${order.patient_email}</p>
      <p><strong>Phone:</strong> ${order.patient_phone || '-'}</p>
      <p><strong>Address:</strong> ${order.patient_address || '-'}</p>
      <p><strong>Seller Code:</strong> ${order.seller_code}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Product</th><th>Dosage</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Subtotal:</strong> RM ${order.subtotal_myr.toLocaleString()}</p>
      <p><strong>Discount (${order.discount_pct}%):</strong> -RM ${order.discount_myr.toLocaleString()}</p>
      <p style="font-size:18px"><strong>Total:</strong> RM ${order.total_myr.toLocaleString()}</p>
      <p><strong>Commission (${order.commission_pct}%):</strong> RM ${order.commission_myr.toLocaleString()}</p>
      <p style="color:#6b7280;margin-top:24px">— Zuso Pharma</p>
    </div>`

  await sendEmailNotification({
    to: sellerEmail,
    subject: `New Order #${order.id.slice(0, 8)} — RM ${order.total_myr.toLocaleString()}`,
    html,
  })

  // Also notify admin
  await sendEmailNotification({
    to: 'admin@zusopharma.com',
    subject: `[ADMIN] New Order #${order.id.slice(0, 8)} — ${order.patient_name}`,
    html,
  })
}

/**
 * Send status change notification to patient
 */
export async function notifyStatusChange(
  order: PharmaOrder,
  oldStatus: OrderStatus,
  newStatus: OrderStatus
) {
  const statusLabels: Record<OrderStatus, string> = {
    ordered: 'Order Placed ✅',
    paid: 'Payment Confirmed 💰',
    preparing_order: 'Preparing Your Order 📦',
    delivery: 'Out for Delivery 🚚',
    delivered: 'Delivered! 🎉',
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#059669">Order Update — #${order.id.slice(0, 8)}</h2>
      <div style="background:#ecfdf5;padding:20px;border-radius:8px;margin:16px 0;text-align:center">
        <p style="font-size:14px;color:#6b7280;margin:0">Status changed from</p>
        <p style="font-size:16px;color:#374151;margin:4px 0;text-decoration:line-through">${statusLabels[oldStatus] || oldStatus}</p>
        <p style="font-size:32px;margin:4px 0">⬇</p>
        <p style="font-size:20px;color:#059669;font-weight:bold;margin:4px 0">${statusLabels[newStatus]}</p>
      </div>
      <p><strong>Order Total:</strong> RM ${order.total_myr.toLocaleString()}</p>
      <p>Hi ${order.patient_name}, your order status has been updated. You'll receive another notification when the status changes again.</p>
      <p style="color:#6b7280;margin-top:24px">— Zuso Pharma</p>
    </div>`

  await sendEmailNotification({
    to: order.patient_email,
    subject: `Order #${order.id.slice(0, 8)} — ${statusLabels[newStatus]}`,
    html,
  })
}
