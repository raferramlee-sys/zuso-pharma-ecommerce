/**
 * API helpers for orders, sellers, and email notifications
 *
 * Email design: ZUSO Ledger dark theme — #12121c background,
 * #7c3aed (purple) accent, #24243a borders, Arial + Courier New typography.
 */
import { supabase } from './supabase'
import type { PharmaOrder, Seller, CartItem, OrderStatus } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// ─── Design Tokens (shared with ZUSO Ledger dark theme) ──
const T = {
  bg: '#12121c',
  border: '#24243a',
  accent: '#7c3aed',
  accentSoft: 'rgba(124,58,237,0.15)',
  white: '#fff',
  text: '#e6e6f0',
  muted: '#9a9ab0',
  dim: '#6a6a80',
  faint: '#55556a',
  green: '#7dffb3',
  red: '#ff8a7a',
  font: 'Arial,Helvetica,sans-serif',
  mono: "'Courier New',monospace",
  radius: '12px',
  rSmall: '10px',
}

const mn = (n: number) =>
  `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// ─── Shared Email Shell ─────────────────────────────────
function buildEmailShell(bodyHtml: string): string {
  return `
<div style="font-family:${T.font};max-width:620px;margin:0 auto;line-height:1.5">
  ${bodyHtml}
</div>`
}

function sectionHeader(title: string, subtitle?: string): string {
  return `
  <div style="background-color:${T.bg};border-radius:${T.radius} ${T.radius} 0 0;border:1px solid ${T.border};border-bottom:none;padding:24px 28px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:18px;font-weight:bold;color:${T.white};letter-spacing:1px;text-transform:uppercase">
          ${esc(title)}
        </td>
        <td align="right" style="font-size:11px;color:${T.dim};font-family:${T.mono};letter-spacing:1px">
          ${subtitle ? esc(subtitle) : ''}
        </td>
      </tr>
    </table>
  </div>`
}

function sectionHero(statusBadge: string, title: string, detail: string, amount: string, label: string, cta?: { text: string; url: string }): string {
  return `
  <div style="background-color:${T.bg};border:1px solid ${T.border};border-top:4px solid ${T.accent};padding:32px 28px;text-align:center">
    <div style="display:inline-block;background:${T.accentSoft};border:1px solid rgba(124,58,237,0.25);border-radius:20px;padding:4px 14px;font-size:11px;letter-spacing:2px;color:${T.accent};text-transform:uppercase;font-family:${T.mono};margin-bottom:16px">
      ● ${esc(statusBadge)}
    </div>
    <div style="font-size:22px;font-weight:bold;color:${T.white};margin-bottom:8px">${esc(title)}</div>
    <div style="font-size:13px;color:${T.muted};margin-bottom:16px">${detail}</div>
    <div style="font-size:44px;font-weight:bold;color:${T.white};letter-spacing:-1px;margin-bottom:4px">
      ${amount}
    </div>
    <div style="font-size:11px;color:${T.dim};letter-spacing:1px;text-transform:uppercase">${esc(label)}</div>
    ${cta ? `
    <div style="margin-top:24px">
      <a href="${esc(cta.url)}" style="display:inline-block;padding:14px 36px;background:${T.accent};color:${T.white};text-decoration:none;border-radius:${T.rSmall};font-weight:bold;font-size:15px;letter-spacing:0.5px">
        ${esc(cta.text)} →
      </a>
    </div>` : ''}
  </div>`
}

function sectionBody(title: string, content: string): string {
  return `
  <div style="background-color:${T.bg};border:1px solid ${T.border};border-top:none;padding:24px 28px">
    <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${T.accent};margin-bottom:12px">${esc(title)}</div>
    ${content}
  </div>`
}

function sectionFooter(): string {
  return `
  <div style="background-color:${T.bg};border-radius:0 0 ${T.radius} ${T.radius};border:1px solid ${T.border};border-top:none;padding:18px 28px;text-align:center;font-size:11px;color:${T.faint}">
    <strong style="color:${T.accent}">ZUSO Pharma</strong> — by Leverage Medical Sdn. Bhd.<br>
    FDA Approved · MAL Regulated · Sterile A — Rx Only<br>
    Questions? Reply to this email — we're glad to help.
  </div>`
}

function buildLineItems(items: CartItem[], discountPct: number, discountMyr: number, subtotal: number, total: number, commissionMyr?: number, commissionPct?: number): string {
  const rows = items
    .map(
      (it) => `
    <tr style="border-bottom:1px solid ${T.border}">
      <td style="padding:10px 8px;color:${T.text};font-size:13px">${esc(it.name)} ${esc(it.peptide)} — ${it.dosage_mg}mg</td>
      <td style="padding:10px 8px;color:${T.text};text-align:center;font-size:13px">${it.quantity}x</td>
      <td style="padding:10px 8px;color:${T.text};text-align:right;font-size:13px">${mn(it.price_myr)}</td>
      <td style="padding:10px 8px;color:${T.text};text-align:right;font-family:${T.mono};font-size:13px">${mn(it.price_myr * it.quantity)}</td>
    </tr>`,
    )
    .join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="border-bottom:1px solid #2f2f48">
          <th align="left" style="padding:8px;font-size:11px;letter-spacing:1px;color:${T.dim};text-transform:uppercase">Product</th>
          <th align="center" style="padding:8px;font-size:11px;letter-spacing:1px;color:${T.dim};text-transform:uppercase">Qty</th>
          <th align="right" style="padding:8px;font-size:11px;letter-spacing:1px;color:${T.dim};text-transform:uppercase">Price</th>
          <th align="right" style="padding:8px;font-size:11px;letter-spacing:1px;color:${T.dim};text-transform:uppercase">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
      <tr><td align="right" style="padding:2px;color:${T.muted};font-size:13px">Subtotal:</td><td align="right" width="120" style="padding:2px;color:${T.muted};font-size:13px">${mn(subtotal)}</td></tr>
      ${discountPct > 0 ? `<tr><td align="right" style="padding:2px;color:${T.green};font-size:13px">Discount (${discountPct}%):</td><td align="right" style="padding:2px;color:${T.green};font-size:13px">−${mn(discountMyr)}</td></tr>` : ''}
      <tr><td align="right" style="padding:6px 2px 2px;color:${T.white};font-size:15px;font-weight:bold">Total:</td><td align="right" style="padding:6px 2px 2px;color:${T.accent};font-size:15px;font-weight:bold">${mn(total)}</td></tr>
      ${commissionMyr !== undefined && commissionPct !== undefined ? `<tr><td align="right" style="padding:2px;color:${T.muted};font-size:12px">Commission (${commissionPct}%):</td><td align="right" style="padding:2px;color:${T.green};font-size:12px">${mn(commissionMyr)}</td></tr>` : ''}
    </table>`
}

