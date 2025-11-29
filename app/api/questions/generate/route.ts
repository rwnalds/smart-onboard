import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agencyConfigs, checklistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateNextQuestion } from '@/services/questionService';
import { corsResponse, handleCorsPreFlight } from '../../cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/questions/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, completedItemIds, recentTranscript } = body;

    // For MVP, we'll use default agency config
    // In production, get from session -> userId -> agencyConfig
    const [config] = await db.select().from(agencyConfigs).limit(1);

    if (!config) {
      return corsResponse({ error: 'No agency config found' }, 404);
    }

    // Get checklist items
    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.agencyConfigId, config.id));

    // Generate next question
    const agencyConfig = {
      ...config,
      maxQuestions: config.maxQuestions || 10
    };

    const question = await generateNextQuestion(
      agencyConfig as any,
      items as any[],
      completedItemIds || [],
      recentTranscript || [],
      0 // callDuration
    );

    return corsResponse({
      id: Date.now(),
      prompt: question.prompt,
      category: question.category,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Question generation error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
