import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutCancel from './pages/CheckoutCancel'
import WeightLossForecastPage from './pages/WeightLossForecastPage'
import CheckoutPage from './pages/CheckoutPage'
import SellerRegistrationPage from './pages/SellerRegistrationPage'
import SellerLoginPage from './pages/SellerLoginPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/forecast" element={<WeightLossForecastPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/seller-registration" element={<SellerRegistrationPage />} />
        <Route path="/seller-login" element={<SellerLoginPage />} />
      </Route>
      {/* Seller/Admin pages without main Layout (their own headers) */}
      <Route path="/seller-page" element={<SellerDashboardPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
    </Routes>
  )
}
