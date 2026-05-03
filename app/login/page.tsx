'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RegisterForm {
    firstName: string; lastName: string; email: string; phone: string
    ecName: string; ecPhone: string ;bloodGroup: string
    password: string; confirmPassword: string; agreed: boolean
}
interface LoginForm { email: string; password: string }
type Errors = Record<string, string>

const BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
]
const isEmail = (v: string) => v.includes('@') && v.includes('.')
const isPKPhone = (v: string) => /^3\d{9}$/.test(v.trim())

function validateRegister(f: RegisterForm): Errors {
    const e: Errors = {}
    if (!f.firstName.trim()) e.firstName = 'First name is required'
    if (!f.lastName.trim()) e.lastName = 'Last name is required'
    if (!isEmail(f.email)) e.email = 'Enter a valid email'
    if (!isPKPhone(f.phone)) e.phone = 'Enter 10 digits e.g. 3001234567'

    if (!f.ecName.trim()) e.ecName = 'Emergency contact name required'
    if (!f.ecPhone.trim()) e.ecPhone = 'Emergency contact phone required'
    if (f.password.length < 8) e.password = 'Minimum 8 characters'
    if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
}

function getStrength(pw: string) {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return { score: s, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][s], color: ['', '#f87171', '#fb923c', '#facc15', '#22c55e'][s] }
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7685]">{label}</label>
            {children}
            {error && <span className="text-[11px] text-red-400">{error}</span>}
        </div>
    )
}

function Inp({ hasError, className = '', ...p }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
    return (
        <input {...p} className={`w-full px-3.5 py-3 rounded-[10px] bg-[#141920] border text-[13px] font-['Sora'] text-[#EEF2F7] placeholder-[#3D4855] outline-none transition-all ${hasError ? 'border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.12)]' : 'border-[#1E2530] focus:border-[#E63946] focus:shadow-[0_0_0_3px_rgba(230,57,70,0.15)] hover:bg-[#181F28]'} ${className}`} />
    )
}

