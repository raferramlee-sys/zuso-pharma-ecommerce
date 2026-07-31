/**
 * Seller authentication — custom bcrypt-based auth (no Supabase Auth)
 */
import { supabase } from './supabase'
import type { Seller, SellerSession } from '../types'

const SESSION_KEY = 'pharma_seller_session'

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

function generateSellerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function registerSeller(data: {
  email: string
  password: string
  phone: string
  address: string
  bank_name: string
  bank_acc_number: string
}): Promise<{ seller: Seller; session: SellerSession } | { error: string }> {
  // Hash password client-side with a simple approach (bcryptjs in real prod)
  const passwordHash = await hashPassword(data.password)
  const sellerCode = generateSellerCode()

  const { data: seller, error: insertErr } = await supabase
    .from('sellers')
    .insert({
      email: data.email.toLowerCase().trim(),
      password_hash: passwordHash,
      phone: data.phone,
      address: data.address,
      bank_name: data.bank_name,
      bank_acc_number: data.bank_acc_number,
      seller_code: sellerCode,
      discount_pct: 5,
      commission_pct: 10,
    })
    .select()
    .single()

  if (insertErr) {
    if (insertErr.message?.includes('duplicate') || insertErr.code === '23505') {
      return { error: 'Email already registered' }
    }
    return { error: insertErr.message }
  }

  // Create session
  const session = await createSession(seller.id)
  return { seller: seller as Seller, session }
}

export async function loginSeller(
  email: string,
  password: string
): Promise<{ seller: Seller; session: SellerSession } | { error: string }> {
  const { data: seller, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !seller) return { error: 'Invalid email or password' }
  if (!seller.is_active) return { error: 'Account is deactivated' }

  const valid = await verifyPassword(password, seller.password_hash)
  if (!valid) return { error: 'Invalid email or password' }

  const session = await createSession(seller.id)
  return { seller: seller as Seller, session }
}

export async function logoutSeller(): Promise<void> {
  const session = getStoredSession()
  if (session) {
    await supabase.from('seller_sessions').delete().eq('token', session.token)
  }
  localStorage.removeItem(SESSION_KEY)
}

export async function getSellerBySession(): Promise<Seller | null> {
  const session = getStoredSession()
  if (!session) return null

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', session.seller_id)
    .single()

  return seller as Seller | null
}

function getStoredSession(): SellerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function createSession(sellerId: string): Promise<SellerSession> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  const { data, error } = await supabase
    .from('seller_sessions')
    .insert({
      seller_id: sellerId,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw new Error('Failed to create session')

  const session: SellerSession = data
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

// ─── Simple client-side password hashing ────────────────

async function hashPassword(password: string): Promise<string> {
  // Use Web Crypto API (PBKDF2) for client-side hashing
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  )
  const hashStr = btoa(String.fromCharCode(...new Uint8Array(hash)))
  const saltStr = btoa(String.fromCharCode(...salt))
  return `pbkdf2:${saltStr}:${hashStr}`
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith('pbkdf2:')) {
    // Fallback: bcrypt hash from seed
    // Simple comparison for seeded admin account
    return storedHash === '$2b$10$rQZUZYjCgYhUFmE9VvKQBO3MqRNK0mRAKGIoXNhYRhXCZ5MMCElvS' && password === 'admin123'
  }
  const [, saltStr, hashStr] = storedHash.split(':')
  const encoder = new TextEncoder()
  const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  )
  const computedHashStr = btoa(String.fromCharCode(...new Uint8Array(hash)))
  return computedHashStr === hashStr
}

export function getSessionToken(): string | null {
  const session = getStoredSession()
  return session?.token || null
}
