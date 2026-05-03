export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import clientPromise from "../../lib/db.js";
import { Pinecone } from "@pinecone-database/pinecone";
import { Redis } from "@upstash/redis";
import twilio from "twilio";
import Groq from "groq-sdk";

// ── CLIENTS ───────────────────────────────────────────────────────────────────
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const pc = new Pinecone({ apiKey: process.env.PINECONE_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── AI CALL WITH FALLBACK MODELS ──────────────────────────────────────────────
async function callAI(prompt) {
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
  ];
  for (const model of models) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });
      return res;
    } catch (err) {
      console.error(`Model ${model} failed:`, err.message);
    }
  }
  return null;
}

// ── LANGUAGE DETECTION ────────────────────────────────────────────────────────
async function detectLanguage(text) {
  if (!text || text.trim().length < 5) return "en";
  const prompt = `Detect language. Reply ONLY with ISO 639-1 code (en, ur, ar). Text: "${text}"`;
  const res = await callAI(prompt);
  const lang = res?.choices[0]?.message?.content?.trim().toLowerCase() || "en";
  return lang.match(/^[a-z]{2}/)?.[0] || "en";
}

// ── TRIAGE AGENT ──────────────────────────────────────────────────────────────
async function handleTriage(text) {
  const t = text.toLowerCase();
  // fast rule-based path
  if (
    t.includes("not breathing") ||
    t.includes("unconscious") ||
    t.includes("cardiac")
  )
    return { severity: "critical", type: "Cardiac Arrest" };
  if (t.includes("choking")) return { severity: "critical", type: "Choking" };
  if (t.includes("heart") || t.includes("chest pain") || t.includes("attack"))
    return { severity: "critical", type: "Heart Attack" };
  if (t.includes("bleed") || t.includes("blood") || t.includes("wound"))
    return { severity: "urgent", type: "Severe Bleeding" };
  if (t.includes("burn")) return { severity: "urgent", type: "Burns" };

  const prompt = `Triage this emergency. Return ONLY valid JSON: {"severity": "critical"|"urgent"|"minor", "type": "short description"}. Text: "${text}"`;
  const chat = await callAI(prompt);
  const raw = chat?.choices[0]?.message?.content || "";
  const match = raw.match(/\{.*\}/s);
  try {
    return match
      ? JSON.parse(match[0])
      : { severity: "critical", type: "General Emergency" };
  } catch {
    return { severity: "critical", type: "General Emergency" };
  }
}

// ── INSTRUCTION AGENT (RAG) ───────────────────────────────────────────────────
async function handleRAG(transcript, langCode) {
  const langNames = { en: "English", ur: "Urdu", ar: "Arabic" };
  const language = langNames[langCode] || "English";

  let context = "";
  try {
    const queryResponse = await index.query({
      vector: Array(384).fill(0.1), // TODO: replace with real MiniLM embedding
      topK: 3,
      includeMetadata: true,
    });
    context =
      queryResponse.matches
        ?.map((m) => m.metadata?.text)
        .filter(Boolean)
        .join("\n") || "";
  } catch (err) {
    console.error("Pinecone error:", err.message);
  }

  const prompt = `
You are "Madad", a highly trained emergency first-response assistant.

User Language: ${language}

CORE INSTRUCTIONS:
1. LANGUAGE HANDLING:
   - If URDU: Respond ONLY in natural ROMAN URDU (Latin script).
     Use simple, spoken phrases like "ghabrayein nahi", "zor se dabayein", "ooncha rakhein".
     Avoid formal or book-style Urdu.
   - If ENGLISH: Respond in clear, calm, and professional medical English.

2. EMERGENCY BEHAVIOR:
   - Speak in a calm, reassuring, human tone.
   - Assume the user may be panicking.
   - Give immediate, practical first-aid instructions.
   - Always encourage contacting emergency services immediately.

3. EMERGENCY ALERT:
   - Inform the user that emergency services have been alerted.
   - Instruct them to ALSO contact local emergency services themselves only  if the emergency is severe and emergencies are not arrived after 15 minutes.
   - Tell them to stay with the patient until help arrives.

GOAL:
Provide a structured "First Aid Response Guide" with clear, step-by-step physical actions.

RESPONSE FORMAT:
- Use numbered steps (Maximum 10).
- Each step must describe EXACT physical actions.
- Keep sentences short, clear, and actionable.

EXAMPLE STYLE:
- "Saaf kapra zakham par rakh kar zor se dabayein."
- "Mareez ke pair halkay oonchay rakhein."
- "Chest ke darmiyan dono haath rakh kar tezi se dabao (1 second mein 2 dafa)."

CONSTRAINTS:
- Maximum 10 steps
- No unnecessary explanations
- No medical jargon unless very simple
- Focus ONLY on immediate first aid (not diagnosis)

Emergency Situation:
${transcript}
`;
  const chat = await callAI(prompt);
  return (
    chat?.choices[0]?.message?.content ||
    "Stay calm. Call 1122 immediately. Help is on the way."
  );
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { transcript, location, userId } = await req.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 },
      );
    }

    // ── 1. CHECK HOT CACHE ────────────────────────────────────────────────────
    const cacheKey = transcript.toLowerCase().trim();
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          source: "cache",
          guidance: cached,
          severity: "critical",
        });
      }
    } catch (err) {
      console.error("Redis error (non-fatal):", err.message);
    }

    // ── 2. PARALLEL: TRIAGE + LANGUAGE DETECTION ──────────────────────────────
    const [lang, triage] = await Promise.all([
      detectLanguage(transcript),
      handleTriage(transcript),
    ]);

    // ── 3. GENERATE GUIDANCE ──────────────────────────────────────────────────
    const guidance = await handleRAG(transcript, lang);

    // ── 4. DISPATCH IF CRITICAL (non-blocking) ────────────────────────────────
    if (triage.severity === "critical") {
      const mapLink = location?.lat
        ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
        : "Location not available";

      // Fire and forget — do not await so user gets response fast
      twilioClient.messages
        .create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: process.env.EMERGENCY_CONTACT_WHATSAPP,
          body: `🚨 MADAD EMERGENCY ALERT\nType: ${triage.type}\nSeverity: CRITICAL\nLocation: ${mapLink}`,
        })
        .catch((err) => console.error("Twilio error:", err.message));

      clientPromise
        .then((client) => {
          client
            .db("madad")
            .collection("active_emergencies")
            .insertOne({
              userId: userId || "anonymous",
              type: triage.type,
              severity: triage.severity,
              location: location || {},
              language: lang,
              transcript,
              createdAt: new Date(),
            });
        })
        .catch((err) => console.error("DB log error:", err.message));
    }

    return NextResponse.json({
      source: "ai",
      guidance,
      severity: triage.severity,
      type: triage.type,
      language: lang,
    });
  } catch (err) {
    console.error("Emergency API failure:", err);
    // Always return something useful — never crash silently
    return NextResponse.json({
      source: "fallback",
      guidance:
        "Emergency detected. Call 1122 immediately. Stay calm and keep the person still.",
      severity: "critical",
      type: "General Emergency",
    });
  }
}
