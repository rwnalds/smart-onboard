import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { generateRAGResponse } from '@/services/ragService';
import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/clients/[clientId]/chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return corsResponse({ error: 'userId and message required' }, 400);
    }

    // Store user message
    await db.insert(chatMessages).values({
      userId,
      clientId,
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    // Generate AI response using RAG
    const { response, context } = await generateRAGResponse(clientId, message, userId);

    // Store AI response
    await db.insert(chatMessages).values({
      userId,
      clientId,
      role: 'assistant',
      content: response,
      context: {
        sessionIds: context.sessions.map(s => s.id),
        transcriptIds: context.transcripts.map(t => t.id),
      },
      createdAt: new Date(),
    });

    return corsResponse({
      response,
      contextUsed: {
        transcriptCount: context.transcripts.length,
        insightCount: context.insights.length,
        sessionCount: context.sessions.length,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// GET /api/clients/[clientId]/chat - Get chat history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return corsResponse({ error: 'userId required' }, 400);
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.clientId, clientId),
        eq(chatMessages.userId, userId)
      ))
      .orderBy(chatMessages.createdAt);

    return corsResponse({ messages });
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
