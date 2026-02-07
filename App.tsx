import InstallButton from "./InstallButton";

import React, { useState, useCallback, useEffect } from 'react';
import { 
  MessageSquare, 
  Mic, 
  Hand, 
  Keyboard, 
  Settings, 
  Volume2, 
  PenTool, 
  Eye, 
  Info,
  ChevronLeft
} from 'lucide-react';
import { Mode } from './types';
import STTView from './components/STTView';
import TTSView from './components/TTSView';
import SignLanguageView from './components/SignLanguageView';
import BrailleView from './components/BrailleView';
import HandwritingView from './components/HandwritingView';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('lg');

  // Accessibility toggle helpers
  const toggleContrast = () => setHighContrast(prev => !prev);
  const cycleFontSize = () => {
    const sizes: ('md' | 'lg' | 'xl')[] = ['md', 'lg', 'xl'];
    const next = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
    setFontSize(next);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleModeChange = (mode: Mode | null) => {
    setActiveMode(mode);
    if (mode) {
      speak(`${mode.replace('-', ' ')} mode activated`);
    } else {
      speak("Returned to main menu");
    }
  };

  const fontSizeClass = {
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  }[fontSize];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    } ${fontSizeClass}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 p-4 border-b flex justify-between items-center ${
        highContrast ? 'border-white bg-black' : 'border-slate-200 bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          {activeMode && (
            <button 
              onClick={() => handleModeChange(null)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Back to menu"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          <h1 className="font-bold text-2xl tracking-tight flex items-center gap-2">
            <span className="text-blue-600">Bridge</span>Voice
          </h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleContrast}
            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
              highContrast ? 'border-white bg-white text-black' : 'border-slate-300 bg-slate-100'
            }`}
            title="Toggle High Contrast"
          >
            <Eye className="w-6 h-6" />
            <span className="hidden md:inline font-bold">Contrast</span>
          </button>
          <button 
            onClick={cycleFontSize}
            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
              highContrast ? 'border-white bg-white text-black' : 'border-slate-300 bg-slate-100'
            }`}
            title="Adjust Text Size"
          >
            <Settings className="w-6 h-6" />
            <span className="hidden md:inline font-bold">Text Size</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        {!activeMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ModeCard 
              icon={<Mic className="w-12 h-12" />}
              title="Speech to Text"
              description="Transcribe spoken language in real-time."
              onClick={() => handleModeChange(Mode.SPEECH_TO_TEXT)}
              highContrast={highContrast}
              color="bg-blue-600"
            />
            <ModeCard 
              icon={<Volume2 className="w-12 h-12" />}
              title="Text to Speech"
              description="Convert typed text into natural audio."
              onClick={() => handleModeChange(Mode.TEXT_TO_SPEECH)}
              highContrast={highContrast}
              color="bg-emerald-600"
            />
            <ModeCard 
              icon={<Hand className="w-12 h-12" />}
              title="Sign Language"
              description="Recognize and translate gestures into words."
              onClick={() => handleModeChange(Mode.SIGN_LANGUAGE)}
              highContrast={highContrast}
              color="bg-purple-600"
            />
            <ModeCard 
              icon={<Keyboard className="w-12 h-12" />}
              title="Braille Support"
              description="Translate text to Braille and back."
              onClick={() => handleModeChange(Mode.BRAILLE)}
              highContrast={highContrast}
              color="bg-amber-600"
            />
            <ModeCard 
              icon={<PenTool className="w-12 h-12" />}
              title="Handwriting"
              description="Convert handwritten notes to text."
              onClick={() => handleModeChange(Mode.HANDWRITING)}
              highContrast={highContrast}
              color="bg-rose-600"
            />
            <div className={`p-8 rounded-3xl border-4 flex flex-col justify-center gap-4 ${
              highContrast ? 'border-dashed border-white' : 'border-dashed border-slate-200 bg-slate-50'
            }`}>
              <h2 className="font-bold text-2xl flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-500" />
                Our Mission
              </h2>
              <p className="opacity-80 leading-relaxed">
                Empowering every person to feel connected. Our human-centered design prioritizes dignity and autonomy.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {activeMode === Mode.SPEECH_TO_TEXT && <STTView highContrast={highContrast} />}
            {activeMode === Mode.TEXT_TO_SPEECH && <TTSView highContrast={highContrast} />}
            {activeMode === Mode.SIGN_LANGUAGE && <SignLanguageView highContrast={highContrast} />}
            {activeMode === Mode.BRAILLE && <BrailleView highContrast={highContrast} />}
            {activeMode === Mode.HANDWRITING && <HandwritingView highContrast={highContrast} />}
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      {!activeMode && (
        <footer className={`p-4 text-center opacity-60 text-sm ${highContrast ? 'text-white' : 'text-slate-500'}`}>
          BridgeVoice v1.0.0 • Empowering Communication
        </footer>
      )}
    </div>
  );
};

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  highContrast: boolean;
  color: string;
}

const ModeCard: React.FC<ModeCardProps> = ({ icon, title, description, onClick, highContrast, color }) => (
  <button 
    onClick={onClick}
    className={`group relative p-8 rounded-3xl border-4 transition-all text-left flex flex-col h-64 overflow-hidden ${
      highContrast 
        ? 'border-white bg-black hover:bg-white hover:text-black' 
        : `border-transparent bg-white shadow-xl hover:-translate-y-2 hover:shadow-2xl`
    }`}
  >
    <div className={`mb-auto p-4 rounded-2xl w-fit transition-colors ${
      highContrast ? 'bg-white text-black group-hover:bg-black group-hover:text-white' : `${color} text-white`
    }`}>
      {icon}
    </div>
    <div className="mt-4">
      <h3 className="font-bold text-2xl mb-2">{title}</h3>
      <p className="opacity-80 text-lg leading-snug">{description}</p>
    </div>
    {!highContrast && (
      <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform ${color}`} />
    )}
  </button>
);

export default App;
