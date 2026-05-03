export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/db.js'
import twilio from 'twilio'

// ── TWILIO CLIENT ─────────────────────────────────────────────────────────────
// Same pattern as emergency/route.js
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request) {
  console.log('✅ Dispatch /api/dispatch/send hit!')

  try {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, severity, lat, lng, userId } = body
    console.log('📦 Dispatch Data Received:', body)

    // ── BUILD MAP LINK ────────────────────────────────────────────────────────
    const mapLink =
      lat && lng
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : 'Location not available'

    // ── TWILIO WHATSAPP ALERT ─────────────────────────────────────────────────
    // Same pattern as emergency/route.js — fire and forget (no await)
    twilioClient.messages
      .create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,         // whatsapp:+14155238886
        to:   process.env.EMERGENCY_CONTACT_WHATSAPP,     // whatsapp:+923XXXXXXXXX
        body: `🚨 MADAD DISPATCH ALERT\nType: ${type}\nSeverity: ${severity?.toUpperCase()}\nLocation: ${mapLink}`,
      })
      .catch((err) => console.error('Twilio error:', err.message))

    // ── LOG TO MONGODB ────────────────────────────────────────────────────────
    // Same pattern as emergency/route.js — fire and forget (no await)
    clientPromise
      .then((client) => {
        client.db('madad').collection('dispatches').insertOne({
          userId:   userId || 'anonymous',
          type,
          severity,
          location: { lat, lng },
          mapLink,
          sentAt:   new Date(),
        })
      })
      .catch((err) => console.error('DB log error:', err.message))

    // ── RESPONSE ──────────────────────────────────────────────────────────────
    return NextResponse.json({
      success:   true,
      message:   'Emergency alert dispatched successfully',
      mapLink,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Dispatch API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process emergency request' },
      { status: 500 }
    )
  }
}