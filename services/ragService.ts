import { db } from '@/db';
import { callSessions, clientInsights, transcriptSegments } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RetrievedContext {
  transcripts: Array<{
    id: number;
    text: string;
    speaker: string;
    timestamp: Date;
    sessionId: string;
  }>;
  insights: Array<{
    category: string;
    key: string;
    value: string;
    confidence: number;
  }>;
  sessions: Array<{
    id: string;
    startedAt: Date;
    summary?: string | null;
  }>;
}

/**
 * Retrieve relevant context about a client for RAG
 */
export async function retrieveClientContext(
  clientId: string,
  query?: string,
  options: {
    maxTranscripts?: number;
    maxInsights?: number;
  } = {}
): Promise<RetrievedContext> {
  const { maxTranscripts = 50, maxInsights = 20 } = options;

  // Get recent transcripts
  const transcripts = await db.query.transcriptSegments.findMany({
    where: eq(transcriptSegments.clientId, clientId),
    orderBy: [desc(transcriptSegments.timestamp)],
    limit: maxTranscripts,
  });

  // Get client insights
  const insights = await db.query.clientInsights.findMany({
    where: eq(clientInsights.clientId, clientId),
    orderBy: [desc(clientInsights.updatedAt)],
    limit: maxInsights,
  });

  // Get session summaries
  const sessions = await db.query.callSessions.findMany({
    where: eq(callSessions.clientId, clientId),
    orderBy: [desc(callSessions.startedAt)],
    limit: 10,
  });

  return {
    transcripts: transcripts.map(t => ({
      id: t.id,
      text: t.text,
      speaker: t.speaker,
      timestamp: t.timestamp,
      sessionId: t.callSessionId,
    })),
    insights: insights.map(i => ({
      category: i.category,
      key: i.key,
      value: i.value,
      confidence: i.confidence,
    })),
    sessions: sessions.map(s => ({
      id: s.id,
      startedAt: s.startedAt,
      summary: s.summary,
    })),
  };
}

/**
 * Format context for AI prompt
 */
function formatContextForPrompt(context: RetrievedContext): string {
  let formatted = '';

  // Add insights
  if (context.insights.length > 0) {
    formatted += '## Client Information\n\n';
    const groupedInsights: Record<string, typeof context.insights> = {};
    
    context.insights.forEach(insight => {
      if (!groupedInsights[insight.category]) {
        groupedInsights[insight.category] = [];
      }
      groupedInsights[insight.category].push(insight);
    });

    Object.entries(groupedInsights).forEach(([category, insights]) => {
      formatted += `### ${category}\n`;
      insights.forEach(i => {
        formatted += `- ${i.key}: ${i.value}\n`;
      });
      formatted += '\n';
    });
  }

  // Add session summaries
  if (context.sessions.length > 0) {
    formatted += '## Previous Conversations\n\n';
    context.sessions.forEach((session, idx) => {
      formatted += `### Session ${idx + 1} (${session.startedAt.toLocaleDateString()})\n`;
      if (session.summary) {
        formatted += `${session.summary}\n\n`;
      }
    });
  }

  // Add recent transcript excerpts
  if (context.transcripts.length > 0) {
    formatted += '## Recent Conversation Excerpts\n\n';
    // Group by session
    const bySession: Record<string, typeof context.transcripts> = {};
    context.transcripts.forEach(t => {
      if (!bySession[t.sessionId]) {
        bySession[t.sessionId] = [];
      }
      bySession[t.sessionId].push(t);
    });

    Object.values(bySession).forEach(sessionTranscripts => {
      sessionTranscripts.slice(0, 10).forEach(t => {
        formatted += `**${t.speaker}**: ${t.text}\n`;
      });
      formatted += '\n';
    });
  }

  return formatted;
}

/**
 * Generate AI response using RAG
 */
export async function generateRAGResponse(
  clientId: string,
  query: string,
  userId: string
): Promise<{
  response: string;
  context: RetrievedContext;
}> {
  // Retrieve relevant context
  const context = await retrieveClientContext(clientId, query);

  // Format context for prompt
  const formattedContext = formatContextForPrompt(context);

  // Generate response
  const systemPrompt = `You are an AI assistant helping a sales/onboarding agent understand their client better.

You have access to the following information about the client:

${formattedContext}

Answer the user's question based on this information. Be specific and cite what you know. If you don't have enough information to answer, say so clearly.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    temperature: 0.3,
  });

  const response = completion.choices[0].message.content || 'I could not generate a response.';

  console.log('[RAG] Generated response:', {
    clientId,
    query,
    contextSize: {
      transcripts: context.transcripts.length,
      insights: context.insights.length,
      sessions: context.sessions.length,
    },
  });

  return {
    response,
    context,
  };
}

/**
 * Extract and store client insights from transcripts
 */
export async function extractClientInsights(
  clientId: string,
  sessionId: string
): Promise<void> {
  // Get all transcripts for this session
  const sessionTranscripts = await db.query.transcriptSegments.findMany({
    where: and(
      eq(transcriptSegments.callSessionId, sessionId),
      eq(transcriptSegments.speaker, 'client')
    ),
  });

  if (sessionTranscripts.length === 0) {
    return;
  }

  const transcriptText = sessionTranscripts.map(t => t.text).join(' ');

  const systemPrompt = `Extract structured information about the client from this conversation.

Categories to extract:
- business_info: Company name, industry, size, revenue, etc.
- goals: Business goals, growth targets, objectives
- budget: Marketing budget, spending, financial constraints
- pain_points: Problems, challenges, frustrations
- tech_stack: Tools, platforms, technologies they use

Return JSON array of insights:
[
  {
    "category": "business_info",
    "key": "monthly_revenue",
    "value": "5-5.5K MRR",
    "confidence": 0.9
  }
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcriptText },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(response);
    const insights = Array.isArray(parsed) ? parsed : parsed.insights || [];

    // Store insights
    for (const insight of insights) {
      if (insight.confidence >= 0.7) {
        await db.insert(clientInsights).values({
          clientId,
          category: insight.category,
          key: insight.key,
          value: insight.value,
          confidence: insight.confidence,
          sourceSessionId: sessionId,
          extractedAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    console.log('[RAG] Extracted insights:', {
      clientId,
      sessionId,
      count: insights.length,
    });
  } catch (error) {
    console.error('[RAG] Failed to extract insights:', error);
  }
}
