'use client'

import { useEffect } from 'react'

// Drop this component into your root layout.tsx
// It registers the service worker that caches GIFs offline
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          console.log('[SW] Registered, scope:', reg.scope)
        })
        .catch(err => {
          console.error('[SW] Registration failed:', err)
        })
    })
  }, [])

  return null  // renders nothing — just registers the SW
}