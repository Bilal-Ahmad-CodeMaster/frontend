'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'
import Navbar from '@/components/NavBar'

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

// ── Severity design tokens ────────────────────────────────────────────────────
const SEV_CONFIG = {
  critical: {
    bgGradient:   'radial-gradient(ellipse at 50% 20%, rgba(220,20,30,0.60) 0%, rgba(140,0,10,0.35) 38%, rgba(8,11,15,0.97) 72%)',
    topBleed:     'rgba(255,30,40,0.50)',
    bottomBleed:  'rgba(180,0,15,0.32)',
    vigBg:        'radial-gradient(ellipse at center, transparent 42%, rgba(200,0,10,0.42) 100%)',
    pulseSpeed:   '1.4s',
    statusBorder: 'border-red-500/70', statusBg: 'bg-red-500/15', statusText: 'text-red-300',
    dotColor: '#EF4444', dotGlow: '0 0 14px 5px rgba(230,57,70,0.95)',
    micGlow: '0 0 90px 35px rgba(230,57,70,0.55), 0 0 180px 70px rgba(180,0,10,0.28)',
    micBg: 'bg-red-600', ringColor: 'rgba(230,57,70,',
    cardBg: 'bg-red-950/35', cardBorder: 'border-red-500/30', accentText: 'text-red-300',
    badge: 'CALL 1122', badgeStyle: 'text-red-300 bg-red-500/20 border-red-500/40', label: 'CRITICAL',
  },
  urgent: {
    bgGradient:   'radial-gradient(ellipse at 50% 20%, rgba(200,120,0,0.50) 0%, rgba(140,80,0,0.28) 38%, rgba(8,11,15,0.97) 72%)',
    topBleed:     'rgba(245,160,0,0.40)', bottomBleed: 'rgba(180,100,0,0.25)',
    vigBg:        'radial-gradient(ellipse at center, transparent 48%, rgba(180,90,0,0.32) 100%)',
    pulseSpeed:   '2.2s',
    statusBorder: 'border-amber-500/70', statusBg: 'bg-amber-500/12', statusText: 'text-amber-300',
    dotColor: '#F59E0B', dotGlow: '0 0 14px 5px rgba(245,158,11,0.95)',
    micGlow: '0 0 90px 35px rgba(245,158,11,0.45), 0 0 180px 70px rgba(180,100,0,0.22)',
    micBg: 'bg-amber-600', ringColor: 'rgba(245,158,11,',
    cardBg: 'bg-amber-950/28', cardBorder: 'border-amber-500/25', accentText: 'text-amber-300',
    badge: 'SEEK HELP', badgeStyle: 'text-amber-300 bg-amber-500/20 border-amber-500/40', label: 'URGENT',
  },
  minor: {
    bgGradient:   'radial-gradient(ellipse at 50% 20%, rgba(20,160,70,0.40) 0%, rgba(10,100,40,0.22) 38%, rgba(8,11,15,0.97) 72%)',
    topBleed:     'rgba(34,197,94,0.32)', bottomBleed: 'rgba(10,140,50,0.20)',
    vigBg:        'radial-gradient(ellipse at center, transparent 52%, rgba(10,130,45,0.25) 100%)',
    pulseSpeed:   '3.5s',
    statusBorder: 'border-green-500/70', statusBg: 'bg-green-500/12', statusText: 'text-green-300',
    dotColor: '#22C55E', dotGlow: '0 0 14px 5px rgba(34,197,94,0.95)',
    micGlow: '0 0 90px 35px rgba(34,197,94,0.38), 0 0 180px 70px rgba(10,140,50,0.20)',
    micBg: 'bg-green-600', ringColor: 'rgba(34,197,94,',
    cardBg: 'bg-green-950/22', cardBorder: 'border-green-500/22', accentText: 'text-green-300',
    badge: 'STABLE', badgeStyle: 'text-green-300 bg-green-500/20 border-green-500/40', label: 'MINOR',
  },
}

const DEFAULT = {
  bgGradient: 'none', topBleed: 'transparent', bottomBleed: 'transparent',
  vigBg: 'none', pulseSpeed: '0s',
  statusBorder: 'border-[#1E2530]', statusBg: 'bg-[#0F1318]',
  statusText: 'text-[#6B7685]', dotColor: '#3D4855', dotGlow: 'none',
  micGlow: '0 0 60px 20px rgba(230,57,70,0.30)', micBg: 'bg-red-500',
  ringColor: 'rgba(230,57,70,', cardBg: 'bg-[#11161D]/80',
  cardBorder: 'border-[#1E2530]', accentText: 'text-red-400',
  badge: '', badgeStyle: '', label: '',
}

