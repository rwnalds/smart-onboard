import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string; // Context from previous segments for better accuracy
  temperature?: number;
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  try {
    // Convert Blob to File (Whisper API requires File object)
    const audioFile = new File([audioBlob], 'audio.webm', {
      type: audioBlob.type || 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: options.language || 'en',
      prompt: options.prompt,
      temperature: options.temperature || 0,
      response_format: 'verbose_json', // Get confidence scores
    });

    return {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(
      `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Transcribe with speaker diarization hint
 * Uses prompt engineering to help identify different speakers
 */
export async function transcribeWithSpeakerHint(
  audioBlob: Blob,
  previousContext?: string
): Promise<TranscriptionResult> {
  const prompt = previousContext
    ? `Previous conversation: ${previousContext.slice(-200)}. Continue transcription with speaker identification.`
    : 'Transcribe the conversation between a sales agent and a client.';

  return transcribeAudio(audioBlob, {
    prompt,
    temperature: 0.2, // Slightly higher for better speaker understanding
  });
}

/**
 * Simple speaker identification based on audio patterns
 * This is a placeholder - for production, you'd use a dedicated diarization service
 */
export function identifySpeaker(
  text: string,
  previousSpeaker: 'agent' | 'client' | 'unknown'
): 'agent' | 'client' | 'unknown' {
  // Simple heuristic: questions are likely from agent
  const hasQuestion = text.includes('?');
  const hasGreeting = /^(hi|hello|hey|good morning|good afternoon)/i.test(text);

  // First speaker is assumed to be agent
  if (previousSpeaker === 'unknown') {
    return hasGreeting || hasQuestion ? 'agent' : 'client';
  }

  // Alternate speakers (simple approach)
  // In production, use voice fingerprinting or dedicated diarization
  return previousSpeaker === 'agent' ? 'client' : 'agent';
}
