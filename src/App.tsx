import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'

// Non-home routes are code-split so the landing page ships less JavaScript
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'))
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel'))
const WeightLossForecastPage = lazy(() => import('./pages/WeightLossForecastPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const SellerRegistrationPage = lazy(() => import('./pages/SellerRegistrationPage'))
const SellerLoginPage = lazy(() => import('./pages/SellerLoginPage'))
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pharma-950" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/product" element={<ProductRedirect />} />
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
    </Suspense>
  )
}

/** Redirect /product?code=... → /products?code=... (preserves query params) */
function ProductRedirect() {
  const location = useLocation()
  return <Navigate to={`/products${location.search}`} replace />
}
