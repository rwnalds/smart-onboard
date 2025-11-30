import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
      with: {
        callSessions: {
          orderBy: (sessions, { desc }) => [desc(sessions.startedAt)],
          limit: 10,
        },
        insights: {
          orderBy: (insights, { desc }) => [desc(insights.updatedAt)],
        },
      },
    });

    if (!client) {
      return corsResponse({ error: 'Client not found' }, 404);
    }

    return corsResponse({ client });
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
