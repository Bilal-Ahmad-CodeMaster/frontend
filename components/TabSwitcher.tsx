interface TabSwitcherProps {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
}

export default function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex border-b border-[#1E2530]">
      <button
        onClick={() => onTabChange('login')}
        className={`flex-1 py-4 text-[12px] font-semibold tracking-widest uppercase transition-all ${
          activeTab === 'login'
            ? 'text-[#E63946] border-b-2 border-[#E63946] bg-red-500/3'
            : 'text-[#6B7685] border-b-2 border-transparent hover:text-[#EEF2F7]'
        }`}
      >
        Sign In
      </button>
      <button
        onClick={() => onTabChange('register')}
        className={`flex-1 py-4 text-[12px] font-semibold tracking-widest uppercase transition-all ${
          activeTab === 'register'
            ? 'text-[#E63946] border-b-2 border-[#E63946] bg-red-500/3'
            : 'text-[#6B7685] border-b-2 border-transparent hover:text-[#EEF2F7]'
        }`}
      >
        Register
      </button>
    </div>
  )
}