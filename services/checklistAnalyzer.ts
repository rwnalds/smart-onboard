import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptSegment {
  speaker: 'agent' | 'client' | 'unknown';
  text: string;
}

export interface ChecklistItem {
  id: number;
  label: string;
  description?: string;
}

export interface ChecklistCompletion {
  itemId: number;
  extractedInfo: string;
  confidence: number;
}

/**
 * Analyze recent transcript segments to identify completed checklist items
 */
export async function analyzeTranscriptForCompletions(
  recentTranscript: TranscriptSegment[],
  pendingItems: ChecklistItem[]
): Promise<ChecklistCompletion[]> {
  if (pendingItems.length === 0 || recentTranscript.length === 0) {
    return [];
  }

  // Only analyze client responses (they provide the information)
  const clientSegments = recentTranscript.filter((seg) => seg.speaker === 'client');

  if (clientSegments.length === 0) {
    return [];
  }

  const transcriptText = recentTranscript
    .map((seg) => `${seg.speaker === 'agent' ? 'Agent' : 'Client'}: ${seg.text}`)
    .join('\n');

  const systemPrompt = `You are an expert at extracting structured information from sales conversations.

Your task: Identify which checklist items have been answered (directly or indirectly) in the conversation, and extract the relevant information the client provided.

Rules:
1. Only mark items as completed if the client ACTUALLY provided the information
2. Extract the exact words/numbers the client said
3. Don't make assumptions or fill in gaps
4. Assign confidence score: 1.0 (certain), 0.8-0.9 (very likely), 0.6-0.7 (possible), <0.6 (uncertain)
5. Only return items with confidence >= 0.8

Return JSON array of completed items in this exact format:
[
  {
    "item_id": <number>,
    "extracted_info": "<exact quote from client>",
    "confidence": <0.0-1.0>
  }
]

CRITICAL: Always return an array [], even if there's only one item. Never return a single object.`;

  const userPrompt = `Checklist items to check:
${pendingItems.map((item, idx) => `ID ${item.id}: ${item.label}${item.description ? ` - ${item.description}` : ''}`).join('\n')}

Recent conversation:
${transcriptText}

Which items were answered? Return JSON array only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistency
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(response);

    console.log('[ChecklistAnalyzer] AI response:', parsed);

    // Handle single object, array, or object with 'completions' key
    let completions: ChecklistCompletion[] = [];
    if (Array.isArray(parsed)) {
      completions = parsed;
    } else if (parsed.item_id !== undefined) {
      // Single object returned instead of array
      completions = [parsed];
    } else if (parsed.completions) {
      completions = parsed.completions;
    }

    console.log('[ChecklistAnalyzer] Parsed completions:', completions);

    // Filter by confidence threshold
    const filtered = completions.filter((c) => c.confidence >= 0.8);
    console.log('[ChecklistAnalyzer] Filtered completions (>= 0.8 confidence):', filtered);
    
    return filtered;
  } catch (error) {
    console.error('Checklist analysis error:', error);
    return [];
  }
}

/**
 * Simpler fallback: keyword matching for basic checklist items
 */
export function simpleChecklistMatcher(
  transcript: TranscriptSegment[],
  pendingItems: ChecklistItem[]
): ChecklistCompletion[] {
  const completions: ChecklistCompletion[] = [];
  const clientText = transcript
    .filter((seg) => seg.speaker === 'client')
    .map((seg) => seg.text)
    .join(' ')
    .toLowerCase();

  for (const item of pendingItems) {
    const keywords = item.label.toLowerCase().split(' ');

    // Check if keywords appear in client's responses
    const matchCount = keywords.filter((kw) => clientText.includes(kw)).length;
    const matchRatio = matchCount / keywords.length;

    if (matchRatio >= 0.7) {
      // Extract a snippet containing the keywords
      const snippet = transcript
        .filter((seg) => seg.speaker === 'client')
        .find((seg) => keywords.some((kw) => seg.text.toLowerCase().includes(kw)));

      if (snippet) {
        completions.push({
          itemId: item.id,
          extractedInfo: snippet.text.slice(0, 200),
          confidence: Math.min(matchRatio, 0.9),
        });
      }
    }
  }

  return completions;
}
