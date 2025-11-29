import OpenAI from 'openai';
import type { AgencyConfig } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptSegment {
  speaker: 'agent' | 'client' | 'unknown';
  text: string;
  timestamp: Date;
}

export interface ChecklistItem {
  id: number;
  label: string;
  description?: string;
  category?: string;
  required: boolean;
}

export interface QuestionPrompt {
  prompt: string;
  category?: string;
  reasoning?: string;
}

/**
 * Generate next question suggestion based on conversation context
 */
export async function generateNextQuestion(
  agencyConfig: AgencyConfig,
  checklist: ChecklistItem[],
  completedItemIds: number[],
  recentTranscript: TranscriptSegment[],
  callDuration: number
): Promise<QuestionPrompt> {
  const pendingItems = checklist.filter((item) => !completedItemIds.includes(item.id));
  const requiredPending = pendingItems.filter((item) => item.required);

  // Format transcript for context
  const transcriptText = recentTranscript
    .slice(-10) // Last 10 messages
    .map((seg) => `${seg.speaker === 'agent' ? 'Agent' : 'Client'}: ${seg.text}`)
    .join('\n');

  const systemPrompt = `You are an AI assistant helping a ${agencyConfig.industry} sales agent conduct a client onboarding call.

Your goal: ${agencyConfig.onboardingGoal}
Tone: ${agencyConfig.tone}
Target audience: ${agencyConfig.targetAudience}

Based on the conversation so far, suggest the MOST NATURAL next question for the agent to ask to gather information about the remaining checklist items.

Rules:
1. Questions should feel conversational and build on what the client just said
2. Reference the client's words when possible
3. Prioritize required checklist items
4. Don't repeat information already covered
5. Keep questions open-ended to encourage dialogue
6. Maximum 1-2 sentences
7. Sound like a professional ${agencyConfig.tone} consultant, NOT a robot

Remaining checklist items to cover:
${requiredPending
  .map(
    (item) =>
      `- ${item.label}${item.description ? ` (${item.description})` : ''} [REQUIRED]`
  )
  .join('\n')}
${pendingItems
  .filter((item) => !item.required)
  .map((item) => `- ${item.label}${item.description ? ` (${item.description})` : ''}`)
  .join('\n')}`;

  const userPrompt = `Recent conversation:
${transcriptText}

What should the agent ask next? Provide:
1. The exact question to ask (natural, conversational)
2. Which checklist item it addresses
3. Brief reasoning (1 sentence)

Format:
QUESTION: [your question]
ADDRESSES: [checklist item label]
REASONING: [why this question now]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content || '';

    // Parse response
    const questionMatch = response.match(/QUESTION:\s*(.+?)(?=\n|$)/);
    const addressesMatch = response.match(/ADDRESSES:\s*(.+?)(?=\n|$)/);
    const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=\n|$)/);

    const prompt = questionMatch ? questionMatch[1].trim() : response;
    const category = addressesMatch ? addressesMatch[1].trim() : undefined;
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : undefined;

    return {
      prompt,
      category,
      reasoning,
    };
  } catch (error) {
    console.error('Question generation error:', error);
    // Fallback to simple question
    if (requiredPending.length > 0) {
      return {
        prompt: `Can you tell me more about ${requiredPending[0].label.toLowerCase()}?`,
        category: requiredPending[0].label,
      };
    }
    return {
      prompt: 'What else should I know about your business?',
    };
  }
}
