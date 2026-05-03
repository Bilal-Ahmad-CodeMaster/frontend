'use client'

import { useRouter } from 'next/navigation'

interface Props {
  active: 'emergency' | 'dispatch' | 'animations'
}

export default function BottomNav({ active }: Props) {
  const router = useRouter()

  const items = [
    {
      key: 'emergency',
      label: 'Emergency',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      key: 'dispatch',
      label: 'Dispatch',
      path: '/dispatch',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
    {
      key: 'animations',
      label: 'First Aid',
      path: '/animations',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex border-t border-[#1E2530] bg-[#080B0F]/97 backdrop-blur-2xl flex-shrink-0">
      {items.map(item => {
        const isOn = active === item.key
        return (
          <button
            key={item.key}
            onClick={() => router.push(item.path)}
            className={`flex-1 flex flex-col items-center py-3 gap-1.5 border-t-2 transition-all cursor-pointer bg-transparent border-b-0 border-l-0 border-r-0
              ${isOn ? 'border-[#E63946]' : 'border-transparent'}`}
          >
            <span style={{ stroke: isOn ? '#E63946' : '#6B7685', transition: 'stroke .2s' }}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-semibold tracking-widest uppercase transition-colors ${isOn ? 'text-[#E63946]' : 'text-[#6B7685]'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}