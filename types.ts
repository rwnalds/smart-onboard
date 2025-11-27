export enum InputType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multiselect',
  BOOLEAN = 'boolean',
}

export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface AgencyConfig {
  name: string;
  industry: string;
  description: string;
  onboardingGoal: string;
  tone: string;
  targetAudience: string; // Context for who the client is
  maxQuestions: number; // Hard limit on conversation length
  theme: ThemeConfig; // Visual customization
}

export interface QuestionData {
  id: string;
  text: string;
  type: InputType;
  options?: string[]; // For select/multiselect
  helperText?: string;
  progressEstimation: number; // 0 to 100
  isComplete: boolean; // True if the AI thinks it has enough info
  summary?: string; // Final summary if complete
}

export interface Answer {
  questionId: string;
  questionText: string;
  value: string | string[] | number | boolean;
}

export interface Submission {
  id: string;
  timestamp: number;
  answers: Answer[];
  summary: string;
  clientName?: string; // Derived from answers if possible
}

export interface SessionState {
  answers: Answer[];
  currentQuestion: QuestionData | null;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
