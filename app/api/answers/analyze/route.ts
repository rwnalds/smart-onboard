import { analyzeAnswerQuality, detectClientPause } from '@/services/answerQualityAnalyzer';
import { NextRequest } from 'next/server';
import { corsResponse, handleCorsPreFlight } from '../../cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/answers/analyze
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentQuestion, recentTranscript, pauseThresholdMs } = body;

    if (!recentTranscript) {
      return corsResponse({ error: 'recentTranscript required' }, 400);
    }

    // Convert timestamp strings to Date objects (timestamps are serialized as strings in JSON)
    const normalizedTranscript = recentTranscript.map((seg: any) => ({
      ...seg,
      timestamp: seg.timestamp instanceof Date ? seg.timestamp : new Date(seg.timestamp)
    }));

    // Analyze answer quality
    const qualityResult = await analyzeAnswerQuality(currentQuestion || null, normalizedTranscript);

    // Detect pause after client speaks (server-side check)
    const hasServerPause = detectClientPause(normalizedTranscript, pauseThresholdMs || 2000);
    
    // Use client-side pause detection if provided (more accurate for real-time)
    const hasPause = body.hasClientPause !== undefined ? body.hasClientPause : hasServerPause;

    console.log('[API] Answer Analysis Debug:', {
      hasClientPause: body.hasClientPause,
      hasServerPause,
      finalHasPause: hasPause,
      transcriptLength: normalizedTranscript.length,
      lastSpeaker: normalizedTranscript[normalizedTranscript.length - 1]?.speaker
    });

    return corsResponse({
      quality: qualityResult,
      hasPause,
      hasServerPause,
      shouldGenerateQuestion: hasPause && qualityResult.hasAnswered && qualityResult.isSubstantial,
    });
  } catch (error) {
    console.error('Answer analysis error:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

