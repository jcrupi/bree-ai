/**
 * OpenAI Audio Utilities
 * Provides text-to-speech and speech-to-text functionality
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      speed: speed
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
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
  }
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.text;
}