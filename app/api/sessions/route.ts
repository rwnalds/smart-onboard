import { db } from '@/db';
import { callSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/sessions?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return corsResponse({ error: 'userId required' }, 400);
    }

    const sessions = await db
      .select()
      .from(callSessions)
      .where(eq(callSessions.userId, userId))
      .orderBy(callSessions.startedAt);

    return corsResponse(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// POST /api/sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, meetingUrl, clientName } = body;

    if (!userId) {
      return corsResponse({ error: 'userId required' }, 400);
    }

    const sessionId = nanoid();
    
    // Auto-identify or create client if clientName provided
    let clientId: string | null = null;
    if (clientName) {
      const { identifyOrCreateClient } = await import('@/services/clientIdentifier');
      const result = await identifyOrCreateClient(clientName, userId);
      clientId = result.clientId;
      
      console.log('[Sessions] Client identified:', {
        clientName,
        clientId,
        isNew: result.isNewClient,
        confidence: result.confidence,
      });
    }

    const [newSession] = await db
      .insert(callSessions)
      .values({
        id: sessionId,
        userId,
        meetingUrl,
        clientId,
        clientName,
        status: 'active',
      })
      .returning();

    return corsResponse(newSession, 201);
  } catch (error) {
    console.error('Failed to create session:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
