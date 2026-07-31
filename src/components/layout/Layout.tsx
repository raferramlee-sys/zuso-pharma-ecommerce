import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import CartDrawer from '../cart/CartDrawer'
import DiscountFab from '../discount/DiscountFab'

export default function Layout() {
  return (
    <div className="min-h-screen bg-pharma-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <DiscountFab />
    </div>
  )
}
