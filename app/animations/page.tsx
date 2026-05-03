'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'

const ANIMATIONS = [
  {
    id: 'cpr',
    title: 'CPR',
    subtitle: 'Cardiopulmonary Resuscitation',
    description: 'Perform chest compressions and rescue breaths to restore circulation in cardiac arrest.',
    steps: [
      'Place heel of hand on center of chest',
      'Push down hard and fast — 100–120 per minute',
      'Give 2 rescue breaths after every 30 compressions',
      'Continue until help arrives',
    ],
    gif: 'cpr.mp4',
    color: '#E63946',
    bg: 'rgba(230,57,70,0.1)',
    border: 'rgba(230,57,70,0.25)',
    icon: '❤️',
    tag: 'CRITICAL',
    tagColor: '#E63946',
  },
  {
    id: 'bleeding',
    title: 'Bleeding Control',
    subtitle: 'Severe Wound Management',
    description: 'Apply direct pressure and use tourniquets to stop life-threatening bleeding.',
    steps: [
      'Apply firm direct pressure with clean cloth',
      'Do not remove cloth — add more if soaked',
      'Elevate the injured limb above heart level',
      'Apply tourniquet 2 inches above wound if needed',
    ],
    gif: 'bleeding.mp4',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.1)',
    border: 'rgba(220,38,38,0.25)',
    icon: '🩸',
    tag: 'URGENT',
    tagColor: '#f59e0b',
  },
  {
    id: 'choking',
    title: 'Choking Rescue',
    subtitle: 'Heimlich Maneuver',
    description: 'Clear an obstructed airway using abdominal thrusts to dislodge foreign objects.',
    steps: [
      'Stand behind person — wrap arms around waist',
      'Make fist with one hand above navel',
      'Give 5 firm upward thrusts',
      'Repeat until object is expelled',
    ],
    gif: 'choking.mp4',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.25)',
    icon: '🤧',
    tag: 'CRITICAL',
    tagColor: '#E63946',
  },
  {
    id: 'burns',
    title: 'Burn Treatment',
    subtitle: 'Thermal & Chemical Burns',
    description: 'Cool the burn area and protect against infection to reduce tissue damage.',
    steps: [
      'Cool burn under cold running water for 20 minutes',
      'Do NOT use ice, butter, or toothpaste',
      'Cover loosely with clean non-fluffy material',
      'Remove jewellery near burn area carefully',
    ],
    gif: 'burns.mp4',
    color: '#ea580c',
    bg: 'rgba(234,88,12,0.1)',
    border: 'rgba(234,88,12,0.25)',
    icon: '🔥',
    tag: 'URGENT',
    tagColor: '#f59e0b',
  },
  {
    id: 'fracture',
    title: 'Fracture Support',
    subtitle: 'Bone Fracture Stabilization',
    description: 'Immobilize broken bones to prevent further injury and manage pain until help arrives.',
    steps: [
      'Do not attempt to straighten the limb',
      'Immobilize above and below the fracture',
      'Apply padding around the injury',
      'Use a splint or firm support to hold in place',
    ],
    gif: 'fracture.mp4',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.1)',
    border: 'rgba(8,145,178,0.25)',
    icon: '🦴',
    tag: 'MODERATE',
    tagColor: '#22c55e',
  },
]

