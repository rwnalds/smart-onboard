import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscriptForCompletions } from '@/services/checklistAnalyzer';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/checklist/analyze
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recentTranscript, pendingItems } = body;

    if (!recentTranscript || !pendingItems) {
      return corsResponse({ error: 'recentTranscript and pendingItems required' }, 400);
    }

    // Analyze transcript for checklist completions
    const completedItems = await analyzeTranscriptForCompletions(
      recentTranscript,
      pendingItems
    );

    return corsResponse({ completedItems });
  } catch (error) {
    console.error('Checklist analysis error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}