function kvRow(label: string, value: string): string {
  return `<tr><td style="color:${T.dim};padding:2px 6px 2px 0;font-size:13px;text-align:right">${esc(label)}</td><td style="color:${T.text};padding:2px 0 2px 6px;font-size:13px">${value}</td></tr>`
}

// ─── CRUD Operations ────────────────────────────────────

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

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  return !error
}

export async function uploadReceipt(orderId: string, file: File): Promise<string | null> {
  const filePath = `receipts/${orderId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('pharma-receipts').upload(filePath, file)
  if (error) { console.error('Upload error:', error); return null }
  const { data: urlData } = supabase.storage.from('pharma-receipts').getPublicUrl(filePath)
  const url = urlData?.publicUrl
  if (url) {
    await supabase.from('orders').update({ payment_receipt_url: url }).eq('id', orderId)
  }
  return url
}

export async function lookupSellerCode(code: string): Promise<Seller | null> {
  const { data } = await supabase
    .from('sellers')
    .select('*')
    .eq('seller_code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()
  return data as Seller | null
}

export async function getOrdersBySeller(sellerCode: string): Promise<PharmaOrder[]> {
  const { data } = await supabase
    .from('orders').select('*').eq('seller_code', sellerCode).order('created_at', { ascending: false })
  return (data || []) as PharmaOrder[]
}

export async function getAllOrders(): Promise<PharmaOrder[]> {
  const { data } = await supabase
    .from('orders').select('*').order('created_at', { ascending: false })
  return (data || []) as PharmaOrder[]
}

export async function getAllSellers(): Promise<Seller[]> {
  const { data } = await supabase
    .from('sellers').select('*').order('created_at', { ascending: false })
  return (data || []) as Seller[]
}

export async function updateSellerConfig(
  sellerId: string,
  config: { discount_pct?: number; commission_pct?: number; is_active?: boolean }
): Promise<boolean> {
  const { error } = await supabase.from('sellers').update(config).eq('id', sellerId)
  return !error
}

// ─── Email Sending ──────────────────────────────────────

export async function sendEmailNotification(params: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
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

// ─── Notification Functions ─────────────────────────────

/** 1. Seller registration — welcome email to seller */
export async function notifySellerWelcome(seller: Seller) {
  const shareLink = `https://pharma.zuso-boltz-agentic.app/?code=${esc(seller.seller_code)}`

  const body = `
    ${sectionHeader('PHARMA.zuso', 'WELCOME')}
    ${sectionHero(
      'Seller Account Created',
      'Welcome to Zuso Pharma',
      `Your seller code: <span style="color:${T.accent};font-family:${T.mono};font-size:20px;letter-spacing:2px"><strong>${esc(seller.seller_code)}</strong></span>`,
      `${seller.discount_pct}%`,
      'Patient Discount · ' + `${seller.commission_pct}% Commission`,
      { text: 'View Dashboard', url: `https://pharma.zuso-boltz-agentic.app/seller-page` }
    )}
    ${sectionBody('Account Details', `
      <table cellpadding="4" cellspacing="0">
        ${kvRow('Email', esc(seller.email))}
        ${kvRow('Phone', esc(seller.phone || '-'))}
        ${kvRow('Bank', esc(seller.bank_name || '-'))}
        ${kvRow('Account No.', esc(seller.bank_acc_number || '-'))}
        ${kvRow('Discount', `${seller.discount_pct}% for patients`)}
        ${kvRow('Commission', `${seller.commission_pct}% per order`)}
      </table>
    `)}
    ${sectionBody('Share Your Code', `
      <div style="font-size:14px;color:${T.text};margin-bottom:8px">
        Patients get <strong style="color:${T.green}">${seller.discount_pct}% off</strong> — you earn <strong style="color:${T.green}">${seller.commission_pct}%</strong> commission.
      </div>
      <div style="background:${T.accentSoft};border:1px solid rgba(124,58,237,0.25);border-radius:${T.rSmall};padding:12px 16px;font-family:${T.mono};font-size:16px;color:${T.accent};text-align:center;letter-spacing:2px">
        ${esc(shareLink)}
      </div>
      <div style="margin-top:12px;font-size:12px;color:${T.muted}">
        Share this link with your patients. When they visit, discounted prices are shown automatically.
      </div>
    `)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: seller.email,
    subject: `Welcome to Zuso Pharma — Your Seller Code: ${seller.seller_code}`,
    html: buildEmailShell(body),
  })
}

