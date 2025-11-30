import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callSessions, transcriptSegments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/sessions/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [session] = await db
      .select()
      .from(callSessions)
      .where(eq(callSessions.id, id));

    if (!session) {
      return corsResponse({ error: 'Session not found' }, 404);
    }

    // Also get transcript segments
    const segments = await db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.callSessionId, id))
      .orderBy(transcriptSegments.timestamp);

    return corsResponse({
      ...session,
      transcript: segments,
    });
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// PATCH /api/sessions/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, endedAt, duration, summary, clientName, clientEmail } = body;

    const updateData: any = { updatedAt: new Date() };

    if (status) updateData.status = status;
    if (endedAt) updateData.endedAt = new Date(endedAt);
    if (duration !== undefined) updateData.duration = duration;
    if (summary) updateData.summary = summary;
    if (clientName) updateData.clientName = clientName;
    if (clientEmail) updateData.clientEmail = clientEmail;

    const [updatedSession] = await db
      .update(callSessions)
      .set(updateData)
      .where(eq(callSessions.id, id))
      .returning();

    if (!updatedSession) {
      return corsResponse({ error: 'Session not found' }, 404);
    }

    return corsResponse(updatedSession);
  } catch (error) {
    console.error('Failed to update session:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