// ── TTS Engine priority: ElevenLabs → Edge TTS API → Browser fallback ─────────
//
// HOW TO SET UP:
//
// 1. ElevenLabs (best quality, paid but has free tier):
//    - Sign up at https://elevenlabs.io
//    - Get API key from your profile
//    - Add to .env.local:  ELEVENLABS_API_KEY=your_key_here
//    - Voice IDs: "21m00Tcm4TlvDq8ikWAM" = Rachel (English)
//                 "pNInz6obpgDQGcFmaJgB" = Adam (English, clear)
//
// 2. Edge TTS (FREE — Microsoft Azure neural voices):
//    - No API key needed for the unofficial endpoint
//    - Supports: en-US-AriaNeural, ur-PK-UzmaNeural (Urdu!)
//    - Route it through your Next.js API to avoid CORS
//
// 3. Browser Web Speech API (always-available fallback)
//
// ─────────────────────────────────────────────────────────────────────────────

type TTSProvider = 'elevenlabs' | 'edge' | 'browser'

interface TTSOptions {
  text: string
  language: 'en' | 'ur'
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: string) => void
}

// Voice map per language
const ELEVENLABS_VOICES = {
  en: 'pNInz6obpgDQGcFmaJgB', // Adam — clear, calm, authoritative
  ur: '21m00Tcm4TlvDq8ikWAM', // Rachel — closest to neutral for Roman Urdu
}

const EDGE_VOICES = {
  en: 'en-US-AriaNeural',   // Natural, warm female voice
  ur: 'ur-PK-UzmaNeural',   // Native Urdu female voice
}

