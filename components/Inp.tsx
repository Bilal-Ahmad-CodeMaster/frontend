// components/Inp.tsx
import { InputHTMLAttributes } from 'react'

interface InpProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export default function Inp({ hasError, className = '', ...rest }: InpProps) {
  return (
    <input
      {...rest}
      className={`
        w-full 
        px-3.5 
        py-3 
        rounded-[10px] 
        bg-[#141920] 
        border 
        text-[13px] 
        font-['Sora'] 
        text-[#EEF2F7] 
        placeholder-[#3D4855] 
        outline-none 
        transition-all
        ${hasError 
          ? 'border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.12)]' 
          : 'border-[#1E2530] focus:border-[#E63946] focus:shadow-[0_0_0_3px_rgba(230,57,70,0.15)] hover:bg-[#181F28]'
        }
        ${className}
      `}
    />
  )
}