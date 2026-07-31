import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SellerDiscountProvider } from './hooks/useSellerDiscount'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SellerDiscountProvider>
          <App />
        </SellerDiscountProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