/** 2. Seller registration — notification to admin */
export async function notifyAdminNewSeller(seller: Seller) {
  const body = `
    ${sectionHeader('PHARMA.zuso', 'ADMIN')}
    ${sectionHero(
      'New Seller',
      esc(seller.email),
      `Code: <span style="font-family:${T.mono};color:${T.accent}">${esc(seller.seller_code)}</span>`,
      `${seller.discount_pct}% / ${seller.commission_pct}%`,
      'Discount · Commission',
      { text: 'Manage Sellers', url: 'https://pharma.zuso-boltz-agentic.app/admin' }
    )}
    ${sectionBody('Seller Details', `
      <table cellpadding="4" cellspacing="0">
        ${kvRow('Email', esc(seller.email))}
        ${kvRow('Phone', esc(seller.phone || '-'))}
        ${kvRow('Address', esc(seller.address || '-'))}
        ${kvRow('Bank', esc(seller.bank_name || '-'))}
        ${kvRow('Account No.', esc(seller.bank_acc_number || '-'))}
        ${kvRow('Seller Code', `<span style="font-family:${T.mono}">${esc(seller.seller_code)}</span>`)}
        ${kvRow('Discount', `${seller.discount_pct}%`)}
        ${kvRow('Commission', `${seller.commission_pct}%`)}
      </table>
    `)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: 'admin@zusopharma.com',
    subject: `[ADMIN] New Seller Registered — ${seller.email}`,
    html: buildEmailShell(body),
  })
}

/** 3. Patient order confirmation */
export async function notifyPatientOrderConfirmation(order: PharmaOrder) {
  const items = order.items as CartItem[]
  const itemsHtml = buildLineItems(items, order.discount_pct, order.discount_myr, order.subtotal_myr, order.total_myr)

  const body = `
    ${sectionHeader('PHARMA.zuso', 'ORDER')}
    ${sectionHero(
      'Order Placed',
      'Thank you for your order!',
      `Order <span style="font-family:${T.mono};color:${T.text}">#${esc(order.id.slice(0, 8))}</span>`,
      mn(order.total_myr),
      'Amount Due',
    )}
    ${sectionBody('Bill To', `
      <div style="font-size:15px;font-weight:bold;color:${T.white};margin-bottom:4px">${esc(order.patient_name)}</div>
      ${order.patient_address ? `<div style="font-size:13px;color:${T.muted}">${esc(order.patient_address)}</div>` : ''}
      ${order.patient_phone ? `<div style="font-size:13px;color:${T.muted}">${esc(order.patient_phone)}</div>` : ''}
      <div style="font-size:13px;color:${T.muted}">${esc(order.patient_email)}</div>
    `)}
    ${sectionBody('Order Summary', itemsHtml)}
    ${sectionBody('Payment Method', `
      <div style="font-size:13px;color:${T.muted}">
        <strong style="color:${T.accent};text-transform:uppercase;letter-spacing:1px">Bank Transfer</strong><br>
        Bank: <strong style="color:${T.text}">Maybank</strong><br>
        Account: <strong style="color:${T.text}">LEVERAGE MEDICAL SDN BHD</strong><br>
        No: <strong style="color:${T.text};font-family:${T.mono}">1234567890</strong>
      </div>
      <div style="margin-top:12px;padding:12px;background:${T.accentSoft};border-radius:${T.rSmall};font-size:12px;color:${T.muted}">
        ⚠️ Your order will be processed after payment is confirmed. Upload your receipt at the checkout page or reply to this email.
      </div>
    `)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: order.patient_email,
    subject: `Order #${order.id.slice(0, 8)} Confirmed — ${mn(order.total_myr)}`,
    html: buildEmailShell(body),
  })
}

