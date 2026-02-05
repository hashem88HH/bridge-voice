
import React, { useState } from 'react';
import { Keyboard, Copy, BookOpen } from 'lucide-react';

interface BrailleViewProps {
  highContrast: boolean;
}

const brailleMap: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
  '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑', '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
  ' ': ' ', '.': '⠲', ',': '⠂', '!': '⠖', '?': '⠦', '-': '⠤'
};

const BrailleView: React.FC<BrailleViewProps> = ({ highContrast }) => {
  const [text, setText] = useState('');
  
  const translate = (input: string) => {
    return input.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
  };

  const brailleResult = translate(text);

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className={`p-8 rounded-3xl border-4 ${highContrast ? 'border-white bg-black' : 'border-slate-200 bg-white shadow-xl'}`}>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-amber-500" />
          Braille Translator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block font-bold mb-2 opacity-70">Normal Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to translate..."
              className={`w-full min-h-[200px] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-4 transition-all ${
                highContrast 
                  ? 'bg-zinc-900 border-2 border-white text-white focus:ring-white' 
                  : 'bg-slate-50 border-2 border-slate-100 focus:ring-amber-500/20 shadow-inner'
              }`}
            />
          </div>

          <div className="flex flex-col">
            <label className="block font-bold mb-2 opacity-70">Braille Output</label>
            <div className={`flex-1 min-h-[200px] p-6 rounded-2xl text-5xl leading-relaxed break-all border-4 ${
              highContrast 
                ? 'bg-white text-black border-white' 
                : 'bg-amber-50 border-amber-100 text-amber-900'
            }`}>
              {brailleResult || '⠃⠗⠁⠊⠇⠇⠑'}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(brailleResult)}
              className={`mt-4 w-full p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                highContrast ? 'bg-white text-black' : 'bg-slate-800 text-white hover:bg-black'
              }`}
            >
              <Copy className="w-5 h-5" />
              Copy Braille
            </button>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border-4 ${highContrast ? 'border-white bg-black' : 'bg-slate-50 border-slate-200'}`}>
        <h4 className="font-bold text-lg mb-2">How it works</h4>
        <p className="opacity-80">
          This tool uses the standard English Grade 1 Braille mapping. You can copy the dots to use in digital Braille readers or for visual teaching aids.
        </p>
      </div>
    </div>
  );
};

export default BrailleView;
