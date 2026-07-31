import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SellerDiscountProvider } from './hooks/useSellerDiscount'
import { CartProvider } from './hooks/useCart'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SellerDiscountProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SellerDiscountProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
