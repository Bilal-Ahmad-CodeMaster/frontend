'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

interface TriageData {
  severity: string
  type: string
}

type AlertStatus = 'idle' | 'sending' | 'sent'

export default function DispatchPage() {
  const router = useRouter()
  const [triage, setTriage]     = useState<TriageData | null>(null)
  const [coords, setCoords]     = useState<string>('Fetching GPS…')
  const [latLng, setLatLng]     = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus]     = useState<AlertStatus>('idle')
  const [responders, setResponders] = useState({
    rescue:  'Pending',
    contact: 'Pending',
    vol:     'Searching…',
  })

  useEffect(() => {
    // Load triage from sessionStorage
    const stored = sessionStorage.getItem('madad_triage')
    if (stored) {
      setTriage(JSON.parse(stored))
    } else {
      router.push('/dashboard')
    }

    // Get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setLatLng({ lat, lng })
          setCoords(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        },
        () => setCoords('Lahore, Punjab (approx)')
      )
    }

    // Load blood group from stored user
    try {
      const userStr = localStorage.getItem('madad_user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.medicalInfo?.bloodGroup) {
          localStorage.setItem('madad_blood_group', user.medicalInfo.bloodGroup)
        }
      }
    } catch { /* ignore */ }
  }, [router])

  const sendAlert = async () => {
    setStatus('sending')
    try {
      // ── API INTEGRATION POINT ─────────────────────────────────────────────
      // TODO: const res = await fetch('/api/dispatch/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type:     triage?.type,
      //     severity: triage?.severity,
      //     lat:      latLng?.lat,
      //     lng:      latLng?.lng,
      //     userId:   localStorage.getItem('madad_user_id'),
      //   })
      // })
      // ─────────────────────────────────────────────────────────────────────

      // Simulation — remove when API ready
      await new Promise(r => setTimeout(r, 1800))
    } finally {
      setStatus('sent')
      setResponders({ rescue: 'Notified', contact: 'WhatsApp ✓', vol: '2 nearby' })
    }
  }

  const sevColor: Record<string, string> = {
    critical: 'text-red-400',
    urgent:   'text-amber-400',
    minor:    'text-green-400',
  }

  const sevBadge: Record<string, string> = {
    critical: 'bg-red-500/20 border-red-500/40 text-red-400',
    urgent:   'bg-amber-500/20 border-amber-500/40 text-amber-400',
    minor:    'bg-green-500/20 border-green-500/40 text-green-400',
  }

  return (
    <div className="flex flex-col h-screen bg-[#080B0F] font-['Sora'] text-[#EEF2F7] overflow-hidden"
      style={{ backgroundImage: 'linear-gradient(rgba(230,57,70,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.025) 1px,transparent 1px)', backgroundSize: '48px 48px' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes pin-pulse{0%,100%{box-shadow:0 0 8px rgba(230,57,70,.6),0 0 0 0 rgba(230,57,70,.3)}50%{box-shadow:0 0 24px rgba(230,57,70,.9),0 0 0 10px rgba(230,57,70,0)}}
        @keyframes ripple-out{0%{width:20px;height:20px;opacity:.8}100%{width:120px;height:120px;opacity:0}}
      `}</style>

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-3.5 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md flex-shrink-0">
        <span className="text-xl font-extrabold tracking-tight">Ma<span className="text-[#E63946]">dad</span></span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-green-400">ACTIVE</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-[#E63946] flex items-center justify-center text-[12px] font-bold text-[#E63946]">A</div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* MAP */}
        <div className="relative bg-[#0F1318] border border-[#1E2530] rounded-2xl h-[200px] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(230,57,70,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.06) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
          {[0, 1, 2].map(i => (
            <div key={i} className="absolute rounded-full border border-red-500/30"
              style={{ animation: `ripple-out 2s ease-out ${i * 0.6}s infinite` }} />
          ))}
          <div className="absolute w-3.5 h-3.5 bg-[#E63946] rounded-full border-2 border-white z-10"
            style={{ animation: 'pin-pulse 1.5s ease-in-out infinite' }} />
          <span className="absolute top-3 left-4 text-[11px] font-semibold text-[#6B7685] uppercase tracking-widest z-10">Live Location</span>
          <span className="absolute bottom-3 left-3 text-[10px] font-mono text-[#6B7685] bg-[#080B0F]/80 px-2 py-1 rounded-md z-10">{coords}</span>
          {latLng && (
            <a href={`https://maps.google.com/?q=${latLng.lat},${latLng.lng}`} target="_blank" rel="noreferrer"
              className="absolute bottom-3 right-3 text-[10px] font-semibold text-[#E63946] bg-[#080B0F]/80 px-2 py-1 rounded-md z-10 hover:underline">
              Open Maps →
            </a>
          )}
        </div>

        {/* ALERT SENT */}
        {status === 'sent' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-500/8 border border-green-500/25 rounded-xl">
            <span className="text-green-400 font-bold text-lg">✓</span>
            <span className="text-[13px] font-medium text-green-300">Emergency alert sent — rescue notified with your location</span>
          </div>
        )}

        {/* PATIENT SUMMARY */}
        <div className="bg-[#0F1318] border border-[#1E2530] rounded-2xl px-4 py-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7685] mb-1">Emergency Summary</p>

          {triage && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold w-fit ${sevBadge[triage.severity] || 'text-[#6B7685]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${triage.severity === 'critical' ? 'bg-red-500' : triage.severity === 'urgent' ? 'bg-amber-500' : 'bg-green-500'}`} />
              Severity: {triage.severity.charAt(0).toUpperCase() + triage.severity.slice(1)}
            </div>
          )}

          {[
            ['Emergency Type', triage?.type || '—', triage ? sevColor[triage.severity] || '' : ''],
            ['Reported By',    'Ali Hassan', ''],
            ['Time Reported',  new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }), ''],
          ].map(([label, value, cls]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B7685]">{label}</span>
              <span className={`text-[12px] font-semibold ${cls || 'text-[#EEF2F7]'}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* RESPONDERS */}
        <div className="bg-[#0F1318] border border-[#1E2530] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E2530] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7685]">Responders</span>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${status === 'sent' ? 'bg-green-500/10 border border-green-500/25 text-green-400' : status === 'sending' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' : 'bg-[#1E2530] text-[#6B7685]'}`}>
              {status === 'sent' ? 'Alert Sent' : status === 'sending' ? 'Sending…' : 'Standby'}
            </span>
          </div>

          {[
            { icon: '🚑', name: '1122 Rescue Punjab',  sub: 'Emergency medical services',             val: responders.rescue,  ok: status === 'sent' },
            { icon: '👨‍👩‍👦', name: 'Emergency Contact',   sub: 'WhatsApp alert',                         val: responders.contact, ok: status === 'sent' },
            { icon: '👥', name: 'Nearby Volunteers',    sub: 'Community responders (Blood donors)',    val: responders.vol,     ok: false },
          ].map((r, idx) => (
            <div key={r.name} className={`flex items-center gap-3 px-4 py-3.5 ${idx < 2 ? 'border-b border-[#1E2530]' : ''}`}>
              <div className="w-9 h-9 rounded-[10px] bg-[#141920] flex items-center justify-center text-[18px] flex-shrink-0">{r.icon}</div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#EEF2F7]">{r.name}</p>
                <p className="text-[11px] text-[#6B7685] mt-0.5">{r.sub}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${r.ok ? 'text-green-400 bg-green-500/10' : 'text-[#6B7685]'}`}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* SEND BUTTON */}
        <button onClick={sendAlert} disabled={status !== 'idle'}
          className={`w-full py-3.5 rounded-xl text-white font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all ${status === 'idle' ? 'bg-[#E63946] hover:bg-[#c0303c] shadow-[0_4px_20px_rgba(230,57,70,0.35)]' : status === 'sending' ? 'bg-[#3D4855] cursor-not-allowed' : 'bg-[#15803d] cursor-not-allowed'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          {status === 'idle' ? 'Send Emergency Alert' : status === 'sending' ? '⏳ Sending alert…' : '✓ Alert Sent'}
        </button>

        {/* CALL STRIP */}
        <div className="flex items-center justify-between px-4 py-3 bg-red-500/6 border border-red-500/20 rounded-xl">
          <div className="text-[12px] text-[#6B7685]">Direct line: <span className="text-[#EEF2F7] font-semibold">1122 Rescue</span></div>
          <a href="tel:1122">
            <button className="px-4 py-2 bg-[#E63946] rounded-[8px] text-white text-[12px] font-bold">📞 Call</button>
          </a>
        </div>
      </div>

      <BottomNav active="dispatch" />
    </div>
  )
}