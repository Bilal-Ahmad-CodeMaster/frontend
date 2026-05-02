'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Severity = 'critical' | 'urgent' | 'minor' | null

interface TriageResult {
  severity: Severity
  type: string
  steps: string[]
}

// ─── TRIAGE LOGIC (keyword fallback) ─────────────────────────────────────────
function triageText(text: string): TriageResult {
  const t = text.toLowerCase()

  if (t.includes('heart') || t.includes('chest') || t.includes('attack') || t.includes('cardiac')) {
    return {
      severity: 'critical',
      type: 'Heart Attack',
      steps: [
        'Call 1122 immediately — do not wait',
        'Loosen tight clothing around chest and neck',
        'If unconscious — start CPR: 30 compressions then 2 breaths',
        'Do NOT give food or water',
        'Stay with the person until help arrives',
      ]
    }
  }
  
  if (t.includes('chok') || t.includes('airway') || t.includes('not breath') || t.includes('no breath')) {
    return {
      severity: 'critical',
      type: 'Choking / Not Breathing',
      steps: [
        'Stand behind person — wrap arms around waist',
        'Give 5 firm upward thrusts (Heimlich maneuver)',
        'If unconscious — lay flat and start CPR immediately',
        'Keep going until object dislodges or help arrives',
        'Call 1122 now',
      ]
    }
  }
  
  if (t.includes('bleed') || t.includes('blood') || t.includes('wound') || t.includes('cut')) {
    return {
      severity: 'urgent',
      type: 'Severe Bleeding',
      steps: [
        'Apply firm direct pressure with clean cloth',
        'Do NOT remove cloth — add more on top if soaked',
        'Elevate injured limb above heart level if possible',
        'Apply tourniquet above wound if bleeding does not stop',
        'Call 1122 and keep person warm and calm',
      ]
    }
  }
  
  if (t.includes('burn')) {
    return {
      severity: 'urgent',
      type: 'Burns',
      steps: [
        'Cool burn under running cold water for 20 minutes',
        'Do NOT use ice, butter or toothpaste',
        'Cover loosely with clean non-fluffy material',
        'Remove jewellery near burn area carefully',
        'Seek medical help for any burn larger than palm size',
      ]
    }
  }

  return {
    severity: 'minor',
    type: 'General Emergency',
    steps: [
      'Stay calm and assess the situation',
      'Check if person is conscious and breathing',
      'Call 1122 if unsure — better safe than sorry',
      'Do not move person if spinal injury suspected',
      'Keep person warm and reassured until help arrives',
    ]
  }
}

// ─── QUICK SCENARIOS ──────────────────────────────────────────────────────────
const SCENARIOS = [
  { key: 'heart attack', label: 'Heart Attack', sub: 'Chest pain', icon: '❤️', bg: 'rgba(239,68,68,0.1)' },
  { key: 'choking', label: 'Choking', sub: 'Airway blocked', icon: '🤧', bg: 'rgba(230,57,70,0.1)' },
  { key: 'bleeding', label: 'Bleeding', sub: 'Severe wound', icon: '🩸', bg: 'rgba(220,38,38,0.1)' },
  { key: 'not breathing', label: 'Not Breathing', sub: 'No pulse / CPR', icon: '😮', bg: 'rgba(168,85,247,0.1)' },
]

const SEV_STYLES: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/6',
  urgent: 'border-amber-500/40 bg-amber-500/6',
  minor: 'border-green-500/40 bg-green-500/6',
}

const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-500 shadow-[0_0_8px_#E63946]',
  urgent: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
  minor: 'bg-green-500 shadow-[0_0_8px_#22c55e]',
}

