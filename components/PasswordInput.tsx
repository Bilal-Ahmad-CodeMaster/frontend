'use client'

import { useState } from 'react'
import Inp from './Inp'



interface PasswordInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hasError?: boolean
  placeholder?: string
}

export default function PasswordInput({ 
  value, 
  onChange, 
  hasError, 
  placeholder = "Enter password" 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Inp
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        hasError={hasError}
        value={value}
        onChange={onChange}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
      >
        {showPassword ? '👁️' : '🙈'}
      </button>
    </div>
  )
}