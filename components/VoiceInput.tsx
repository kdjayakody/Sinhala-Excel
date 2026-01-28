import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      // 'si-LK' is the code for Sinhala, but we also support English just in case
      recog.lang = 'si-LK'; 

      recog.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setError("Microphone error. Please type instead.");
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    } else {
      setError("Browser not supported");
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (isProcessing) return;
    
    if (isListening) {
      recognition?.stop();
    } else {
      try {
        recognition?.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  if (error === "Browser not supported") return null;

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`p-4 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Speak in Sinhala"
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
      {isListening && (
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-indigo-600 font-semibold whitespace-nowrap">
          Listening... (Sinhala)
        </span>
      )}
    </div>
  );
};

export default VoiceInput;
