import { useState, useCallback, useRef } from 'react';
import { speechToText } from '../utils/openai-audio';

export function useSpeechToText() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if audio recording is supported
  const isSupported = typeof navigator !== 'undefined' && 
                      typeof navigator.mediaDevices !== 'undefined' && 
                      typeof navigator.mediaDevices.getUserMedia !== 'undefined';

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording not supported in this browser');
      return;
    }

    try {
      setError(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      setIsRecording(false);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      console.error('Recording error:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve('');
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        try {
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          
          // Create blob from recorded chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          
          // Transcribe using OpenAI
          const text = await speechToText(audioBlob);
          setIsTranscribing(false);
          resolve(text);
        } catch (err) {
          setIsTranscribing(false);
          setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
          console.error('STT error:', err);
          resolve('');
        }
      };
      
      mediaRecorder.stop();
      mediaRecorderRef.current = null;
    });
  }, [isRecording]);

  return {
    startListening,
    stopListening,
    isRecording,
    isTranscribing,
    error,
    isSupported
  };
}