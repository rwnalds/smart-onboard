import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checklistItems, callSessions, organizationSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateNextQuestion } from '@/services/questionService';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/questions/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, completedItemIds, recentTranscript, previousQuestions } = body;

    if (!userId && !sessionId) {
      return corsResponse({ error: 'userId or sessionId required' }, 400);
    }

    // Get userId from session if not provided
    let finalUserId = userId;
    if (!finalUserId && sessionId) {
      const [session] = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.id, sessionId))
        .limit(1);
      finalUserId = session?.userId;
    }

    if (!finalUserId) {
      return corsResponse({ error: 'Could not determine user' }, 400);
    }

    // Get organization settings for this user
    const settings = await db.query.organizationSettings.findFirst({
      where: eq(organizationSettings.userId, finalUserId),
    });

    // Get checklist items for this user
    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.userId, finalUserId));

    // Build config from organization settings or use defaults
    const config = settings ? {
      name: settings.organizationName,
      industry: settings.industry || 'General',
      description: settings.description || 'AI-powered client intelligence',
      onboardingGoal: settings.onboardingGoal || 'Gather comprehensive client information',
      tone: settings.tone || 'Professional & Friendly',
      targetAudience: settings.targetAudience || 'Business clients',
      maxQuestions: settings.maxQuestions || 10,
    } : {
      name: 'Default',
      industry: 'General',
      description: 'AI-powered client onboarding',
      onboardingGoal: 'Gather comprehensive client information',
      tone: 'Professional & Friendly',
      targetAudience: 'Business clients',
      maxQuestions: 10,
    };

    // Generate next question using organization config
    const question = await generateNextQuestion(
      config as any,
      items as any[],
      completedItemIds || [],
      recentTranscript || [],
      0, // callDuration
      previousQuestions || []
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
