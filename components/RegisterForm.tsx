'use client'

import { useState } from 'react'
import Field from './Field'
import Inp from './Inp'
import PasswordInput from './PasswordInput'
import Alert from './Alert'

const CITIES = [
    'Lahore', 'Faisalabad', 'Rawalpindi / Islamabad', 'Multan',
    'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Gujrat', 'Sheikhupura', 'Other'
]

interface RegisterFormData {
    firstName: string
    lastName: string
    email: string
    phone: string

    bloodGroup: string
    ecName: string
    ecPhone: string
    password: string
    confirmPassword: string
    agreed: boolean
}

interface RegisterFormProps {
    onSubmit: (data: RegisterFormData) => void
    loading?: boolean
    error?: string
    success?: string
}

export default function RegisterForm({ onSubmit, loading, error, success }: RegisterFormProps) {
    const [form, setForm] = useState<RegisterFormData>({
        firstName: '', lastName: '', email: '', phone: '', bloodGroup: '',
        ecName: '', ecPhone: '', password: '', confirmPassword: '', agreed: false
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const updateField = (field: keyof RegisterFormData, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!form.firstName.trim()) newErrors.firstName = 'First name required'
        if (!form.lastName.trim()) newErrors.lastName = 'Last name required'
        if (!form.email.includes('@')) newErrors.email = 'Valid email required'
        if (!/^3\d{9}$/.test(form.phone)) newErrors.phone = 'Enter 10 digits e.g. 3001234567'

        if (!form.ecName.trim()) newErrors.ecName = 'Emergency contact name required'
        if (!form.bloodGroup) newErrors.bloodGroup = 'Select blood group'

        if (!form.ecPhone.trim()) newErrors.ecPhone = 'Emergency phone required'
        if (form.password.length < 8) newErrors.password = 'Minimum 8 characters'
        if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.agreed) {
            setErrors({ ...errors, agreed: 'Please agree to Terms' })
            return
        }
        if (validate()) {
            onSubmit(form)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 max-h-[70vh] overflow-y-auto">
            <Alert type="error" message={error || ''} />
            <Alert type="success" message={success || ''} />

            {/* Personal Information */}
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#3D4855] border-b border-[#1E2530] pb-2">
                Personal Information
            </p>

            <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" error={errors.firstName}>
                    <Inp placeholder="Ali" hasError={!!errors.firstName} value={form.firstName} onChange={e => updateField('firstName', e.target.value)} />
                </Field>
                <Field label="Last Name" error={errors.lastName}>
                    <Inp placeholder="Hassan" hasError={!!errors.lastName} value={form.lastName} onChange={e => updateField('lastName', e.target.value)} />
                </Field>
            </div>

            <Field label="Email Address" error={errors.email}>
                <Inp type="email" placeholder="ali@example.com" hasError={!!errors.email} value={form.email} onChange={e => updateField('email', e.target.value)} />
            </Field>

            {/* Contact & Location */}
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#3D4855] border-b border-[#1E2530] pb-2 mt-2">
               Medical Information
            </p>

            <Field label="Pakistan Phone Number" error={errors.phone}>
                <div className="flex gap-2">
                    <div className="w-[70px] flex-shrink-0 px-3 py-3 bg-red-500/8 border border-red-500/20 rounded-[10px] text-[#E63946] font-bold text-[13px] text-center">+92</div>
                    <Inp placeholder="3001234567" maxLength={10} hasError={!!errors.phone} value={form.phone} onChange={e => updateField('phone', e.target.value.replace(/\D/, ''))} />
                </div>
            </Field>


            <Field label="Blood Group" error={errors.bloodGroup}>
                <select
                    value={form.bloodGroup}
                    onChange={e => updateField('bloodGroup', e.target.value)}
                    className={`w-full px-3.5 py-3 rounded-[10px] bg-[#141920] border text-[13px] font-['Sora'] text-[#EEF2F7] outline-none appearance-none transition-all ${errors.bloodGroup
                            ? 'border-red-400'
                            : 'border-[#1E2530] focus:border-[#E63946] focus:shadow-[0_0_0_3px_rgba(230,57,70,0.15)]'
                        }`}
                >
                    <option value="">— Select Blood Group —</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                </select>
            </Field>

            {/* Emergency Contact */}
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#3D4855] border-b border-[#1E2530] pb-2 mt-2">
                Emergency Contact
            </p>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Name" error={errors.ecName}>
                    <Inp placeholder="Parent / Spouse" hasError={!!errors.ecName} value={form.ecName} onChange={e => updateField('ecName', e.target.value)} />
                </Field>
                <Field label="Contact Phone" error={errors.ecPhone}>
                    <Inp placeholder="03XX XXXXXXX" hasError={!!errors.ecPhone} value={form.ecPhone} onChange={e => updateField('ecPhone', e.target.value)} />
                </Field>
            </div>

            {/* Account Security */}
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#3D4855] border-b border-[#1E2530] pb-2 mt-2">
                Account Security
            </p>

            <Field label="Password" error={errors.password}>
                <PasswordInput value={form.password} onChange={e => updateField('password', e.target.value)} hasError={!!errors.password} />
            </Field>

            <Field label="Confirm Password" error={errors.confirmPassword}>
                <PasswordInput value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} hasError={!!errors.confirmPassword} placeholder="Repeat password" />
            </Field>

            {/* Terms Agreement */}
            <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.agreed} onChange={e => updateField('agreed', e.target.checked)} className="mt-0.5 accent-[#E63946]" />
                <span className="text-[11px] text-[#6B7685] leading-relaxed">
                    I agree to the <a href="#" className="text-[#E63946] hover:underline">Terms of Service</a> and <a href="#" className="text-[#E63946] hover:underline">Privacy Policy</a>.
                </span>
            </label>
            {errors.agreed && <span className="text-[11px] text-red-400">{errors.agreed}</span>}

            <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E63946] hover:bg-[#c0303c] disabled:bg-[#3D4855] text-white font-bold text-[13px] tracking-wider rounded-[10px] transition-all disabled:cursor-not-allowed mt-2">
                {loading ? '⏳ Creating account…' : 'Create Civilian Account'}
            </button>
        </form>
    )
}