const SEV_TEXT: Record<string, string> = {
  critical: 'text-red-400',
  urgent: 'text-amber-400',
  minor: 'text-green-400',
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [triage, setTriage] = useState<TriageResult | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Store triage in sessionStorage for dispatch page
  useEffect(() => {
    if (triage) sessionStorage.setItem('madad_triage', JSON.stringify(triage))
  }, [triage])

  // Setup Web Speech API
  const setupRecognition = () => {
    const SR = (window as Window & typeof globalThis).SpeechRecognition ||
      (window as Window & typeof globalThis).webkitSpeechRecognition
    if (!SR) {
      alert('Use Chrome or Edge for voice recognition.')
      return null
    }

    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'

    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        e.results[i].isFinal ? (final += t) : (interim += t)
      }
      const full = (final || interim).trim()
      setTranscript(full)
      if (final.trim()) {
        const result = triageText(final)
        setTriage(result)
        speakText(result.steps[0])
      }
    }

    r.onerror = () => stopListening()
    r.onend = () => { if (listening) r.start() }
    return r
  }

  const startListening = () => {
    const r = setupRecognition()
    if (!r) return
    recognitionRef.current = r
    r.start()
    setListening(true)
    setTranscript('')
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const toggleMic = () => listening ? stopListening() : startListening()

  const triggerScenario = (key: string) => {
    stopListening()
    setTranscript('I need help with ' + key)
    const result = triageText(key)
    setTriage(result)
    speakText(result.steps[0])
  }

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="flex flex-col h-screen bg-[#080B0F] font-['Sora'] text-[#EEF2F7] overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(rgba(230,57,70,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.025) 1px,transparent 1px)',
        backgroundSize: '48px 48px'
      }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes ring-pulse {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes mic-throb {
          0%,100% { box-shadow: 0 8px 32px rgba(230,57,70,.5), 0 0 0 0 rgba(230,57,70,.3); }
          50% { box-shadow: 0 8px 48px rgba(230,57,70,.7), 0 0 0 14px rgba(230,57,70,0); }
        }
      `}</style>

      {/* NAV BAR */}
      <nav className="flex items-center justify-between px-6 py-3.5 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md flex-shrink-0">
        <span className="text-xl font-extrabold tracking-tight">
          Ma<span className="text-[#E63946]">dad</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-green-400">ACTIVE</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-[#E63946] flex items-center justify-center text-[12px] font-bold text-[#E63946] cursor-pointer">
            A
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        <p className="text-[13px] text-[#6B7685]">
          Welcome back, <span className="text-[#EEF2F7] font-semibold">Ali</span> — stay safe today
        </p>

        {/* SEVERITY INDICATOR */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${triage ? SEV_STYLES[triage.severity!] : 'border-[#1E2530] bg-[#0F1318]'}`}>
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-500 ${triage ? SEV_DOT[triage.severity!] : 'bg-[#3D4855]'}`} />
          <span className={`text-[12px] font-semibold transition-all duration-500 ${triage ? SEV_TEXT[triage.severity!] : 'text-[#6B7685]'}`}>
            {triage ? `${triage.severity!.charAt(0).toUpperCase() + triage.severity!.slice(1)} — ${triage.type}` : 'No active emergency'}
          </span>
          <span className="ml-auto text-[11px] text-[#6B7685]">
            {triage?.severity === 'critical' ? 'Dispatch recommended' : triage?.severity === 'urgent' ? 'Monitor closely' : 'System standby'}
          </span>
        </div>

        {/* MICROPHONE BUTTON */}
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative w-[140px] h-[140px] flex items-center justify-center">
            {[100, 120, 140].map((size, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-red-500/20"
                style={{
                  width: `${size}%`,
                  height: `${size}%`,
                  animation: listening ? `ring-pulse 1s ease-in-out ${i * 0.2}s infinite` : 'none',
                  borderColor: listening ? 'rgba(230,57,70,0.4)' : 'rgba(230,57,70,0.15)'
                }}
              />
            ))}
            <button
              onClick={toggleMic}
              className="w-24 h-24 rounded-full flex items-center justify-center border-none cursor-pointer relative z-10 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg,#c0303c,#E63946)',
                boxShadow: listening ? '0 8px 40px rgba(230,57,70,0.7),0 0 0 0 rgba(230,57,70,0.4)' : '0 8px 32px rgba(230,57,70,0.4)',
                animation: listening ? 'mic-throb 1.2s ease-in-out infinite' : 'none'
              }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </button>
          </div>
          <p className={`text-[13px] font-semibold tracking-wide ${listening ? 'text-[#E63946]' : 'text-[#6B7685]'}`}>
            {listening ? 'Listening… speak now' : 'Tap to speak your emergency'}
          </p>
        </div>

        {/* TRANSCRIPT DISPLAY */}
        <div className={`px-4 py-3.5 rounded-2xl border text-[13px] leading-relaxed min-h-[52px] transition-all duration-200 ${transcript ? 'border-red-500/30 bg-[#0F1318] text-[#EEF2F7]' : 'border-[#1E2530] bg-[#0F1318] text-[#3D4855]'}`}>
          {transcript || 'Your words will appear here as you speak…'}
        </div>

        {/* AI FIRST-AID STEPS */}
        {triage && (
          <div className="bg-[#0F1318] border border-[#1E2530] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1E2530] flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="text-[11px] font-bold tracking-widest text-[#E63946] uppercase">AI First-Aid Guidance</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-3">
              {triage.steps.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-[22px] h-[22px] rounded-full bg-red-500/10 border border-red-500/30 text-[#E63946] text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-[#EEF2F7] leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK SCENARIOS */}
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7685]">Quick Scenarios</p>
        <div className="grid grid-cols-2 gap-2.5">
          {SCENARIOS.map(sc => (
            <button
              key={sc.key}
              onClick={() => triggerScenario(sc.key)}
              className="flex items-center gap-3 px-4 py-3.5 bg-[#0F1318] border border-[#1E2530] rounded-xl cursor-pointer text-left transition-all hover:border-[#E63946] hover:bg-red-500/5 active:scale-[.98]">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: sc.bg }}>
                {sc.icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#EEF2F7]">{sc.label}</div>
                <div className="text-[10px] text-[#6B7685] mt-0.5">{sc.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* CALL STRIP */}
        <div className="flex items-center justify-between px-4 py-3 bg-red-500/6 border border-red-500/20 rounded-xl">
          <div className="text-[12px] text-[#6B7685]">
            Always available: <span className="text-[#EEF2F7] font-semibold">1122 Rescue</span>
          </div>
          <a href="tel:1122">
            <button className="px-4 py-2 bg-[#E63946] rounded-[8px] text-white text-[12px] font-bold">📞 Call</button>
          </a>
        </div>
      </div>

      <BottomNav active="emergency" />
    </div>
  )
}