'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'

type Severity = 'critical' | 'urgent' | 'minor' | null

interface TriageResult {
  severity: Severity
  type: string
  steps: string[]
}

function triageText(text: string): TriageResult {
  const t = text.toLowerCase()
  if (t.includes('heart') || t.includes('chest') || t.includes('attack')) {
    return { severity: 'critical', type: 'Heart Attack', steps: ['Call 1122', 'Loosen clothing', 'Start CPR if needed'] }
  }
  return { severity: 'minor', type: 'General Emergency', steps: ['Stay calm', 'Check breathing', 'Call 1122'] }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#+\s/g, '')
    .replace(/`(.*?)`/g, '$1')
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

    const cleanText = text.replace(/।/g, '.').replace(/\n/g, ' ')
    const u = new SpeechSynthesisUtterance(cleanText)

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()

      if (userLangRef.current === 'ur-PK') {
        const urduVoice =
          voices.find(v => v.lang === 'ur-PK') ||
          voices.find(v => v.lang.startsWith('ur')) ||
          voices.find(v => v.lang.startsWith('ar'))

        if (urduVoice) u.voice = urduVoice
        u.lang = 'ur-PK'
        u.rate = 0.75
      } else {
        const enVoice =
          voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
          voices.find(v => v.lang === 'en-US')
        if (enVoice) u.voice = enVoice
        u.lang = 'en-US'
        u.rate = 0.85
      }

      u.volume = 1
      u.onstart = () => setIsSpeaking(true)
      u.onend = () => setIsSpeaking(false)
      u.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(u)
    }

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    } else {
      loadVoices()
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  const callEmergencyAPI = async (text: string) => {
    setApiLoading(true)
    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data = await res.json()

      if (res.ok) {
        const rawGuidance = data.guidance || ''
        const cleanGuidance = stripMarkdown(rawGuidance)

        const steps = cleanGuidance
          .split('\n')
          .filter((s: string) => s.trim())
          .map((s: string) => stripMarkdown(s))

        setTriage({ severity: data.severity || 'minor', type: data.type || 'General', steps })

        userLangRef.current = data.language === 'ur' ? 'ur-PK' : 'en-US'
        speakText(cleanGuidance)
      }
    } catch {
      const result = triageText(text)
      setTriage(result)
      speakText(result.steps.join('. '))
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
    r.lang = 'ur-PK,en-US'

    r.onstart = () => { stopSpeaking() }

    r.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += t
          stopSpeaking()
        } else {
          interim += t
        }
      }
      setTranscript((final || interim).trim())
      if (final.trim()) {
        callEmergencyAPI(final.trim())
        r.stop()
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
      <nav className="flex items-center justify-between px-6 py-3.5 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md">
        <span className="text-xl font-extrabold tracking-tight">
          Ma<span className="text-[#E63946]">dad</span>
        </span>
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-lg active:scale-95"
          >
            <div className="w-2 h-2 bg-red-500 rounded-sm" />
            <span className="text-[10px] font-bold text-red-400">STOP VOICE</span>
          </button>
        )}
      </nav>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

        {/* SEVERITY DISPLAY */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${triage ? SEV_STYLES[triage.severity!] : 'border-[#1E2530] bg-[#0F1318]'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${triage ? SEV_DOT[triage.severity!] : 'bg-[#3D4855]'}`} />
          <span className={`text-[12px] font-semibold ${triage ? SEV_TEXT[triage.severity!] : 'text-[#6B7685]'}`}>
            {triage ? `${triage.severity?.toUpperCase()} — ${triage.type}` : 'System Standby'}
          </span>
        </div>

        {/* MIC BUTTON */}
        <div className="flex flex-col items-center gap-6 py-4">
          <button
            onClick={toggleMic}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              listening
                ? 'bg-red-600 scale-110 shadow-[0_0_50px_rgba(230,57,70,0.8)]'
                : 'bg-red-500'
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
              <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          </button>

          {/* Loading indicator */}
          {apiLoading && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          <p className="text-[13px] font-medium text-[#6B7685]">
            {listening ? 'Listening...' : isSpeaking ? 'Tap Mic to Interrupt' : apiLoading ? 'Processing...' : 'Tap to start'}
          </p>
        </div>

        {/* TRANSCRIPT */}
        <div className="px-4 py-3 bg-[#0F1318] border border-[#1E2530] rounded-2xl text-[13px] min-h-[50px] italic text-[#6B7685]">
          {transcript || 'Voice transcript will appear here...'}
        </div>

        {/* AI GUIDANCE STEPS */}
        {triage && (
          <div className="bg-[#0F1318] border border-[#1E2530] rounded-2xl p-4">
            <p className="text-[11px] font-bold text-[#E63946] uppercase mb-3">Emergency Steps</p>
            {triage.steps.map((s, i) => (
              <div key={i} className="flex gap-3 mb-2">
                <span className="text-red-500 font-bold text-[13px] shrink-0">{i + 1}.</span>
                <p className="text-[13px] text-[#EEF2F7] leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav active="emergency" />
    </div>
  )
}