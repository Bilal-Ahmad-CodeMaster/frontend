'use client'

import { useState } from 'react'
import Field from './Field'
import PasswordInput from './PasswordInput'
import Alert from './Alert'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  loading?: boolean
  error?: string
  success?: string
}

export default function LoginForm({ onSubmit, loading, error, success }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let hasError = false
    
    if (!email.includes('@')) {
      setEmailError('Enter a valid email')
      hasError = true
    } else {
      setEmailError('')
    }
    
    if (!password.trim()) {
      setPasswordError('Password is required')
      hasError = true
    } else {
      setPasswordError('')
    }
    
    if (!hasError) {
      onSubmit(email, password)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8">
      <Alert type="error" message={error || ''} />
      <Alert type="success" message={success || ''} />
      
      <Field label="Email Address" error={emailError}>
        <input
          type="email"
          placeholder="ali@example.com"
          className="w-full px-3.5 py-3 rounded-[10px] bg-[#141920] border border-[#1E2530] text-[13px] text-[#EEF2F7] placeholder-[#3D4855] outline-none focus:border-[#E63946]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      
      <Field label="Password" error={passwordError}>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hasError={!!passwordError}
        />
      </Field>
      
      <div className="flex justify-end -mt-2">
        <button type="button" className="text-[11px] text-[#6B7685] hover:text-[#E63946]">
          Forgot password?
        </button>
      </div>
      
      <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E63946] hover:bg-[#c0303c] disabled:bg-[#3D4855] text-white font-bold text-[13px] tracking-wider rounded-[10px] transition-all disabled:cursor-not-allowed">
        {loading ? '⏳ Signing in…' : 'Sign In to Madad'}
      </button>
      
      <p className="text-center text-[12px] text-[#6B7685]">
        No account? <button type="button" className="text-[#E63946] font-semibold hover:underline">Register here →</button>
      </p>
    </form>
  )
}