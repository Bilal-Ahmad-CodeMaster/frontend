// app/api/tts/elevenlabs/route.ts
//
// ElevenLabs TTS — high quality neural voice
// Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
//
// .env.local:
//   ELEVENLABS_API_KEY=your_key_here
//
// Free tier: 10,000 characters/month
// Paid:      starts at $5/month for 30,000 chars

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json()

  if (!text || !voiceId) {
    return NextResponse.json({ error: 'Missing text or voiceId' }, { status: 400 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    // No key — tell the client to fall through to Edge TTS
    return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 503 })
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',   // fastest model (~400ms latency)
          // model_id: 'eleven_multilingual_v2', // use this for Urdu support
          voice_settings: {
            stability: 0.45,         // lower = more expressive, better for urgent tone
            similarity_boost: 0.80,
            style: 0.30,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs error:', err)
      return NextResponse.json({ error: 'ElevenLabs API failed' }, { status: 502 })
    }

    // Stream the audio buffer back to the client
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })

  } catch (err) {
    console.error('ElevenLabs fetch error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}