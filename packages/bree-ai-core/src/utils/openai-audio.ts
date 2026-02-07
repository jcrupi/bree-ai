/**
 * OpenAI Audio Utilities
 * Provides text-to-speech and speech-to-text functionality
 */

import { API_URL } from './api-client';

/**
 * Convert text to speech using OpenAI TTS API
 * @param text - The text to convert to speech
 * @param voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @returns Audio blob
 */
export async function textToSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  speed: number = 1.0
): Promise<Blob> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bree_jwt') : null;

  const response = await fetch(`${API_URL}/api/openai/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      text,
      voice,
      speed
    })
  });
  if (!response.ok) {
    throw new Error(`TTS API error: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Play audio from a blob
 * @param audioBlob - The audio blob to play
 * @returns Audio element for control
 */
export function playAudio(audioBlob: Blob): HTMLAudioElement {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  audio.play();
  return audio;
}

/**
 * Convert speech to text using OpenAI Whisper API
 * @param audioBlob - The audio blob to transcribe
 * @returns Transcribed text
 */
export async function speechToText(audioBlob: Blob): Promise<string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bree_jwt') : null;
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  const response = await fetch(`${API_URL}/api/openai/stt`, {
    method: 'POST',
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.text || '';
}
