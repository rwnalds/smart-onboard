import { db } from '@/db';
import { clients, callSessions, clientInsights } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/clients/[clientId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    // Get client
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return corsResponse({ error: 'Client not found' }, 404);
    }

    // Get recent call sessions
    const sessions = await db
      .select()
      .from(callSessions)
      .where(eq(callSessions.clientId, clientId))
      .orderBy(desc(callSessions.startedAt))
      .limit(10);

    // Get insights
    const insights = await db
      .select()
      .from(clientInsights)
      .where(eq(clientInsights.clientId, clientId))
      .orderBy(desc(clientInsights.updatedAt));

    return corsResponse({
      client: {
        ...client,
        callSessions: sessions,
        insights: insights,
      },
    });
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// PATCH /api/clients/[clientId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    const { name, email, company, role, phone, linkedinUrl, notes, tags } = body;

    const updated = await db.update(clients)
      .set({
        name: name || undefined,
        email: email || undefined,
        company: company || undefined,
        role: role || undefined,
        phone: phone || undefined,
        linkedinUrl: linkedinUrl || undefined,
        notes: notes || undefined,
        tags: tags || undefined,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))
      .returning();

    if (updated.length === 0) {
      return corsResponse({ error: 'Client not found' }, 404);
    }

    return corsResponse({ client: updated[0] });
  } catch (error) {
    console.error('Failed to update client:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
