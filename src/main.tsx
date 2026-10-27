import { StrictMode } from 'react'
import './i18n'
import 'remixicon/fonts/remixicon.css'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './store/ThemeProvider'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
