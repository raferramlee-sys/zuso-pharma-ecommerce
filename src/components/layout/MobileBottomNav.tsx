import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import PreScreeningPanel from '../PreScreeningPanel'

const WHATSAPP_URL = `https://wa.me/60179094510?text=${encodeURIComponent('Hi Zuso Pharma, saya ingin bertanya.')}`

const itemClass = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors'

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

function NavLink({ to, label, active, children }: { to: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <Link to={to} className={`${itemClass} ${active ? 'text-accent-300' : 'text-pharma-300'}`} aria-current={active ? 'page' : undefined}>
      {children}
      {label}
    </Link>
  )
}

/** Fixed bottom bar on small screens: Home, Products, Consult, WhatsApp, Cart. */
export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const { itemCount, setIsOpen } = useCart()
  const [consultOpen, setConsultOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-30 bg-pharma-950/90 backdrop-blur-xl border-t border-pharma-800/70"
      >
        <div className="flex items-stretch h-16">
          <NavLink to="/" label="Home" active={pathname === '/'}>
            <Icon d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
          </NavLink>
          <NavLink to="/products" label="Products" active={pathname.startsWith('/product')}>
            <Icon d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </NavLink>
          <button type="button" onClick={() => setConsultOpen(true)} className={`${itemClass} text-pharma-300`}>
            <span className="-mt-6 mb-0.5 flex w-12 h-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/40 ring-4 ring-pharma-950">
              <Icon d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
            </span>
            Consult
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${itemClass} text-pharma-300`}>
            <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <button type="button" onClick={() => setIsOpen(true)} className={`${itemClass} text-pharma-300 relative`}>
            <span className="relative">
              <Icon d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 flex items-center justify-center bg-accent-500 text-white text-[9px] font-bold rounded-full">
                  {itemCount}
                </span>
              )}
            </span>
            Cart
          </button>
        </div>
      </nav>

      <PreScreeningPanel isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
    </>
  )
}
