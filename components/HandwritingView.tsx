
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { PenTool, Eraser, Search, CheckCircle } from 'lucide-react';

interface HandwritingViewProps {
  highContrast: boolean;
}

const HandwritingView: React.FC<HandwritingViewProps> = ({ highContrast }) => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = highContrast ? 'white' : 'black';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setResult('');
  };

  const recognize = async () => {
    if (!canvasRef.current || isRecognizing) return;
    
    setIsRecognizing(true);
    const base64Image = canvasRef.current.toDataURL('image/png').split(',')[1];
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/png' } },
            { text: "Read the handwritten text in this image and return only the text you find. If it's empty, say 'No text found'." }
          ]
        }
      });
      setResult(response.text?.trim() || 'Detection failed');
    } catch (err) {
      console.error(err);
      setResult('Error occurred');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in zoom-in-95 duration-500">
      <div className={`p-8 rounded-3xl border-4 ${highContrast ? 'border-white bg-black' : 'border-slate-200 bg-white shadow-xl'}`}>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <PenTool className="w-8 h-8 text-rose-500" />
          Handwriting to Text
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className={`relative rounded-2xl border-4 overflow-hidden h-[400px] ${
              highContrast ? 'bg-zinc-900 border-white' : 'bg-slate-50 border-slate-100'
            }`}>
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full h-full cursor-crosshair touch-none"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={clearCanvas}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
                    highContrast ? 'border-white bg-white text-black' : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <Eraser className="w-5 h-5" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={recognize}
              disabled={isRecognizing}
              className={`w-full py-6 rounded-2xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
                highContrast ? 'bg-white text-black' : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              <Search className="w-8 h-8" />
              {isRecognizing ? 'Processing...' : 'Recognize'}
            </button>

            <div className={`flex-1 p-6 rounded-2xl border-4 min-h-[150px] flex flex-col ${
              highContrast ? 'bg-zinc-900 border-white text-white' : 'bg-rose-50 border-rose-100 text-rose-900'
            }`}>
              <span className="text-xs uppercase font-black opacity-50 mb-2">Result</span>
              <p className="text-2xl font-bold">
                {result || (isRecognizing ? '...' : 'Your text will appear here')}
              </p>
              {result && (
                <CheckCircle className="w-6 h-6 mt-auto self-end text-green-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandwritingView;
