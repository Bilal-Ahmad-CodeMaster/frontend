// app/api/tts/edge/route.ts
//
// Edge TTS — FREE Microsoft Azure neural voices, no API key needed
// Uses the `edge-tts` npm package which calls Microsoft's unofficial endpoint
//
// Install:  npm install edge-tts
//
// Supported voices for this project:
//   en-US-AriaNeural     — warm, natural English female
//   en-US-GuyNeural      — clear English male
//   en-US-JennyNeural    — friendly English female
//   ur-PK-UzmaNeural     — native Urdu female ✅
//   ur-PK-AsadNeural     — native Urdu male  ✅
//
// Full voice list: https://github.com/rany2/edge-tts#voice-list

import { NextRequest, NextResponse } from 'next/server'

// Dynamic import because edge-tts uses Node.js streams
let edgeTTS: any = null
async function getEdgeTTS() {
  if (!edgeTTS) edgeTTS = await import('edge-tts')
  return edgeTTS
}

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json()

  if (!text || !voice) {
    return NextResponse.json({ error: 'Missing text or voice' }, { status: 400 })
  }

  try {
    const { EdgeTTS } = await getEdgeTTS()
    const tts = new EdgeTTS()

    // Generate audio — returns a Buffer of MP3 data
    const audioData: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = []

      tts.ttsPromise(text, voice, {
        rate: '-5%',    // slightly slower for emergency clarity
        volume: '+0%',
        pitch: '+0Hz',
      }).then((stream: any) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end',  () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      }).catch(reject)
    })

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })

  } catch (err) {
    console.error('Edge TTS error:', err)
    return NextResponse.json({ error: 'Edge TTS failed' }, { status: 500 })
  }
}