export function useTTS() {
  const audioRef      = useRef<HTMLAudioElement | null>(null)
  const [speaking, setSpeaking]   = useState(false)
  const [provider, setProvider]   = useState<TTSProvider>('browser')
  const [ttsError, setTtsError]   = useState<string | null>(null)

  // Stop any active audio
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }

  // ── ElevenLabs TTS ─────────────────────────────────────────────────────────
  const speakElevenLabs = async (opts: TTSOptions): Promise<boolean> => {
    try {
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: opts.text,
          voiceId: ELEVENLABS_VOICES[opts.language],
        }),
      })
      if (!res.ok) return false

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay  = () => { setSpeaking(true);  opts.onStart?.() }
      audio.onended = () => { setSpeaking(false); opts.onEnd?.(); URL.revokeObjectURL(url) }
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url) }

      await audio.play()
      return true
    } catch {
      return false
    }
  }

  // ── Edge TTS (Microsoft neural voices, free) ───────────────────────────────
  const speakEdgeTTS = async (opts: TTSOptions): Promise<boolean> => {
    try {
      const res = await fetch('/api/tts/edge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: opts.text,
          voice: EDGE_VOICES[opts.language],
        }),
      })
      if (!res.ok) return false

      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay  = () => { setSpeaking(true);  opts.onStart?.() }
      audio.onended = () => { setSpeaking(false); opts.onEnd?.(); URL.revokeObjectURL(url) }
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url) }

      await audio.play()
      return true
    } catch {
      return false
    }
  }

  // ── Browser Web Speech API (fallback, always works) ───────────────────────
  const speakBrowser = (opts: TTSOptions) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const langMap = { en: 'en-US', ur: 'ur-PK' }
    const u = new SpeechSynthesisUtterance(opts.text)
    const voices = window.speechSynthesis.getVoices()

    // Best available voice selection
    const preferred =
      voices.find(v => v.lang === langMap[opts.language] && v.name.includes('Google')) ||
      voices.find(v => v.lang === langMap[opts.language]) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0]

    if (preferred) u.voice = preferred
    u.lang  = langMap[opts.language]
    u.rate  = 0.82   // slightly slower — clearer in emergencies
    u.pitch = 1.0
    u.volume = 1.0

    u.onstart = () => { setSpeaking(true);  opts.onStart?.() }
    u.onend   = () => { setSpeaking(false); opts.onEnd?.() }
    u.onerror = (e) => { setSpeaking(false); opts.onError?.(e.error) }

    window.speechSynthesis.speak(u)
  }

  // ── Main speak function — tries providers in priority order ───────────────
  const speak = async (opts: TTSOptions) => {
    stop()
    setTtsError(null)
    opts.onStart?.()
    setSpeaking(true)

    // 1. Try ElevenLabs first (highest quality)
    const elOk = await speakElevenLabs(opts)
    if (elOk) { setProvider('elevenlabs'); return }

    // 2. Fall back to Edge TTS (free Microsoft neural voices)
    const edgeOk = await speakEdgeTTS(opts)
    if (edgeOk) { setProvider('edge'); return }

    // 3. Last resort: browser built-in
    setProvider('browser')
    speakBrowser(opts)
  }

  return { speak, stop, speaking, provider, ttsError }
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [triage, setTriage]         = useState<TriageResult | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const { speak, stop, speaking: isSpeaking, provider } = useTTS()
  const recognitionRef  = useRef<any>(null)
  const detectedLangRef = useRef<'en' | 'ur'>('en')

  const sev = triage?.severity ?? null
  const cfg = sev ? SEV_CONFIG[sev] : DEFAULT

  const callEmergencyAPI = async (text: string) => {
    setApiLoading(true); setTriage(null)
    try {
      const res  = await fetch('/api/emergency', {
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

        const lang: 'en' | 'ur' = data.language === 'ur' ? 'ur' : 'en'
        detectedLangRef.current = lang

        setTriage({ severity: data.severity, type: data.type, steps })

        // Speak with best available TTS
        speak({
          text: stripMarkdown(rawGuidance),
          language: lang,
        })
      }
    } catch (err) { console.error('API Error', err) }
    finally { setApiLoading(false) }
  }

  const setupRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return null
    const r = new SR()
    r.continuous = false; r.interimResults = true; r.lang = 'en-US'
    r.onresult = (e: any) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) final += e.results[i][0].transcript
      if (final) { setTranscript(final); callEmergencyAPI(final) }
    }
    r.onend = () => setListening(false)
    return r
  }

  const toggleMic = () => {
    if (listening) { recognitionRef.current?.stop() }
    else {
      stop()
      const r = setupRecognition()
      if (r) { recognitionRef.current = r; r.start(); setListening(true) }
    }
  }

  // TTS provider badge label
  const providerLabel: Record<TTSProvider, string> = {
    elevenlabs: '⚡ ElevenLabs',
    edge:       '🔷 Edge Neural',
    browser:    '🔈 Browser',
  }

  return (
    <div className="relative flex flex-col h-screen font-['Sora'] text-[#EEF2F7] overflow-hidden">

      {/* ── Background layers ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[#080B0F]" />
      <div className="absolute inset-0 transition-all duration-700" style={{ background: cfg.bgGradient }} />
      <div className="absolute top-0 left-0 w-[60%] h-[50%] transition-all duration-700"
        style={{ background: `radial-gradient(ellipse at top left, ${cfg.topBleed} 0%, transparent 65%)` }} />
      <div className="absolute bottom-0 right-0 w-[55%] h-[45%] transition-all duration-700"
        style={{ background: `radial-gradient(ellipse at bottom right, ${cfg.bottomBleed} 0%, transparent 65%)` }} />
      {sev && (
        <div className="absolute inset-0"
          style={{ background: cfg.vigBg, animation: `vignettePulse ${cfg.pulseSpeed} ease-in-out infinite` }} />
      )}
      {sev === 'critical' && (
        <div className="absolute top-0 left-0 right-0 h-[3px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,60,60,0.9) 30%, rgba(255,100,100,1) 50%, rgba(255,60,60,0.9) 70%, transparent 100%)',
            animation: 'barFlash 1.4s ease-in-out infinite',
          }} />
      )}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 4px)' }} />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        {/* TTS status bar */}
        {isSpeaking && (
          <div className="mx-5 mt-2 flex items-center gap-2">
            {/* Animated waveform */}
            <div className="flex items-end gap-[3px] h-5">
              {[1,2,3,2,1,3,2,1].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] bg-red-400 rounded-full"
                  style={{ animation: `waveBar${(i % 3) + 1} ${0.5 + i * 0.07}s ease-in-out infinite` }}
                />
              ))}
            </div>
            <span className="text-[11px] text-red-300 font-bold tracking-wider">
              {providerLabel[provider]} · Speaking
            </span>
            <button
              onClick={stop}
              className="ml-auto text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/40 px-2.5 py-1 rounded-lg active:scale-95"
            >
              STOP
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-24">

          {/* Severity bar */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-500 ${cfg.statusBorder} ${cfg.statusBg}`}>
            <div className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: cfg.dotColor, boxShadow: cfg.dotGlow,
                animation: sev ? `dotPulse ${cfg.pulseSpeed} ease-in-out infinite` : 'none',
              }} />
            <span className={`text-[12px] font-black uppercase tracking-widest ${cfg.statusText}`}>
              {triage ? `${cfg.label} — ${triage.type}` : 'System Standby...'}
            </span>
            {sev && (
              <span
                className={`ml-auto text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border ${cfg.badgeStyle}`}
                style={sev === 'critical' ? { animation: 'barFlash 1.4s ease-in-out infinite' } : {}}
              >
                {cfg.badge}
              </span>
            )}
          </div>

          {/* Mic area */}
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative flex items-center justify-center">
              {sev && [200, 168, 144].map((size, i) => (
                <div key={size} className="absolute rounded-full" style={{
                  width: size, height: size,
                  border: `1px solid ${cfg.ringColor}${0.18 + i * 0.12})`,
                  animation: `ringExpand ${cfg.pulseSpeed} ease-out infinite ${i * 0.18}s`,
                }} />
              ))}
              <button
                onClick={toggleMic}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${listening ? 'scale-110' : 'hover:scale-105'} ${listening ? 'bg-red-600' : cfg.micBg}`}
                style={{ boxShadow: listening ? '0 0 110px 45px rgba(230,57,70,0.55)' : cfg.micGlow }}
              >
                {listening ? (
                  <div className="flex gap-1 items-end h-10">
                    {['bar1','bar2','bar3','bar2','bar1'].map((cls, i) => (
                      <span key={i} className={`w-1.5 bg-white rounded-full animate-${cls}`} />
                    ))}
                  </div>
                ) : (
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold tracking-tight">
                {listening ? 'Listening...' : apiLoading ? 'Analyzing...' : 'Emergency? Speak Now'}
              </h2>
              <p className="text-sm text-[#6B7685] mt-1 font-medium">
                {isSpeaking ? `Voice: ${providerLabel[provider]}` : 'Urdu ya English mein batayein'}
              </p>
            </div>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className={`px-5 py-4 backdrop-blur-md border rounded-2xl animate-in fade-in zoom-in-95 ${cfg.cardBg} ${cfg.cardBorder}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${cfg.accentText}`}>Live Transcript</p>
              <p className="text-[14px] italic text-[#EEF2F7] leading-relaxed">"{transcript}"</p>
            </div>
          )}

          {/* Instructions */}
          {triage && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-black text-[#6B7685] uppercase tracking-widest">Medical Instructions</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg.cardBorder} ${cfg.accentText} ${cfg.cardBg}`}>
                  LIVE GUIDE
                </span>
              </div>
              {triage.steps.map((step, idx) => {
                const [title, desc] = step.includes(':') ? step.split(':') : [null, step]
                return (
                  <div key={idx} className={`backdrop-blur-md border p-5 rounded-2xl shadow-xl shadow-black/50 ${cfg.cardBg} ${cfg.cardBorder}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${cfg.cardBg} ${cfg.cardBorder} ${cfg.accentText}`}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col gap-1">
                        {title && <h3 className={`font-bold text-[15px] uppercase tracking-tight ${cfg.accentText}`}>{title.trim()}</h3>}
                        <p className="text-[14px] leading-relaxed text-[#EEF2F7] font-medium opacity-90">{desc?.trim() || step}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <BottomNav active="emergency" />
      </div>

      <style jsx>{`
        @keyframes vignettePulse { 0%,100%{opacity:0.30} 50%{opacity:1.00} }
        @keyframes barFlash      { 0%,100%{opacity:0.45} 50%{opacity:1.00} }
        @keyframes dotPulse      { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
        @keyframes ringExpand    { 0%{transform:scale(0.88);opacity:0.85} 50%{transform:scale(1.10);opacity:0.25} 100%{transform:scale(0.88);opacity:0.85} }
        @keyframes bar1  { 0%,100%{height:12px} 50%{height:26px} }
        @keyframes bar2  { 0%,100%{height:22px} 50%{height:38px} }
        @keyframes bar3  { 0%,100%{height:30px} 50%{height:44px} }
        @keyframes waveBar1 { 0%,100%{height:6px}  50%{height:18px} }
        @keyframes waveBar2 { 0%,100%{height:10px} 50%{height:20px} }
        @keyframes waveBar3 { 0%,100%{height:14px} 50%{height:20px} }
        .animate-bar1 { animation: bar1 0.7s ease-in-out infinite; }
        .animate-bar2 { animation: bar2 0.7s ease-in-out infinite 0.15s; }
        .animate-bar3 { animation: bar3 0.7s ease-in-out infinite 0.30s; }
      `}</style>
    </div>
  )
}