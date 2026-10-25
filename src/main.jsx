import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Analytics (optional): only loads if VITE_GA_MEASUREMENT_ID is set (see .env.example)
// and the visitor already accepted optional cookies. No-op until both are true.
// If you enable this, also update the cookie banner copy (T.en/T.gr.cookieOptionalDesc
// in App.jsx) to mention analytics, since it currently only discloses Maps & Fonts.
try {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (gaId && localStorage.getItem('bc_consent') === 'accepted') {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', gaId)
  }
} catch { /* localStorage unavailable */ }

// Inline onMouseEnter/Leave handlers would stick after a tap on touch screens (emulated hover).
// React hears them via mouseover/out, so swallow those unless the primary input truly hovers.
const hoverOk = matchMedia('(hover: hover) and (pointer: fine)')
for (const ev of ['mouseover', 'mouseout']) {
  document.addEventListener(ev, (e) => { if (!hoverOk.matches) e.stopPropagation() }, true)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
