
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Volume2, Play, Send, Sparkles } from 'lucide-react';

interface TTSViewProps {
  highContrast: boolean;
}

const TTSView: React.FC<TTSViewProps> = ({ highContrast }) => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Audio decoding logic for raw PCM
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const generateAndPlay = async (msg: string) => {
    if (!msg.trim()) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: msg }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
        
        if (!history.includes(msg)) {
          setHistory(prev => [msg, ...prev].slice(0, 10));
        }
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className={`p-8 rounded-3xl border-4 ${highContrast ? 'border-white bg-black' : 'border-slate-200 bg-white shadow-xl'}`}>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Volume2 className="w-8 h-8 text-emerald-500" />
          Text to Speech
        </h2>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here..."
            className={`w-full min-h-[250px] p-6 rounded-2xl text-2xl resize-none focus:outline-none focus:ring-4 transition-all ${
              highContrast 
                ? 'bg-zinc-900 border-2 border-white text-white focus:ring-white' 
                : 'bg-slate-50 border-2 border-slate-100 focus:ring-emerald-500/20'
            }`}
          />
          <button 
            disabled={isSpeaking || !text.trim()}
            onClick={() => generateAndPlay(text)}
            className={`absolute bottom-4 right-4 px-8 py-4 rounded-2xl font-bold text-xl flex items-center gap-3 shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              highContrast ? 'bg-white text-black' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSpeaking ? 'Speaking...' : <><Play className="w-6 h-6 fill-current" /> Speak</>}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className={`p-6 rounded-3xl border-4 ${highContrast ? 'border-white bg-zinc-900' : 'bg-slate-100 border-slate-200'}`}>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2 opacity-70">
            <Sparkles className="w-5 h-5" />
            Recently Spoken
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <button 
                key={i}
                onClick={() => { setText(h); generateAndPlay(h); }}
                className={`px-4 py-2 rounded-xl border-2 transition-all hover:-translate-y-1 ${
                  highContrast 
                    ? 'border-white text-white hover:bg-white hover:text-black' 
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                {h.length > 30 ? h.substring(0, 30) + '...' : h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TTSView;
