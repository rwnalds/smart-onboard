import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptSegment {
  speaker: 'agent' | 'client' | 'unknown';
  text: string;
  timestamp: Date;
}

export interface AnswerQualityResult {
  hasAnswered: boolean;
  confidence: number; // 0.0 - 1.0
  isSubstantial: boolean; // Is the answer substantial enough (not just "yes", "no", "maybe")
  reasoning?: string;
}

/**
 * Analyze if the client has actually answered the current question
 * Returns quality assessment of the client's response
 */
export async function analyzeAnswerQuality(
  currentQuestion: string | null,
  recentTranscript: TranscriptSegment[]
): Promise<AnswerQualityResult> {
  // If no question is being tracked, always return true (ready for next question)
  if (!currentQuestion) {
    return {
      hasAnswered: true,
      confidence: 1.0,
      isSubstantial: true,
    };
  }

  // Get recent client responses (last 5 segments from client)
  const clientResponses = recentTranscript
    .filter(seg => seg.speaker === 'client')
    .slice(-5);

  if (clientResponses.length === 0) {
    return {
      hasAnswered: false,
      confidence: 1.0,
      isSubstantial: false,
      reasoning: 'No client responses found',
    };
  }

  // Get context (agent question + client response)
  const agentSegments = recentTranscript.filter(seg => seg.speaker === 'agent').slice(-3);
  const conversationContext = [
    ...agentSegments.map(seg => `Agent: ${seg.text}`),
    ...clientResponses.map(seg => `Client: ${seg.text}`),
  ].join('\n');

  const clientResponseText = clientResponses.map(seg => seg.text).join(' ');

  const systemPrompt = `You are analyzing a sales conversation to determine if the client has adequately answered the agent's question.

Your task:
1. Determine if the client's response addresses the question asked
2. Assess if the answer is substantial (not just "yes", "no", "maybe", or non-committal)
3. Return confidence score based on answer quality

IMPORTANT RULES:
- An answer is "adequate" if it provides ANY information related to the question, even if tentative or partial
- An answer is "substantial" if it contains specific details, numbers, targets, examples, or explanations (even if prefaced with uncertainty like "if I had to guess" or "I haven't fully defined")
- ACCEPT partial answers: If a client says "I haven't fully decided, but I'm thinking X" or "not defined yet, but maybe Y" - this COUNTS as answering
- ACCEPT tentative answers: Phrases like "if I had to guess", "I'm thinking", "maybe around" still indicate they're providing information
- Low confidence ONLY if client completely deflected, said "I don't know" with no attempt, or gave no relevant information
- High confidence if client provided specific details (numbers, targets, timeframes, etc.) even if tentative

Examples of VALID answers (should return hasAnswered: true, isSubstantial: true):
- "I haven't defined it yet, but I'd like to reach 10,000 MRR" (provides specific target)
- "Not sure yet, maybe around $50k" (provides specific number)
- "If I had to guess, probably Q2 2024" (provides timeframe)
- "We're still figuring it out, but thinking 20% growth" (provides specific percentage)

Examples of INVALID answers (should return hasAnswered: false):
- "I don't know" (no information)
- "Maybe" (no details)
- "That's a good question" (deflection with no info)
- "Let me think about it" (no information provided)

Return JSON only:
{
  "hasAnswered": boolean,
  "confidence": 0.0-1.0,
  "isSubstantial": boolean,
  "reasoning": "brief explanation"
}`;

  const userPrompt = `Current question being asked: "${currentQuestion}"

Recent conversation:
${conversationContext}

Has the client adequately answered the question? Is the answer substantial?
Remember: Accept partial or tentative answers if they contain any specific information (numbers, targets, timeframes, etc.).`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for this analysis
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const result = JSON.parse(responseText) as AnswerQualityResult;

    // Fallback validation
    if (typeof result.hasAnswered !== 'boolean') {
      // Simple heuristic fallback: check if response is substantial (>20 chars, not just yes/no)
      const isLongEnough = clientResponseText.length > 20;
      const isNotJustYesNo = !/^(yes|no|maybe|i think so|probably|perhaps|i guess|not really|sort of|kinda)[\s.,!?]*$/i.test(clientResponseText.trim());

      return {
        hasAnswered: isLongEnough && isNotJustYesNo,
        confidence: (isLongEnough && isNotJustYesNo) ? 0.8 : 0.5,
        isSubstantial: isLongEnough && isNotJustYesNo,
        reasoning: 'Fallback analysis',
      };
    }

    // Log the analysis result for debugging
    console.log('[AnswerQuality] Analysis result:', {
      hasAnswered: result.hasAnswered,
      isSubstantial: result.isSubstantial,
      confidence: result.confidence,
      reasoning: result.reasoning,
      clientResponseLength: clientResponseText.length,
      clientResponsePreview: clientResponseText.substring(0, 100)
    });

    // Be more lenient: if confidence is provided but hasAnswered/isSubstantial are missing,
    // infer from confidence and response length
    const inferredHasAnswered = result.hasAnswered ?? (result.confidence ? result.confidence > 0.5 : true);
    const inferredIsSubstantial = result.isSubstantial ?? (clientResponseText.length > 30 && result.confidence ? result.confidence > 0.6 : true);

    return {
      hasAnswered: inferredHasAnswered,
      confidence: result.confidence ?? 0.8,
      isSubstantial: inferredIsSubstantial,
      reasoning: result.reasoning || 'Analyzed response',
    };
  } catch (error) {
    console.error('Answer quality analysis error:', error);
    
    // Fallback: simple heuristic
    const isLongEnough = clientResponseText.length > 20;
    const isNotJustYesNo = !/^(yes|no|maybe|i think so|probably|perhaps|i guess|not really|sort of|kinda)[\s.,!?]*$/i.test(clientResponseText.trim());

    return {
      hasAnswered: isLongEnough && isNotJustYesNo,
      confidence: 0.7,
      isSubstantial: isLongEnough && isNotJustYesNo,
      reasoning: 'Error in analysis, using fallback',
    };
  }
}

/**
 * Detect if there's been a pause after client speaks (client finished answering)
 */
export function detectClientPause(
  transcript: TranscriptSegment[],
  pauseThresholdMs: number = 2000 // 2 seconds
): boolean {
  if (transcript.length === 0) return false;

  const lastSegment = transcript[transcript.length - 1];
  
  // If last speaker was agent (not client), check if it's a turn switch (fallback)
  if (lastSegment.speaker !== 'client') {
    // Check if the agent just started speaking after the client
    // We need at least one preceding segment from the client
    const previousSegment = transcript[transcript.length - 2];
    if (previousSegment && previousSegment.speaker === 'client') {
      return true; // Agent took the floor, so client turn is done
    }
    return false;
  }

  // Check if enough time has passed since last client segment
  const now = new Date();
  const timeSinceLastClientSegment = now.getTime() - lastSegment.timestamp.getTime();

  return timeSinceLastClientSegment >= pauseThresholdMs;
}

