import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// boot stamp — makes it obvious in the console whether a fresh bundle is running
// ( stale HMR states were the source of several phantom bugs )
console.info(
  `[Petal] bundle loaded · ${new Date().toISOString().slice(11, 19)} · ${import.meta.env.DEV ? 'dev' : 'prod'}`,
)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
