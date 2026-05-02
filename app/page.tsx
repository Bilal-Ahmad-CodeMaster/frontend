'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import io from 'socket.io-client';
import InstructionStep from '@/components/InstructionStep';
import DispatchStatus from '@/components/DispatchStatus';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080');

export default function EmergencyDashboard() {
  const [isListening, setIsListening] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Moderate' | null>(null);

  useEffect(() => {
    socket.on('triage_result', (data) => {
      setSeverity(data.severity);
      // Simulate splitting Mistral text into steps
      setInstructions([data.instructions]);
    });

    socket.on('audio_chunk', (chunk) => {
      // Web Audio API playback logic for streaming Edge TTS
    });

    return () => {
      socket.off('triage_result');
      socket.off('audio_chunk');
    };
  }, []);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Fallback API call simulation for the MVP
      fetch('http://localhost:8080/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: "I have a severe cut on my arm and it is bleeding heavily.",
          socketId: socket.id
        })
      });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-2">Madad</h1>
        <p className="text-slate-400">Describe your emergency</p>
      </div>

      {/* VAD Pulsing Mic Button */}
      <motion.button
        onClick={toggleListening}
        animate={isListening ? { scale: [1, 1.2, 1], boxShadow: "0px 0px 30px rgba(239, 68, 68, 0.8)" } : {}}
        transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
        className={`p-12 rounded-full ${isListening ? 'bg-red-600' : 'bg-slate-800'}`}
      >
        {isListening ? <Mic size={48} /> : <MicOff size={48} className="text-slate-500" />}
      </motion.button>

      {severity && <DispatchStatus severity={severity} />}

      <div className="w-full max-w-md space-y-4">
        {instructions.map((step, idx) => (
          <InstructionStep key={idx} stepNumber={idx + 1} text={step} />
        ))}
      </div>
    </main>
  );
}