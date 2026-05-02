import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Pinecone } from "@pinecone-database/pinecone";
import { Redis } from "@upstash/redis";
import twilio from "twilio";
import Groq from "groq-sdk";

// Initialize Stateless Clients
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

// --- AI ORCHESTRATION ---

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
      console.error(`Model ${model} failed, trying next...`);
    }
  }
  return null;
}

// --- AGENT HELPERS ---

async function detectLanguage(text) {
  if (!text || text.trim().length < 5) return "en";
  const prompt = `Detect language. Reply ONLY with ISO 639-1 code (en, ur, hi, ar, etc). Text: "${text}"`;
  const res = await callAI(prompt);
  const lang = res?.choices[0]?.message?.content?.trim().toLowerCase() || "en";
  return lang.match(/^[a-z]{2}/)?.[0] || "en";
}

async function handleTriage(text) {
  const t = text.toLowerCase();
  // Rule-based fast path
  if (t.includes("not breathing") || t.includes("unconscious"))
    return { severity: "critical", type: "Cardiac Arrest" };
  if (t.includes("choking")) return { severity: "critical", type: "Choking" };

  const prompt = `Triage this emergency. Return ONLY JSON: {"severity": "critical"|"moderate", "type": "description"}. Text: "${text}"`;
  const chat = await callAI(prompt);
  const raw = chat?.choices[0]?.message?.content || "";
  const match = raw.match(/\{.*\}/s);
  return match
    ? JSON.parse(match[0])
    : { severity: "critical", type: "General Emergency" };
}

async function handleRAG(transcript, langCode) {
  const langNames = { en: "English", ur: "Urdu", hi: "Hindi", ar: "Arabic" };
  const language = langNames[langCode] || "English";

  const queryResponse = await index.query({
    vector: Array(384).fill(0.1), // Replace with actual embedding logic if available
    topK: 3,
    includeMetadata: true,
  });

  const context = queryResponse.matches
    ?.map((m) => m.metadata?.text)
    .join("\n");
  const prompt = `Medical assistant. Respond in ${language}. Short steps. Context: ${context}. User: ${transcript}`;

  const chat = await callAI(prompt);
  return chat?.choices[0]?.message?.content || "Stay calm. Help is coming.";
}

// --- MAIN API HANDLER ---

export async function POST(req) {
  try {
    const { transcript, location, userId } = await req.json();
    if (!transcript)
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 },
      );

    // 1. Cache Check
    const cached = await redis.get(transcript.toLowerCase().trim());
    if (cached)
      return NextResponse.json({
        source: "cache",
        guidance: cached,
        severity: "critical",
      });

    // 2. Triage & Language Detection (Parallel)
    const [lang, triage] = await Promise.all([
      detectLanguage(transcript),
      handleTriage(transcript),
    ]);

    // 3. Guidance Generation
    const guidance = await handleRAG(transcript, lang);

    // 4. Background Dispatch
    if (triage.severity === "critical") {
      const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

      // We don't 'await' this so the user gets the response faster
      twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: process.env.EMERGENCY_CONTACT_WHATSAPP,
        body: `🚨 MADAD ALERT\nType: ${triage.type}\nLocation: ${mapLink}`,
      });

      const client = await clientPromise;
      const db = client.db("madad");
      db.collection("active_emergencies").insertOne({
        userId,
        type: triage.type,
        location,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      source: "ai",
      guidance,
      severity: triage.severity,
      language: lang,
    });
  } catch (err) {
    console.error("Critical Failure:", err);
    return NextResponse.json({
      guidance: "Emergency detected. Call 1122.",
      severity: "critical",
    });
  }
}
