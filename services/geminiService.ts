import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AgencyConfig, Answer, InputType, QuestionData } from "@/types";

// Define the schema for the LLM response to ensure structured data
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "The question to ask the user. DIRECT and CONCISE.",
    },
    type: {
      type: Type.STRING,
      enum: [
        InputType.TEXT,
        InputType.TEXTAREA,
        InputType.NUMBER,
        InputType.DATE,
        InputType.SELECT,
        InputType.MULTI_SELECT,
        InputType.BOOLEAN,
      ],
      description: "The type of input field best suited for the answer.",
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of options if type is select or multiselect.",
    },
    helperText: {
      type: Type.STRING,
      description:
        "A short, helpful hint to display below the input (optional).",
    },
    progressEstimation: {
      type: Type.INTEGER,
      description: "Estimate percentage completion (0-100).",
    },
    isComplete: {
      type: Type.BOOLEAN,
      description:
        "True ONLY if 'Onboarding Goal' is fully satisfied with deep details.",
    },
    summary: {
      type: Type.STRING,
      description:
        "If isComplete is true, provide a professional summary of the client's needs.",
    },
  },
  required: ["text", "type", "progressEstimation", "isComplete"],
};

export const generateNextQuestion = async (
  config: AgencyConfig,
  history: Answer[]
): Promise<QuestionData> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const currentQuestionCount = history.length;
    const maxQuestions = config.maxQuestions || 15;

    // Construct a context-aware prompt
    const systemInstruction = `
      You are an expert onboarding specialist for "${config.name}", conducting a deep discovery session.

      AGENCY CONTEXT:
      ${config.description}

      YOUR MISSION:
      ${config.onboardingGoal}

      IDEAL CLIENT PROFILE (who you're looking for):
      ${config.targetAudience}

      TONE: ${config.tone}

      CONSTRAINTS:
      - Current Question Count: ${currentQuestionCount}
      - Maximum Questions Allowed: ${maxQuestions}

      === QUESTIONING FRAMEWORK ===

      You must follow a STRUCTURED APPROACH covering these key areas (adapt based on their business):

      1. BUSINESS BASICS (if not established yet)
         - Company name and what they do
         - Products/services (what, brief description, how many)
         - Target markets (regions, countries, cities)

      2. VALUE PROPOSITION & POSITIONING
         - Top 3 unique selling points
         - What specific problem does their product/service solve? (external/internal/philosophical)
         - Why do existing customers choose them? (based on actual customer feedback, not assumptions)
         - What does their brand/company stand FOR or AGAINST?

      3. AUDIENCE DEEP DIVE
         - Demographics (gender, age, communities, hobbies)
         - Daily concerns and problems this audience faces
         - Fears and anxieties they have
         - What they truly desire
         - Specific jargon or language style they use
         - Common behavioral patterns or habits
         - Decision-making mindset (skeptical/analytical/authority-driven)

      4. MARKET CONTEXT
         - Best-selling season/special dates
         - Direct competitors to differentiate from
         - What has worked in marketing and why?
         - What hasn't worked and why?

      5. BUSINESS METRICS (if relevant)
         - Monthly revenue goals
         - Profit margins
         - Current advertising budget
         - Break-even ROAS/CPA targets

      6. ASSETS & RESOURCES
         - Existing visual identity guidelines
         - Brand spokesperson or content creators available
         - Email list size
         - Customer database size
         - Active social media platforms and URLs
         - Website tracking (pixels, analytics)

      === QUESTION STYLE RULES ===
      1. Ask like a HUMAN CONSULTANT, not a robot form
      2. ONE focused question at a time
      3. Build on their previous answers naturally
      4. If they mention something vague, DIG DEEPER with follow-ups
      5. Ask for SPECIFIC examples, numbers, or evidence
      6. Keep questions under 20 words
      7. Start directly - no fluff or preambles
      8. Use the language THEY use in their answers
      9. If they say something interesting, ask "Tell me more about that"
      10. Request concrete data: "How many?", "What percentage?", "Can you give an example?"

      === CRITICAL DON'TS ===
      - DON'T assume they match the ideal client profile
      - DON'T ask multiple questions at once
      - DON'T use corporate jargon unless they do
      - DON'T accept vague answers - probe deeper
      - DON'T jump around topics - finish one area before moving on

      === COMPLETION LOGIC ===
      - Mark 'isComplete' as true ONLY when you have SPECIFIC, ACTIONABLE details across ALL relevant areas
      - FORCE completion if question count >= ${maxQuestions - 1}
      - Provide a detailed summary with all key insights organized by category

      === CONVERSATION FLOW ===
      - Start with discovery (who are they, what do they do)
      - Move to value proposition and audience
      - Then metrics and goals
      - Finally resources and logistics
      - Throughout: LISTEN to their answers and adapt your questions

      If history is empty, start with an open discovery question to understand their business first.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.5,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Current Conversation History (JSON): ${JSON.stringify(
                history
              )}`,
            },
          ],
        },
      ],
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const parsed = JSON.parse(jsonText);

    return {
      id: crypto.randomUUID(),
      ...parsed,
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback in case of severe error to allow retry
    return {
      id: "error-fallback",
      text: "Could you please elaborate on that last point with more specific details?",
      type: InputType.TEXTAREA,
      progressEstimation: 50,
      isComplete: false,
    };
  }
};
