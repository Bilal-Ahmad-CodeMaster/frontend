'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

interface TriageData {
  severity: 'critical' | 'urgent' | 'minor'
  type: string
}

type AlertStatus = 'idle' | 'sending' | 'sent'

export default function DispatchPage() {
  const router = useRouter()
  const [triage, setTriage] = useState<TriageData | null>(null)
  const [coords, setCoords] = useState<string>('Fetching GPS...')
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState<AlertStatus>('idle')
  const [responders, setResponders] = useState({
    rescue: 'Pending',
    contact: 'Pending',
    vol: 'Searching...',
  })

  useEffect(() => {
    // 1. Load Triage Data from Session
    const stored = sessionStorage.getItem('madad_triage')
    if (stored) {
      try {
        setTriage(JSON.parse(stored))
      } catch (e) {
        console.error("Error parsing triage data", e)
      }
    }

    // 2. Get Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setLatLng({ lat, lng })
          setCoords(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        },
        () => setCoords('Location access denied')
      )
    } else {
      setCoords('Geolocation not supported')
    }
  }, [])

  const sendAlert = async () => {
    setStatus('sending')
    
    try {
      // Get User ID safely
      let userId = typeof window !== 'undefined' ? localStorage.getItem('madad_user_id') : null
      if (!userId || userId === 'null') {
        userId = 'guest_' + Math.random().toString(36).substr(2, 9)
      }

      const requestData = {
        type: triage?.type || 'General Emergency',
        severity: triage?.severity || 'minor',
        lat: latLng?.lat || null,
        lng: latLng?.lng || null,
        userId: userId,
      }

      console.log('📤 Sending Request:', requestData)

      const response = await fetch('/api/dispatch/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      // 3. SAFETY CHECK: Ensure we didn't get an HTML 404 page
      const contentType = response.headers.get("content-type")
      
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        
        if (!response.ok) throw new Error(data.error || 'Server error')

        console.log('📥 Success:', data)
        setStatus('sent')
        setResponders({
          rescue: 'Notified',
          contact: 'WhatsApp ✓',
          vol: '2 nearby'
        })
      } else {
        // If the server returned HTML (likely a 404 or 500 error page)
        const errorHtml = await response.text()
        console.error("Unexpected non-JSON response from server")
        throw new Error(`Route Not Found (404). Check if /api/dispatch/send/route.js exists.`)
      }

    } catch (error: any) {
      console.error('Dispatch Error:', error.message)
      alert(error.message)
      setStatus('idle')
    }
  }

  const sevBadge: Record<string, string> = {
    critical: 'bg-red-500/20 border-red-500/40 text-red-400',
    urgent: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    minor: 'bg-green-500/20 border-green-500/40 text-green-400',
  }

  return (
    <div className="flex flex-col h-screen bg-[#080B0F] font-['Sora'] text-[#EEF2F7] overflow-hidden">
      {/* Visual FX */}
      <style>{`
        @keyframes pin-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(230,57,70,.6); }
          50% { box-shadow: 0 0 24px rgba(230,57,70,.9); }
        }
        @keyframes ripple-out {
          0% { width: 20px; height: 20px; opacity: 0.8; }
          100% { width: 120px; height: 120px; opacity: 0; }
        }
      `}</style>

      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md">
        <span className="text-xl font-extrabold tracking-tight">Ma<span className="text-[#E63946]">dad</span></span>
        <div className="bg-green-500/10 border border-green-500/25 rounded-full px-3 py-1 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-400">GPS ACTIVE</span>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* MAP VISUALIZER */}
          <div className="relative bg-[#0F1318] border border-[#1E2530] rounded-2xl h-[200px] overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#E63946 0.5px, transparent 0.5px)', backgroundSize: '16px 16px'}} />
             {[0, 1, 2].map(i => (
                <div key={i} className="absolute rounded-full border border-red-500/30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ animation: `ripple-out 2s ease-out ${i * 0.6}s infinite` }} />
             ))}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#E63946] rounded-full border-2 border-white z-10"
               style={{ animation: 'pin-pulse 1.5s infinite' }} />
             <span className="absolute bottom-3 left-3 text-[10px] font-mono text-[#6B7685] bg-[#080B0F]/80 px-2 py-1 rounded">
               {coords}
             </span>
          </div>

          {/* EMERGENCY SUMMARY */}
          <div className="bg-[#0F1318] border border-[#1E2530] rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-[#6B7685] uppercase tracking-widest mb-4">Case Details</h3>
            
            {triage && (
              <div className={`inline-block px-3 py-1 rounded-full border text-[11px] font-bold mb-4 ${sevBadge[triage.severity]}`}>
                {triage.severity.toUpperCase()}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#6B7685]">Condition</span>
                <span className="font-bold">{triage?.type || 'General'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#6B7685]">Reported</span>
                <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </div>

          {/* RESPONDERS LIST */}
          <div className="bg-[#0F1318] border border-[#1E2530] rounded-2xl overflow-hidden">
            {[
              { icon: '🚑', name: '1122 Rescue', val: responders.rescue },
              { icon: '👨‍👩‍👦', name: 'Emergency Contacts', val: responders.contact },
              { icon: '👥', name: 'Nearby Volunteers', val: responders.vol },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-[#1E2530] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-[13px] font-medium">{r.name}</span>
                </div>
                <span className={`text-[11px] font-bold ${r.val.includes('✓') || r.val === 'Notified' ? 'text-green-400' : 'text-[#6B7685]'}`}>
                  {r.val}
                </span>
              </div>
            ))}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={sendAlert}
            disabled={status !== 'idle'}
            className={`w-full py-4 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-3 shadow-lg
              ${status === 'idle' ? 'bg-[#E63946] active:scale-95 shadow-red-500/20' : 'bg-[#1E2530] text-[#6B7685] cursor-not-allowed'}`}
          >
            {status === 'idle' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                Send Emergency Alert
              </>
            ) : status === 'sending' ? (
              'Processing Alert...'
            ) : (
              '✓ Alert Dispatched'
            )}
          </button>

          <a href="tel:1122" className="block text-center text-[12px] font-bold text-[#E63946] py-2">
            OR CALL 1122 IMMEDIATELY
          </a>
        </div>
      </div>

      <BottomNav active="dispatch" />
    </div>
  )
}