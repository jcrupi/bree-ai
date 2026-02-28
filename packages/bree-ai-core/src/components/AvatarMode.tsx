import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MicIcon, SendIcon, SparklesIcon } from 'lucide-react';
import { SpeakingAvatar } from './SpeakingAvatar';

interface AvatarModeProps {
  isSpeaking: boolean;
  onClose: () => void;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  onVoiceInput: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  micSupported: boolean;
  currentResponse?: string;
  onStopSpeaking: () => void;
  brandLogo: string;
  brandColor: string;
  suggestedBubbles?: Array<{ id: string; text: string; active: boolean }>;
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
  onStopSpeaking,
  brandLogo,
  brandColor,
  suggestedBubbles = [],
}: AvatarModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8"
    >
      {/* Close */}
      <div className="w-full flex justify-end">
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 rounded-full text-slate-400 hover:text-white transition-all"
        >
          <XIcon size={20} />
        </motion.button>
      </div>

      {/* Avatar */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Ambient glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20 scale-150"
            style={{ backgroundColor: brandColor }}
          />
          <div
            onClick={() => isSpeaking && onStopSpeaking()}
            className={isSpeaking ? 'cursor-pointer active:scale-95 transition-transform' : ''}
          >
            <SpeakingAvatar
              isSpeaking={isSpeaking}
              size="lg"
              imageUrl={brandLogo}
              alt="AI Avatar"
            />
          </div>

          {/* Speaking waveform */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listening indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <span className="text-red-400 text-sm font-medium animate-pulse">🎤 Listening…</span>
              </motion.div>
            )}
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <span className="text-slate-400 text-sm font-medium">💭 Thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat input area */}
      <div className="w-full max-w-2xl space-y-4">
        {/* Suggested bubbles */}
        {suggestedBubbles.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedBubbles.slice(0, 3).map((bubble) => (
              <motion.button
                key={bubble.id}
                onClick={() => onSend(bubble.text)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full text-sm border flex items-center gap-2 transition-all cursor-pointer bg-slate-800/60 text-slate-300 border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-500/10 backdrop-blur-sm"
              >
                <SparklesIcon className="w-3.5 h-3.5" style={{ color: brandColor }} />
                {bubble.text}
              </motion.button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex gap-3 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 p-2 rounded-2xl shadow-2xl">
          {micSupported && (
            <motion.button
              onClick={onVoiceInput}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <MicIcon size={20} />
            </motion.button>
          )}
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Ask a question…"
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 text-base px-3 py-2 resize-none"
          />
          <motion.button
            onClick={() => onSend()}
            disabled={!input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-40 text-white"
            style={{ backgroundColor: brandColor }}
          >
            <SendIcon size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