/** 4. New order — seller notification */
export async function notifySellerNewOrder(order: PharmaOrder, sellerEmail: string) {
  const items = order.items as CartItem[]
  const itemsHtml = buildLineItems(items, order.discount_pct, order.discount_myr, order.subtotal_myr, order.total_myr, order.commission_myr, order.commission_pct)

  const body = `
    ${sectionHeader('PHARMA.zuso', 'NEW ORDER')}
    ${sectionHero(
      'New Order',
      esc(order.patient_name),
      `Order <span style="font-family:${T.mono};color:${T.text}">#${esc(order.id.slice(0, 8))}</span> · Code: <span style="font-family:${T.mono};color:${T.accent}">${esc(order.seller_code)}</span>`,
      mn(order.total_myr),
      `Commission: ${mn(order.commission_myr)}`,
      { text: 'View Dashboard', url: `https://pharma.zuso-boltz-agentic.app/seller-page` }
    )}
    ${sectionBody('Patient Details', `
      <table cellpadding="4" cellspacing="0">
        ${kvRow('Name', esc(order.patient_name))}
        ${kvRow('Email', esc(order.patient_email))}
        ${kvRow('Phone', esc(order.patient_phone || '-'))}
        ${kvRow('Address', esc(order.patient_address || '-'))}
      </table>
    `)}
    ${sectionBody('Order Summary', itemsHtml)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: sellerEmail,
    subject: `New Order #${order.id.slice(0, 8)} — ${mn(order.total_myr)} (Commission: ${mn(order.commission_myr)})`,
    html: buildEmailShell(body),
  })
}

/** 5. New order — admin notification */
export async function notifyAdminNewOrder(order: PharmaOrder) {
  const items = order.items as CartItem[]
  const itemsHtml = buildLineItems(items, order.discount_pct, order.discount_myr, order.subtotal_myr, order.total_myr, order.commission_myr, order.commission_pct)

  const body = `
    ${sectionHeader('PHARMA.zuso', 'ADMIN')}
    ${sectionHero(
      'New Order',
      esc(order.patient_name),
      `Order <span style="font-family:${T.mono};color:${T.text}">#${esc(order.id.slice(0, 8))}</span> · Seller: <span style="font-family:${T.mono};color:${T.accent}">${esc(order.seller_code)}</span>`,
      mn(order.total_myr),
      `Commission: ${mn(order.commission_myr)}`,
      { text: 'Manage Orders', url: 'https://pharma.zuso-boltz-agentic.app/admin' }
    )}
    ${sectionBody('Patient Details', `
      <table cellpadding="4" cellspacing="0">
        ${kvRow('Name', esc(order.patient_name))}
        ${kvRow('Email', esc(order.patient_email))}
        ${kvRow('Phone', esc(order.patient_phone || '-'))}
        ${kvRow('Address', esc(order.patient_address || '-'))}
        ${kvRow('Seller Code', `<span style="font-family:${T.mono}">${esc(order.seller_code)}</span>`)}
      </table>
    `)}
    ${sectionBody('Order Summary', itemsHtml)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: 'admin@zusopharma.com',
    subject: `[ADMIN] New Order #${order.id.slice(0, 8)} — ${order.patient_name}`,
    html: buildEmailShell(body),
  })
}