function VideoDisplay({
  gif, title, color, large = false,
}: { gif: string; title: string; color: string; large?: boolean }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const size = large ? 'h-64' : 'h-40'

  return (
    <div className={`relative w-full ${size} rounded-xl overflow-hidden bg-[#0a0d12] flex items-center justify-center`}>
      {!error ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${color} transparent transparent transparent` }}
              />
            </div>
          )}
          <video
            src={`/assets/animations/${gif}`}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadedData={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: `${color}20`, border: `1px solid ${color}40` }}
          >
            {ANIMATIONS.find(a => a.gif === gif)?.icon || '🩺'}
          </div>
          <p className="text-[11px] text-[#3D4855] text-center font-mono leading-relaxed">
            Add video to:<br />
            <span style={{ color }} className="font-semibold">
              public/assets/animations/{gif}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

function DetailModal({ item, onClose }: { item: typeof ANIMATIONS[0]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        className="w-full max-w-lg bg-[#0F1318] border border-[#1E2530] rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '90vh', animation: 'slideUp .3s ease both' }}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#2A3340]" />
        </div>

        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(90vh - 24px)' }}>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: item.bg, border: `1px solid ${item.border}` }}
              >
                {item.icon}
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#EEF2F7]">{item.title}</h2>
                <p className="text-[11px] text-[#6B7685]">{item.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1E2530] flex items-center justify-center text-[#6B7685] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <VideoDisplay gif={item.gif} title={item.title} color={item.color} large />

          <div className="mt-4 flex items-center gap-3">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${item.tagColor}20`, color: item.tagColor, border: `1px solid ${item.tagColor}40` }}
            >
              {item.tag}
            </span>
            <span className="text-[11px] text-[#6B7685]">First Aid Priority</span>
          </div>

          <p className="mt-3 text-[13px] text-[#6B7685] leading-relaxed">{item.description}</p>

          <div className="mt-5">
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#3D4855] mb-3">Step-by-Step</p>
            <div className="flex flex-col gap-2.5">
              {item.steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start px-3 py-3 rounded-xl bg-[#141920] border border-[#1E2530]">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-[#EEF2F7] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-5 flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.18)' }}
          >
            <span className="text-[12px] text-[#6B7685]">
              Need help now? <span className="text-[#EEF2F7] font-semibold">1122 Rescue</span>
            </span>
            <a href="tel:1122">
              <button className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold" style={{ background: '#E63946' }}>
                📞 Call
              </button>
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function AnimationsPage() {
  const [selected, setSelected] = useState<typeof ANIMATIONS[0] | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'URGENT' | 'MODERATE'>('ALL')

  const filtered = filter === 'ALL' ? ANIMATIONS : ANIMATIONS.filter(a => a.tag === filter)

  return (
    <div
      className="flex flex-col h-screen bg-[#080B0F] text-[#EEF2F7] overflow-hidden"
      style={{
        fontFamily: "'Sora', sans-serif",
        backgroundImage: 'linear-gradient(rgba(230,57,70,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.02) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-3.5 border-b border-[#1E2530] bg-[#080B0F]/95 backdrop-blur-md flex-shrink-0">
        <span className="text-xl font-extrabold tracking-tight">
          Ma<span className="text-[#E63946]">dad</span>
        </span>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-green-400">ACTIVE</span>
        </div>
      </nav>

      {/* HEADER */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-[20px] font-bold tracking-tight">
          First Aid <span className="text-[#E63946]">Animations</span>
        </h1>
        <p className="text-[12px] text-[#6B7685] mt-1">Visual step-by-step emergency guides</p>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {(['ALL', 'CRITICAL', 'URGENT', 'MODERATE'] as const).map(f => {
            const colors: Record<string, string> = {
              ALL: '#E63946', CRITICAL: '#E63946', URGENT: '#f59e0b', MODERATE: '#22c55e',
            }
            const isOn = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-shrink-0 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: isOn ? `${colors[f]}20` : '#0F1318',
                  border: `1px solid ${isOn ? colors[f] : '#1E2530'}`,
                  color: isOn ? colors[f] : '#6B7685',
                }}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="text-left bg-[#0F1318] border border-[#1E2530] rounded-2xl overflow-hidden transition-all active:scale-[.97]"
              style={{ animation: `fadeIn .3s ease ${i * 0.06}s both` }}
            >
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

              <div className="w-full h-36 bg-[#0a0d12] overflow-hidden">
                <VideoDisplay gif={item.gif} title={item.title} color={item.color} />
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] font-bold text-[#EEF2F7]">{item.title}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${item.tagColor}20`, color: item.tagColor }}
                  >
                    {item.tag}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7685] leading-relaxed line-clamp-2">{item.description}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: item.bg }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-[#3D4855]">{item.steps.length} steps</span>
                  <span className="ml-auto text-[10px]" style={{ color: item.color }}>View →</span>
                </div>
              </div>
            </button>
          ))}
        </div>

      
      </div>

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}

      <BottomNav active="animations" />
    </div>
  )
}