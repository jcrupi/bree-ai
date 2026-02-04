import { useState, useCallback, useRef, useEffect } from 'react';
import { textToSpeech, playAudio } from '../utils/openai-audio';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  
  // Queue state
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const currentRateRef = useRef(1.1);
  const stopRequestedRef = useRef(false);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    queueRef.current = [];
    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0 || stopRequestedRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setIsSpeaking(true);

    while (queueRef.current.length > 0 && !stopRequestedRef.current) {
      const text = queueRef.current.shift()!;
      
      try {
        if (OPENAI_API_KEY && OPENAI_API_KEY.length > 5) {
          try {
            const audioBlob = await textToSpeech(text, 'shimmer', currentRateRef.current);
            if (stopRequestedRef.current) break;

            await new Promise<void>((resolve, reject) => {
              const audio = playAudio(audioBlob);
              audioRef.current = audio;
              audio.onended = () => {
                audioRef.current = null;
                resolve();
              };
              audio.onerror = () => {
                audioRef.current = null;
                reject(new Error('Audio playback error'));
              };
            });
            continue; // Move to next chunk
          } catch (err) {
            console.warn('OpenAI chunk failed, falling back to browser:', err);
          }
        }

        // Fallback to browser for this chunk
        await new Promise<void>((resolve) => {
          if (!synthRef.current) {
            resolve();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(text);
          const voices = synthRef.current.getVoices();
          const preferredVoices = ['Google US English', 'Samantha', 'Victoria', 'Microsoft Aria Online'];
          
          let voice = null;
          for (const name of preferredVoices) {
            voice = voices.find(v => v.name.includes(name));
            if (voice) break;
          }
          if (voice) utterance.voice = voice;
          
          utterance.rate = currentRateRef.current;
          utterance.pitch = 1.25;
          utterance.volume = 1.0;
          
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          
          synthRef.current.speak(utterance);
        });

      } catch (err) {
        console.error('Error processing speech chunk:', err);
      }
    }

    if (!stopRequestedRef.current) {
      setIsSpeaking(false);
    }
    isProcessingRef.current = false;
  }, []);

  const speak = useCallback((text: string, rate: number = 1.1) => {
    stop(); // Clear previous
    stopRequestedRef.current = false;
    currentRateRef.current = rate;
    
    // Split text into sentences for streaming feel
    const sentences = text
      .replace(/\[Sources:.*?\]/gi, '')
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    if (sentences.length === 0) return;

    queueRef.current = sentences;
    processQueue();
  }, [stop, processQueue]);

  const enqueue = useCallback((text: string, rate: number = 1.1) => {
    stopRequestedRef.current = false;
    currentRateRef.current = rate;

    const chunks = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    queueRef.current.push(...chunks);
    if (!isProcessingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  return {
    speak,
    enqueue,
    stop,
    isSpeaking,
    error
  };
}