
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Camera, RefreshCw, Hand, Info } from 'lucide-react';

interface SignLanguageViewProps {
  highContrast: boolean;
}

const SignLanguageView: React.FC<SignLanguageViewProps> = ({ highContrast }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: "Analyze the hand gesture in this image. Is it a standard sign language gesture? If so, tell me what word or letter it represents. Just give the word/letter. If no gesture is clear, say 'Detecting...'" }
          ]
        }
      });
      setResult(response.text?.trim() || 'No gesture detected');
    } catch (err) {
      console.error(err);
      setResult('Error identifying gesture');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Continuous analysis loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (stream) captureAndAnalyze();
    }, 4000);
    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      <div className={`p-6 rounded-3xl border-4 ${highContrast ? 'border-white bg-black' : 'border-slate-200 bg-white shadow-xl'} overflow-hidden`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Hand className="w-8 h-8 text-purple-500" />
            Sign Recognition
          </h2>
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
             <span className="text-sm font-bold opacity-70">{isAnalyzing ? 'Analyzing...' : 'Live'}</span>
          </div>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-slate-100 mb-6">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1/2 h-2/3 border-4 border-dashed border-white/50 rounded-3xl" />
          </div>
        </div>

        <div className={`p-8 rounded-2xl text-center border-4 ${
          highContrast ? 'border-white bg-zinc-900' : 'bg-purple-50 border-purple-100'
        }`}>
          <p className="text-sm uppercase tracking-widest font-bold opacity-60 mb-2">Detected Word</p>
          <div className="text-5xl font-black tracking-tight text-purple-600">
            {result || '...'}
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border-4 flex items-start gap-4 ${
        highContrast ? 'border-white bg-black' : 'border-slate-200 bg-slate-50'
      }`}>
        <Info className="w-8 h-8 text-blue-500 flex-shrink-0" />
        <p className="opacity-80">
          Position your hand clearly within the frame. Our AI analyzes your gestures every few seconds to translate them into spoken language.
        </p>
      </div>
    </div>
  );
};

export default SignLanguageView;
