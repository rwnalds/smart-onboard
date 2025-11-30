import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transcriptSegments } from '@/db/schema';
import { transcribeAudio, identifySpeaker } from '@/services/whisperService';
import { eq } from 'drizzle-orm';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/transcribe
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string;
    const timestamp = formData.get('timestamp') as string;

    if (!audioFile || !sessionId) {
      return corsResponse({ error: 'audio and sessionId required' }, 400);
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Get previous speaker to help with identification
    const previousSegments = await db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.callSessionId, sessionId))
      .orderBy(transcriptSegments.timestamp)
      .limit(5);

    const previousSpeaker =
      previousSegments.length > 0
        ? (previousSegments[previousSegments.length - 1].speaker as
            | 'agent'
            | 'client'
            | 'unknown')
        : 'unknown';

    // Get context for better accuracy
    const previousContext = previousSegments
      .map((seg) => seg.text)
      .join(' ')
      .slice(-200);

    // Transcribe
    const transcription = await transcribeAudio(audioBlob, {
      prompt: previousContext || undefined,
    });

    // Identify speaker
    const speaker = identifySpeaker(transcription.text, previousSpeaker);

    // Save to database
    const [segment] = await db
      .insert(transcriptSegments)
      .values({
        callSessionId: sessionId,
        speaker,
        text: transcription.text,
        timestamp: new Date(timestamp),
        confidence: 0.9, // Whisper doesn't return confidence in standard mode
      })
      .returning();

    return corsResponse({
      text: transcription.text,
      speaker,
      segmentId: segment.id,
      confidence: 0.9,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return corsResponse(
      {
        error: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      500
    );
  }
}
