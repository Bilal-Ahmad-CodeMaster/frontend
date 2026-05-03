// app/api/tts/edge/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Dynamic import because edge-tts uses Node.js streams
let edgeTTS: any = null
async function getEdgeTTS() {
  if (!edgeTTS) edgeTTS = await import('edge-tts')
  return edgeTTS
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json()

    if (!text || !voice) {
      return NextResponse.json({ error: 'Missing text or voice' }, { status: 400 })
    }

    const { EdgeTTS } = await getEdgeTTS()
    const tts = new EdgeTTS()

    // Generate audio — returns a Buffer of MP3 data
    const audioData: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = []

      tts.ttsPromise(text, voice, {
        rate: '-5%',
        volume: '+0%',
        pitch: '+0Hz',
      }).then((stream: any) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      }).catch(reject)
    })

    // FIX: Convert Node.js Buffer to Uint8Array for Web Response compatibility
    const uint8Array = new Uint8Array(audioData)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': uint8Array.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })

  } catch (err) {
    console.error('Edge TTS error:', err)
    return NextResponse.json({ error: 'Edge TTS failed' }, { status: 500 })
  }
}