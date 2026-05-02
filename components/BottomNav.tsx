'use client'

import { useRouter } from 'next/navigation'

interface BottomNavProps {
  active: 'emergency' | 'dispatch' | 'history' | 'profile'
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter()

  const navItems = [
    { id: 'emergency', label: 'Emergency', icon: '🆘', path: '/dashboard' },
    { id: 'dispatch', label: 'Dispatch', icon: '🚨', path: '/dispatch' },
    { id: 'history', label: 'History', icon: '📋', path: '/history' },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
  ]

  return (
    <div className="flex items-center justify-around px-4 py-2 bg-[#0F1318] border-t border-[#1E2530] flex-shrink-0">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(item.path)}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
            active === item.id
              ? 'text-[#E63946]'
              : 'text-[#6B7685] hover:text-[#EEF2F7]'
          }`}
        >
          <span className="text-[20px]">{item.icon}</span>
          <span className="text-[10px] font-semibold tracking-wider">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}