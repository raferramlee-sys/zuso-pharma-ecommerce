import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import CartDrawer from '../cart/CartDrawer'
import DiscountFab from '../discount/DiscountFab'
import WhatsAppFab from '../WhatsAppFab'
import MobileBottomNav from './MobileBottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-pharma-950 flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 pt-16">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <DiscountFab />
      <WhatsAppFab />
      <MobileBottomNav />
    </div>
  )
}
