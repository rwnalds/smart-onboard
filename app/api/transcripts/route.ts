import { db } from '@/db';
import { transcriptSegments } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

export async function OPTIONS() {
  return handleCorsPreFlight();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, clientId, segments } = body;

    if (!sessionId || !segments || !Array.isArray(segments)) {
      return corsResponse({ error: 'sessionId and segments array required' }, 400);
    }

    // Insert transcript segments
    const insertedSegments = await db.insert(transcriptSegments).values(
      segments.map((seg: any) => ({
        callSessionId: sessionId,
        clientId: clientId || null,
        speaker: seg.speaker,
        text: seg.text,
        timestamp: new Date(seg.timestamp || Date.now()),
        confidence: seg.confidence || null,
        createdAt: new Date(),
      }))
    ).returning();

    console.log('[Transcripts] Stored segments:', {
      sessionId,
      clientId,
      count: insertedSegments.length,
    });

    return corsResponse({ 
      success: true,
      count: insertedSegments.length 
    });
  } catch (error) {
    console.error('Transcript storage error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const clientId = searchParams.get('clientId');

    if (!sessionId && !clientId) {
      return corsResponse({ error: 'sessionId or clientId required' }, 400);
    }

    let segments;

    if (sessionId) {
      segments = await db
        .select()
        .from(transcriptSegments)
        .where(eq(transcriptSegments.callSessionId, sessionId))
        .orderBy(asc(transcriptSegments.timestamp));
    } else if (clientId) {
      segments = await db
        .select()
        .from(transcriptSegments)
        .where(eq(transcriptSegments.clientId, clientId))
        .orderBy(desc(transcriptSegments.timestamp))
        .limit(100);
    }

    return corsResponse({ segments });
  } catch (error) {
    console.error('Transcript retrieval error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
