
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Blob } from '@google/genai';
import { Mic, MicOff, RotateCcw, MessageCircle } from 'lucide-react';

interface STTViewProps {
  highContrast: boolean;
}

const STTView: React.FC<STTViewProps> = ({ highContrast }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<{ type: 'user' | 'ai'; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const sessionRef = useRef<any>(null);

  // Helper methods for audio encoding
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startListening = async () => {
    try {
      setError(null);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
            setIsRecording(true);
          },
          onmessage: async (message) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const u = currentInputTranscription.current;
              const a = currentOutputTranscription.current;
              if (u) setTranscripts(prev => [...prev, { type: 'user', text: u }]);
              if (a) setTranscripts(prev => [...prev, { type: 'ai', text: a }]);
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection error. Please try again.");
            setIsRecording(false);
          },
          onclose: () => {
            setIsRecording(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: "You are BridgeVoice AI assistant. Help the user communicate by providing brief, helpful responses or transcriptions."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError("Failed to access microphone or connect to service.");
      console.error(err);
    }
  };

  const stopListening = () => {
    if (sessionRef.current) {
      // In a real implementation we'd stop the script processor and close session
      setIsRecording(false);
      sessionRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      <div className={`p-6 rounded-3xl border-4 ${highContrast ? 'border-white bg-black' : 'border-slate-200 bg-white shadow-lg'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
            Live Transcription
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setTranscripts([])}
              className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
                highContrast ? 'border-white bg-white text-black' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <RotateCcw className="w-6 h-6" />
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 border border-red-200 font-bold">
            {error}
          </div>
        )}

        <div className={`h-[50vh] overflow-y-auto p-4 rounded-2xl flex flex-col gap-4 ${
          highContrast ? 'bg-zinc-900 border border-white' : 'bg-slate-50'
        }`}>
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <MessageCircle className="w-16 h-16 mb-2" />
              <p>Conversation will appear here...</p>
            </div>
          ) : (
            transcripts.map((t, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] p-4 rounded-2xl text-xl leading-relaxed ${
                  t.type === 'user' 
                    ? (highContrast ? 'bg-white text-black self-end' : 'bg-blue-600 text-white self-end')
                    : (highContrast ? 'bg-zinc-700 text-white self-start border border-white' : 'bg-white shadow-md self-start border border-slate-100')
                }`}
              >
                {t.text}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-center mt-auto pb-8">
        <button 
          onClick={isRecording ? stopListening : startListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl ${
            isRecording 
              ? 'bg-red-500 animate-pulse' 
              : (highContrast ? 'bg-white text-black' : 'bg-blue-600 text-white')
          }`}
          aria-label={isRecording ? "Stop Listening" : "Start Listening"}
        >
          {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>
      </div>
    </div>
  );
};

export default STTView;
