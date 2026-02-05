
export enum Mode {
  SPEECH_TO_TEXT = 'stt',
  TEXT_TO_SPEECH = 'tts',
  SIGN_LANGUAGE = 'sign',
  BRAILLE = 'braille',
  HANDWRITING = 'handwriting'
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system' | 'ai';
  timestamp: number;
}
