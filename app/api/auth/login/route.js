export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/db.js'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('madad')

    // ── FIND USER ─────────────────────────────────────────────────────────────
    const user = await db.collection('users').findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // ── VERIFY PASSWORD ───────────────────────────────────────────────────────
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // ── RETURN USER (no password) ─────────────────────────────────────────────
    const { password: _, ...userPublicData } = user

    return NextResponse.json(
      { message: 'Login successful', user: userPublicData },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}