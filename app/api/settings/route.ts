import { NextRequest } from 'next/server';
import { db } from '@/db';
import { organizationSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/settings?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return corsResponse({ error: 'userId required' }, 400);
    }

    const settings = await db.query.organizationSettings.findFirst({
      where: eq(organizationSettings.userId, userId),
    });

    if (!settings) {
      // Return default settings structure
      return corsResponse({
        organizationName: '',
        industry: '',
        description: '',
        targetAudience: '',
        onboardingGoal: '',
        tone: 'Professional & Friendly',
        maxQuestions: 10,
        customInstructions: '',
      });
    }

    return corsResponse(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// POST /api/settings (Create or Update)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      organizationName,
      industry,
      description,
      targetAudience,
      onboardingGoal,
      tone,
      maxQuestions,
      customInstructions,
    } = body;

    if (!userId || !organizationName) {
      return corsResponse({ error: 'userId and organizationName required' }, 400);
    }

    // Check if settings exist
    const existing = await db.query.organizationSettings.findFirst({
      where: eq(organizationSettings.userId, userId),
    });

    let result;

    if (existing) {
      // Update existing settings
      [result] = await db
        .update(organizationSettings)
        .set({
          organizationName,
          industry,
          description,
          targetAudience,
          onboardingGoal,
          tone,
          maxQuestions,
          customInstructions,
          updatedAt: new Date(),
        })
        .where(eq(organizationSettings.userId, userId))
        .returning();
    } else {
      // Create new settings
      [result] = await db
        .insert(organizationSettings)
        .values({
          userId,
          organizationName,
          industry,
          description,
          targetAudience,
          onboardingGoal,
          tone,
          maxQuestions,
          customInstructions,
        })
        .returning();
    }

    return corsResponse(result, existing ? 200 : 201);
  } catch (error) {
    console.error('Failed to save settings:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
