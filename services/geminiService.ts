import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgencyConfig, Answer, InputType, QuestionData } from "../types";

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
      description: "A short, helpful hint to display below the input (optional).",
    },
    progressEstimation: {
      type: Type.INTEGER,
      description: "Estimate percentage completion (0-100).",
    },
    isComplete: {
      type: Type.BOOLEAN,
      description: "True ONLY if 'Onboarding Goal' is fully satisfied with deep details.",
    },
    summary: {
      type: Type.STRING,
      description: "If isComplete is true, provide a professional summary of the client's needs.",
    },
  },
  required: ["text", "type", "progressEstimation", "isComplete"],
};

export const generateNextQuestion = async (
  config: AgencyConfig,
  history: Answer[]
): Promise<QuestionData> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const currentQuestionCount = history.length;
    const maxQuestions = config.maxQuestions || 15;

    // Construct a context-aware prompt
    const systemInstruction = `
      You are an expert investigative onboarding agent for "${config.name}".

      AGENCY CONTEXT:
      Industry: ${config.industry}
      Description: ${config.description}
      Target Audience: ${config.targetAudience}
      Onboarding Goal: ${config.onboardingGoal}
      Tone: ${config.tone}

      CONSTRAINTS:
      - Current Question Count: ${currentQuestionCount}
      - Maximum Questions Allowed: ${maxQuestions}

      RULES FOR GENERATION:
      1. NO FLUFF: Start directly with the question.
      2. DIG DEEP: Do not accept surface-level answers. If the user mentions a problem, ask for specific metrics/tools/details.
      3. SHORT PROMPTS: Keep questions under 20 words.
      4. ONE THING AT A TIME: Ask only one distinct question.
      5. COMPLETION LOGIC: 
         - Set 'isComplete' to true if you have gathered specific, actionable details matching the Onboarding Goal.
         - FORCE COMPLETION if Current Question Count >= ${maxQuestions - 1}. In this case, ask one final wrap-up question or just mark complete if sufficient.
      6. TARGET AUDIENCE ADAPTATION: Frame questions specifically for ${config.targetAudience}. Use jargon appropriate for them.

      If history is empty, ask the most critical opening question immediately.
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
              text: `Current Conversation History (JSON): ${JSON.stringify(history)}`,
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
