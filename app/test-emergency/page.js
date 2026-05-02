"use client";
import { useState, useEffect } from "react";

export default function VoiceEmergencyPage() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // --- 1. Speech Recognition (Mic to Text) ---
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return alert("Browser does not support speech recognition.");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // You can also detect lang dynamically later
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleEmergency(text); // Automatically send to backend when done speaking
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- 2. Get Location & Send to Backend ---
  const handleEmergency = async (voiceText) => {
    setLoading(true);

    // Get Current Location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const response = await fetch("/api/emergency", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: voiceText || transcript,
              userId: "bilal_ahmad_voice", // From your profile
              location,
            }),
          });

          const data = await response.json();
          setResult(data);

          // --- 3. Text to Speech (AI Response to Voice) ---
          speakResponse(data.guidance);
        } catch (error) {
          console.error("API Error:", error);
        } finally {
          setLoading(false);
        }
      },
      (err) => alert("Location access denied. Please enable GPS."),
    );
  };

  // --- 3. Text to Speech Utility ---
  const speakResponse = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Use a calm, professional voice
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8 text-red-500">
        Madad Voice Assistant
      </h1>

      <button
        onClick={startListening}
        disabled={loading}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? "bg-red-500 animate-pulse scale-110"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        <span className="text-4xl">{isListening ? "🛑" : "🎤"}</span>
      </button>

      <p className="mt-4 text-gray-400">
        {isListening
          ? "Listening to your emergency..."
          : "Tap the mic to speak"}
      </p>

      {transcript && (
        <div className="mt-8 p-4 bg-slate-800 rounded-lg w-full max-w-md">
          <p className="text-xs text-blue-400 font-bold uppercase">You said:</p>
          <p className="italic">"{transcript}"</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded-lg w-full max-w-md">
          <p className="text-xs text-green-400 font-bold uppercase">
            AI Response:
          </p>
          <p className="mt-2">{result.guidance}</p>
        </div>
      )}
    </div>
  );
}