/** 6. Order status change — patient notification */
export async function notifyPatientStatusChange(order: PharmaOrder, oldStatus: OrderStatus, newStatus: OrderStatus) {
  const statusConfig: Record<OrderStatus, { label: string; badge: string }> = {
    ordered: { label: 'Order Placed', badge: 'Received' },
    paid: { label: 'Payment Confirmed', badge: 'Paid' },
    preparing_order: { label: 'Preparing Your Order', badge: 'Processing' },
    delivery: { label: 'Out for Delivery', badge: 'Shipping' },
    delivered: { label: 'Delivered!', badge: 'Complete' },
  }

  const newCfg = statusConfig[newStatus]
  const oldCfg = statusConfig[oldStatus] || { label: oldStatus, badge: oldStatus }

  const body = `
    ${sectionHeader('PHARMA.zuso', 'STATUS UPDATE')}
    ${sectionHero(
      newCfg.badge,
      newCfg.label,
      `Order <span style="font-family:${T.mono};color:${T.text}">#${esc(order.id.slice(0, 8))}</span>`,
      mn(order.total_myr),
      `Previously: ${esc(oldCfg.label)} → Now: ${esc(newCfg.label)}`,
      { text: 'View Order', url: `https://pharma.zuso-boltz-agentic.app/checkout` }
    )}
    ${sectionBody('Status Timeline', `
      <div style="position:relative;padding-left:24px">
        ${(['ordered','paid','preparing_order','delivery','delivered'] as OrderStatus[]).map((s, i) => {
          const cfg = statusConfig[s]
          const isPast = (['ordered','paid','preparing_order','delivery','delivered'] as OrderStatus[]).indexOf(s) <= (['ordered','paid','preparing_order','delivery','delivered'] as OrderStatus[]).indexOf(newStatus)
          const isCurrent = s === newStatus
          return `
          <div style="position:relative;padding:8px 0;display:flex;align-items:center;gap:12px">
            <div style="width:12px;height:12px;border-radius:50%;background:${isCurrent ? T.accent : isPast ? T.green : T.border};border:2px solid ${isCurrent ? T.accent : isPast ? T.green : T.border};flex-shrink:0"></div>
            <span style="font-size:13px;color:${isCurrent ? T.white : isPast ? T.text : T.dim};${isPast && !isCurrent ? '' : ''}">${cfg.label}${isCurrent ? ' ← <strong style="color:' + T.accent + '">NOW</strong>' : ''}</span>
          </div>`
        }).join('')}
      </div>
      <div style="margin-top:16px;font-size:12px;color:${T.muted}">
        Hi ${esc(order.patient_name)}, your order is on the way! You'll be notified when the status changes again.
      </div>
    `)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: order.patient_email,
    subject: `${newCfg.label} — Order #${order.id.slice(0, 8)}`,
    html: buildEmailShell(body),
  })
}

/** 7. Receipt uploaded — admin notification */
export async function notifyAdminReceiptUploaded(order: PharmaOrder) {
  const body = `
    ${sectionHeader('PHARMA.zuso', 'ADMIN')}
    ${sectionHero(
      'Receipt Uploaded',
      esc(order.patient_name),
      `Order <span style="font-family:${T.mono};color:${T.text}">#${esc(order.id.slice(0, 8))}</span>`,
      mn(order.total_myr),
      'Awaiting Verification',
      { text: 'Verify Payment', url: 'https://pharma.zuso-boltz-agentic.app/admin' }
    )}
    ${sectionBody('Details', `
      <table cellpadding="4" cellspacing="0">
        ${kvRow('Patient', esc(order.patient_name))}
        ${kvRow('Email', esc(order.patient_email))}
        ${kvRow('Phone', esc(order.patient_phone || '-'))}
        ${kvRow('Seller Code', `<span style="font-family:${T.mono}">${esc(order.seller_code)}</span>`)}
        ${kvRow('Total', mn(order.total_myr))}
      </table>
    `)}
    ${sectionFooter()}
  `

  await sendEmailNotification({
    to: 'admin@zusopharma.com',
    subject: `[ADMIN] Receipt Uploaded — Order #${order.id.slice(0, 8)} by ${order.patient_name}`,
    html: buildEmailShell(body),
  })
}

// ─── Convenience: notify all on new order ────────────────
export async function notifyAllNewOrder(order: PharmaOrder, sellerEmail: string) {
  await Promise.allSettled([
    notifyPatientOrderConfirmation(order),
    notifySellerNewOrder(order, sellerEmail),
    notifyAdminNewOrder(order),
  ])
}