function Alert({ type, msg }: { type: 'error' | 'success'; msg: string }) {
    if (!msg) return null
    return (
        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] text-[12px] font-medium ${type === 'error' ? 'bg-red-500/10 border border-red-500/25 text-red-300' : 'bg-green-500/10 border border-green-500/25 text-green-300'}`}>
            <span>{type === 'error' ? '⚠' : '✓'}</span><span>{msg}</span>
        </div>
    )
}

export default function AuthPage() {
    const router = useRouter()
    const [tab, setTab] = useState<'login' | 'register'>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [showCpw, setShowCpw] = useState(false)
    const [log, setLog] = useState<LoginForm>({ email: '', password: '' })
    const [logErr, setLogErr] = useState<Errors>({})
    const [reg, setReg] = useState<RegisterForm>({ firstName: '', lastName: '', bloodGroup: '', email: '', phone: '', ecName: '', ecPhone: '', password: '', confirmPassword: '', agreed: false })
    const [regErr, setRegErr] = useState<Errors>({})
    const pw = getStrength(reg.password)

    const switchTab = (t: 'login' | 'register') => { setTab(t); setError(''); setSuccess(''); setLogErr({}); setRegErr({}) }
    const updL = (k: keyof LoginForm, v: string) => { setLog(p => ({ ...p, [k]: v })); setLogErr(p => ({ ...p, [k]: '' })) }
    const updR = (k: keyof RegisterForm, v: string | boolean) => { setReg(p => ({ ...p, [k]: v })); setRegErr(p => ({ ...p, [k]: '' })) }

   const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!isEmail(log.email)) { setLogErr(p => ({ ...p, email: 'Enter a valid email' })); return }
    if (!log.password.trim()) { setLogErr(p => ({ ...p, password: 'Password is required' })); return }
    setLoading(true)
    try {
        // REAL API CALL
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: log.email, 
                password: log.password 
            }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed')
        }
        
        // Store user data
        localStorage.setItem('madad_user', JSON.stringify(data.user))
        localStorage.setItem('madad_user_id', data.user._id)
        
        setSuccess('Welcome back! Redirecting…')
        setTimeout(() => router.push('/dashboard'), 1500)
        
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Login failed. Try again.')
    } finally { setLoading(false) }
}
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!reg.agreed) { setError('Please agree to the Terms of Service to continue.'); return }
    const errors = validateRegister(reg)
    if (Object.keys(errors).length) { setRegErr(errors); return }
    setLoading(true)
    try {
        // REAL API CALL
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: reg.firstName,
                lastName: reg.lastName,
                email: reg.email,
                phone: `+92${reg.phone}`,
                bloodGroup: reg.bloodGroup,
                emergencyContact: {
                    name: reg.ecName,
                    phone: reg.ecPhone,
                },
                password: reg.password,
            }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed')
        }
        
        setSuccess('Account created! Redirecting to login...')
        
        // Clear form and switch to login tab after 2 seconds
        setTimeout(() => {
            switchTab('login')
            setReg({
                firstName: '', lastName: '', bloodGroup: '', email: '', 
                phone: '', ecName: '', ecPhone: '', password: '', 
                confirmPassword: '', agreed: false
            })
            setSuccess('')
        }, 2000)
        
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Registration failed. Try again.')
    } finally { setLoading(false) }
}
    const secLabel = (txt: string) => (
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#3D4855] border-b border-[#1E2530] pb-2 mt-1">{txt}</p>
    )

    return (

        <div className="min-h-screen bg-[#080B0F] flex items-center justify-center p-4 font-['Sora']"
            style={{ backgroundImage: 'linear-gradient(rgba(230,57,70,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,0.03) 1px,transparent 1px)', backgroundSize: '48px 48px' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');@keyframes expand{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.15);opacity:0}}`}</style>

            <div className="flex w-full max-w-[900px] rounded-2xl border border-[#1E2530] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)]">

                {/* LEFT - Sidebar with animations */}
                <div className="hidden md:flex w-[300px] flex-shrink-0  flex-col items-center justify-center px-8 py-12 bg-gradient-to-br from-[#0e1520] via-[#080B0F] to-[#0d0608] border-r border-[#1E2530] relative overflow-hidden">
                    {[180, 280, 400].map((s, i) => (<div key={i} className="absolute rounded-full border border-red-500/15" style={{ width: s, height: s, animation: `expand 4s ease-out ${i * 1.2}s infinite` }} />))}
                    <div className="absolute top-5 flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-full px-3 py-1.5 z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest text-red-500">SYSTEM ACTIVE</span>
                    </div>
                    <div className="w-[68px] h-[68px] mt-3 rounded-2xl border-2 border-dashed border-red-500/50 bg-red-500/6 flex items-center justify-center mb-5 z-10">
                        <span className="text-[9px] font-bold text-red-500/70 text-center leading-tight tracking-widest">YOUR<br />ICON</span>
                    </div>
                    <h1 className="text-[42px] font-extrabold tracking-tight leading-none z-10">  <span className="text-white">Ma</span><span className="text-[#E63946]">dad</span></h1>
                    <p className="mt-1.5 z-10 text-[20px] text-[#6B7685]" style={{ fontFamily: "'Noto Nastaliq Urdu',serif", direction: 'rtl' }}>مدد</p>

                    <p className="mt-3.5 text-[12px] text-[#6B7685] text-center leading-relaxed max-w-[200px] z-10">Voice-first emergency response.<br />Speak. We listen. Help arrives.</p>

                    <div className="flex gap-6 mt-8 z-10">
                        {[['<3s', 'Response'], ['Multi', 'Languages'], ['24/7', 'Active']].map(([n, l]) => (
                            <div key={l} className="text-center">
                                <div className="text-xl font-bold text-[#E63946]">{n}</div>
                                <div className="text-[9px] text-[#3D4855] uppercase tracking-widest mt-0.5">{l}</div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* RIGHT - Form area */}
                <div className="flex-1 flex flex-col bg-[#0F1318] overflow-y-auto max-h-[85vh]">
                    <div className="flex border-b border-[#1E2530] flex-shrink-0">
                        {(['login', 'register'] as const).map(t => (
                            <button key={t} onClick={() => switchTab(t)} className={`flex-1 py-4 text-[12px] font-semibold tracking-widest uppercase transition-all ${tab === t ? 'text-[#E63946] border-b-2 border-[#E63946] bg-red-500/3' : 'text-[#6B7685] border-b-2 border-transparent hover:text-[#EEF2F7]'}`}>
                                {t === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {/* LOGIN FORM */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8">
                            <Alert type="error" msg={error} />
                            <Alert type="success" msg={success} />
                            <Field label="Email Address" error={logErr.email}>
                                <Inp type="email" placeholder="ali@example.com" hasError={!!logErr.email} value={log.email} onChange={e => updL('email', e.target.value)} />
                            </Field>
                            <Field label="Password" error={logErr.password}>
                                <div className="relative">
                                    <Inp type={showPw ? 'text' : 'password'} placeholder="Your password" hasError={!!logErr.password} className="pr-10" value={log.password} onChange={e => updL('password', e.target.value)} />
                                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7685] hover:text-white text-sm">{showPw ? '🙈' : '👁'}</button>
                                </div>
                            </Field>
                            <div className="flex justify-end -mt-2">
                                <button type="button" className="text-[11px] text-[#6B7685] hover:text-[#E63946]">Forgot password?</button>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E63946] hover:bg-[#c0303c] disabled:bg-[#3D4855] text-white font-bold text-[13px] tracking-wider rounded-[10px] transition-all shadow-[0_4px_20px_rgba(230,57,70,0.3)] disabled:cursor-not-allowed">
                                {loading ? '⏳ Signing in…' : 'Sign In to Madad'}
                            </button>
                            <p className="text-center text-[12px] text-[#6B7685]">No account? <button type="button" onClick={() => switchTab('register')} className="text-[#E63946] font-semibold hover:underline">Register here →</button></p>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {tab === 'register' && (
                        <form onSubmit={handleRegister} className="flex flex-col gap-4 p-8">
                            <Alert type="error" msg={error} />
                            <Alert type="success" msg={success} />

                            {secLabel('Personal Information')}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First Name" error={regErr.firstName}>
                                    <Inp placeholder="Ali" hasError={!!regErr.firstName} value={reg.firstName} onChange={e => updR('firstName', e.target.value)} />
                                </Field>
                                <Field label="Last Name" error={regErr.lastName}>
                                    <Inp placeholder="Hassan" hasError={!!regErr.lastName} value={reg.lastName} onChange={e => updR('lastName', e.target.value)} />
                                </Field>
                            </div>
                            <Field label="Email Address" error={regErr.email}>
                                <Inp type="email" placeholder="ali@example.com" hasError={!!regErr.email} value={reg.email} onChange={e => updR('email', e.target.value)} />
                            </Field>

                            {secLabel('Medical Information')}
                            <Field label="Pakistan Phone Number" error={regErr.phone}>
                                <div className="flex gap-2">
                                    <div className="w-[70px] flex-shrink-0 px-3 py-3 bg-red-500/8 border border-red-500/20 rounded-[10px] text-[#E63946] font-bold text-[13px] text-center">+92</div>
                                    <Inp placeholder="3001234567" maxLength={10} hasError={!!regErr.phone} value={reg.phone} onChange={e => updR('phone', e.target.value.replace(/\D/, ''))} />
                                </div>
                            </Field>

                            {/* ✅ ADD BLOOD GROUP FIELD HERE */}
                            <Field label="Blood Group" error={regErr.bloodGroup}>
                                <select
                                    value={reg.bloodGroup}
                                    onChange={e => updR('bloodGroup', e.target.value)}
                                    className={`w-full px-3.5 py-3 rounded-[10px] bg-[#141920] border text-[13px] font-['Sora'] text-[#EEF2F7] outline-none appearance-none transition-all ${regErr.bloodGroup
                                            ? 'border-red-400'
                                            : 'border-[#1E2530] focus:border-[#E63946] focus:shadow-[0_0_0_3px_rgba(230,57,70,0.15)]'
                                        }`}
                                >
                                    <option value="">— Select Blood Group —</option>
                                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </Field>


                            {secLabel('Emergency Contact')}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Contact Name" error={regErr.ecName}>
                                    <Inp placeholder="Parent / Spouse" hasError={!!regErr.ecName} value={reg.ecName} onChange={e => updR('ecName', e.target.value)} />
                                </Field>
                                <Field label="Contact Phone" error={regErr.ecPhone}>
                                    <Inp type="tel" placeholder="03XX XXXXXXX" hasError={!!regErr.ecPhone} value={reg.ecPhone} onChange={e => updR('ecPhone', e.target.value)} />
                                </Field>
                            </div>

                            {secLabel('Account Security')}
                            <Field label="Password" error={regErr.password}>
                                <div className="relative">
                                    <Inp type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" hasError={!!regErr.password} className="pr-10" value={reg.password} onChange={e => updR('password', e.target.value)} />
                                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7685] hover:text-white text-sm">{showPw ? '🙈' : '👁'}</button>
                                </div>
                                {reg.password && (
                                    <div>
                                        <div className="flex gap-1 mt-1.5">{[1, 2, 3, 4].map(i => (<div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300" style={{ background: i <= pw.score ? pw.color : '#1E2530' }} />))}</div>
                                        <p className="text-[10px] mt-1" style={{ color: pw.color }}>{pw.label}</p>
                                    </div>
                                )}
                            </Field>
                            <Field label="Confirm Password" error={regErr.confirmPassword}>
                                <div className="relative">
                                    <Inp type={showCpw ? 'text' : 'password'} placeholder="Repeat password" hasError={!!regErr.confirmPassword} className="pr-10" value={reg.confirmPassword} onChange={e => updR('confirmPassword', e.target.value)} />
                                    <button type="button" onClick={() => setShowCpw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7685] hover:text-white text-sm">{showCpw ? '🙈' : '👁'}</button>
                                </div>
                            </Field>

                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={reg.agreed} onChange={e => updR('agreed', e.target.checked)} className="mt-0.5 accent-[#E63946]" />
                                <span className="text-[11px] text-[#6B7685] leading-relaxed">I agree to the <a href="#" className="text-[#E63946] hover:underline">Terms of Service</a> and <a href="#" className="text-[#E63946] hover:underline">Privacy Policy</a>. Medical information will be shared with emergency responders.</span>
                            </label>

                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E63946] hover:bg-[#c0303c] disabled:bg-[#3D4855] text-white font-bold text-[13px] tracking-wider rounded-[10px] transition-all shadow-[0_4px_20px_rgba(230,57,70,0.3)] disabled:cursor-not-allowed mt-1">
                                {loading ? '⏳ Creating account…' : 'Create Civilian Account'}
                            </button>
                            <p className="text-center text-[12px] text-[#6B7685]">Already registered? <button type="button" onClick={() => switchTab('login')} className="text-[#E63946] font-semibold hover:underline">Sign in →</button></p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}