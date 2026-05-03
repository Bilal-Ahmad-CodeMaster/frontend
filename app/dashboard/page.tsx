'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'

type Severity = 'critical' | 'urgent' | 'minor' | null

interface TriageResult {
  severity: Severity
  type: string
  steps: string[]
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#+\s/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/[0-9]+\.\s/g, '')
    .trim()
}

const SEV_STYLES: Record<string, string> = { critical: 'border-red-500/40 bg-red-500/6', urgent: 'border-amber-500/40 bg-amber-500/6', minor: 'border-green-500/40 bg-green-500/6' }
const SEV_DOT: Record<string, string> = { critical: 'bg-red-500 shadow-[0_0_8px_#E63946]', urgent: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]', minor: 'bg-green-500 shadow-[0_0_8px_#22c55e]' }
const SEV_TEXT: Record<string, string> = { critical: 'text-red-400', urgent: 'text-amber-400', minor: 'text-green-400' }

export default function DashboardPage() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [triage, setTriage] = useState<TriageResult | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const userLangRef = useRef<'ur-PK' | 'en-US'>('en-US')

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    stopSpeaking()

    // Speech ko natural banane ke liye clean-up
    const naturalText = text.replace(/\[|\]/g, '').replace(/:/g, '... ')
    const u = new SpeechSynthesisUtterance(naturalText)

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const isUrdu = userLangRef.current === 'ur-PK'

      // Roman Urdu ke liye English voice natural lagti hai
      const bestVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0]

      if (bestVoice) u.voice = bestVoice
      u.lang = userLangRef.current
      u.rate = 0.85; // Thoda slow taake instruction saaf samajh aaye
      u.pitch = 1.0;
      u.onstart = () => setIsSpeaking(true)
      u.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(u)
    }

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    } else {
      loadVoices()
    }
  }

  const callEmergencyAPI = async (text: string) => {
    setApiLoading(true)
    setTriage(null)

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data = await res.json()

      if (res.ok) {
        const rawGuidance = data.guidance || ''
        const steps = rawGuidance
          .split('\n')
          .filter((s: string) => s.trim().length > 5)
          .map((s: string) => stripMarkdown(s))

        setTriage({ severity: data.severity, type: data.type, steps })
        userLangRef.current = data.language === 'ur' ? 'ur-PK' : 'en-US'
        speakText(stripMarkdown(rawGuidance))
      }
    } catch (err) {
      console.error("API Error", err)
    } finally {
      setApiLoading(false)
    }
  }

  const setupRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return null

    const r = new SR()
    r.continuous = false
    r.interimResults = true
    r.lang = 'en-US'

    r.onresult = (e: any) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
      }
      if (final) {
        setTranscript(final)
        callEmergencyAPI(final)
      }
    }
    r.onend = () => setListening(false)
    return r
  }

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop()
    } else {
      stopSpeaking()
      const r = setupRecognition()
      if (r) {
        recognitionRef.current = r
        r.start()
        setListening(true)
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#080B0F] font-['Sora'] text-[#EEF2F7] overflow-hidden">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md z-10">
        <span className="text-xl font-extrabold tracking-tight">
          Ma<span className="text-[#E63946]">dad</span>
        </span>
        {isSpeaking && (
          <button onClick={stopSpeaking} className="animate-pulse flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-lg active:scale-95">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-[10px] font-bold text-red-400 tracking-widest">STOP VOICE</span>
          </button>
        )}
      </nav>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-24">

        {/* Severity Status Agent */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${triage ? SEV_STYLES[triage.severity!] : 'border-[#1E2530] bg-[#0F1318]'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${triage ? SEV_DOT[triage.severity!] + ' animate-pulse' : 'bg-[#3D4855]'}`} />
          <span className={`text-[12px] font-bold uppercase tracking-wider ${triage ? SEV_TEXT[triage.severity!] : 'text-[#6B7685]'}`}>
            {triage ? `${triage.severity} — ${triage.type}` : 'System Standby...'}
          </span>
        </div>

        {/* Interaction Agent */}
        <div className="flex flex-col items-center gap-6 py-4">
          <button
            onClick={toggleMic}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${listening
              ? 'bg-red-600 scale-105 shadow-[0_0_80px_rgba(230,57,70,0.4)]'
              : 'bg-red-500 hover:bg-red-600 shadow-2xl'
              }`}
          >
            {listening ? (
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-8 bg-white rounded-full animate-quiet" />
                <span className="w-1.5 h-12 bg-white rounded-full animate-loud" />
                <span className="w-1.5 h-8 bg-white rounded-full animate-quiet" />
              </div>
            ) : (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
            )}
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">
              {listening ? 'Listening...' : apiLoading ? 'Analyzing...' : 'Emergency? Speak Now'}
            </h2>
            <p className="text-sm text-[#6B7685] mt-1 font-medium">
              {isSpeaking ? 'Listening to Madad AI...' : 'Urdu ya English mein batayein'}
            </p>
          </div>
        </div>

        {/* Transcript Box */}
        {transcript && (
          <div className="px-5 py-4 bg-[#0F1318] border border-[#1E2530] rounded-2xl animate-in fade-in zoom-in-95">
            <p className="text-[10px] text-[#E63946] font-black uppercase tracking-widest mb-1">Live Transcript</p>
            <p className="text-[14px] italic text-[#EEF2F7] leading-relaxed">"{transcript}"</p>
          </div>
        )}

        {/* Detailed First Aid Agent (Instruction Cards) */}
        {triage && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-black text-[#6B7685] uppercase tracking-widest">Medical Instructions</p>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">LIVE GUIDE</span>
            </div>

            {triage.steps.map((step, idx) => {
              const [title, desc] = step.includes(':') ? step.split(':') : [null, step];
              return (
                <div key={idx} className="bg-[#11161D] border border-[#1E2530] p-5 rounded-2xl shadow-xl shadow-black/40">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-black text-sm shrink-0 border border-red-500/20">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      {title && <h3 className="text-red-400 font-bold text-[15px] uppercase tracking-tight">{title.trim()}</h3>}
                      <p className="text-[14px] leading-relaxed text-[#EEF2F7] font-medium opacity-90">
                        {desc?.trim() || step}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav active="emergency" />

      <style jsx>{`
        @keyframes quiet { 0%, 100% { height: 20px; } 50% { height: 40px; } }
        @keyframes loud { 0%, 100% { height: 30px; } 50% { height: 60px; } }
        .animate-quiet { animation: quiet 0.8s ease-in-out infinite; }
        .animate-loud { animation: loud 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  )
}