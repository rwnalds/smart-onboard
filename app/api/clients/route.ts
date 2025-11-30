import { db } from '@/db';
import { clients, callSessions } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/clients?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return corsResponse({ error: 'userId required' }, 400);
    }

    // Get all clients for user
    const userClients = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.lastContactedAt));

    // Get session counts for each client
    const clientsWithStats = await Promise.all(
      userClients.map(async (client) => {
        const [sessionCountResult] = await db
          .select({ count: count() })
          .from(callSessions)
          .where(eq(callSessions.clientId, client.id));

        return {
          ...client,
          sessionCount: sessionCountResult?.count || 0,
        };
      })
    );

    return corsResponse({ clients: clientsWithStats });
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// POST /api/clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, company, role, phone, linkedinUrl, notes, tags } = body;

    if (!userId || !name) {
      return corsResponse({ error: 'userId and name required' }, 400);
    }

    const { identifyOrCreateClient } = await import('@/services/clientIdentifier');
    const result = await identifyOrCreateClient(name, userId, { email });

    // If it's an existing client, update it
    if (!result.isNewClient) {
      await db.update(clients)
        .set({
          email: email || undefined,
          company: company || undefined,
          role: role || undefined,
          phone: phone || undefined,
          linkedinUrl: linkedinUrl || undefined,
          notes: notes || undefined,
          tags: tags || undefined,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, result.clientId));
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, result.clientId))
      .limit(1);

    return corsResponse({ client, isNew: result.isNewClient }, result.isNewClient ? 201 : 200);
  } catch (error) {
    console.error('Failed to create/update client:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
