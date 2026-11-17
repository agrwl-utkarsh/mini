import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="color: white; padding: 20px; font-family: monospace;">Error: Root element not found</div>'
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    )
    console.log('React app mounted successfully')
  } catch (error) {
    console.error('Failed to mount React app:', error)
    rootElement.innerHTML = `
      <div style="color: white; padding: 20px; font-family: monospace; background: #0a0f1a; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center; max-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2 style="color: #f1f5f9; margin-bottom: 8px;">Failed to load app</h2>
          <p style="color: #94a3b8; font-size: 14px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `
  }
}