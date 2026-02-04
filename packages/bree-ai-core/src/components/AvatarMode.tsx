import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MicIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { currentBrand } from '../config/branding';
import { SpeakingAvatar } from './SpeakingAvatar';

interface AvatarModeProps {
  isSpeaking: boolean;
  onClose: () => void;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onVoiceInput: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  micSupported: boolean;
  currentResponse?: string;
  onStopSpeaking: () => void;
  brandLogo: string;
  brandColor: string;
}

export function AvatarMode({
  isSpeaking,
  onClose,
  input,
  onInputChange,
  onSend,
  onVoiceInput,
  isRecording,
  isTranscribing,
  micSupported,
  currentResponse,
  onStopSpeaking,
  brandLogo,
  brandColor
}: AvatarModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-black"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
      >
        <XIcon size={24} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl text-center space-y-12">
        <div className="relative">
          <div 
            onClick={() => isSpeaking && onStopSpeaking()}
            className={isSpeaking ? "cursor-pointer active:scale-95 transition-transform" : ""}
          >
            <SpeakingAvatar 
              isSpeaking={isSpeaking} 
              size="lg"
              imageUrl={brandLogo}
              alt="AI Avatar"
            />
          </div>
          {isSpeaking && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div className="flex gap-1.5 justify-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 24, 4], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response Area */}
        <div className="w-full max-h-64 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentResponse ? (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg text-black leading-relaxed px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                {currentResponse}
              </motion.div>
            ) : (
              <motion.p
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-slate-600 text-base italic"
              >
                {isRecording ? "🎤 Listening..." : isTranscribing ? "💭 Thinking..." : "Ask me anything..."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full flex gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          {micSupported && (
            <button
              onClick={onVoiceInput}
              className={`p-4 rounded-xl transition-all ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <MicIcon size={24} />
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-black placeholder-slate-400 text-lg px-4"
          />
          <button
            onClick={onSend}
            disabled={!input.trim()}
            className="p-4 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-500 transition-colors"
          >
            <SendIcon size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
