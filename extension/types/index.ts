// Extension Types

export interface TranscriptSegment {
  id: number;
  speaker: 'agent' | 'client' | 'unknown';
  text: string;
  timestamp: Date;
  confidence?: number;
}

export interface ChecklistItem {
  id: number;
  label: string;
  description?: string;
  category?: string;
  order: number;
  required: boolean;
  completed: boolean;
  extractedInfo?: string;
  completedAt?: Date;
}

export interface QuestionPrompt {
  id: number;
  prompt: string;
  category?: string;
  createdAt: Date;
}

export interface CallSession {
  id: string;
  userId: string;
  agencyConfigId?: number;
  clientName?: string;
  meetingUrl?: string;
  status: 'active' | 'completed' | 'paused';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

export interface AgencyConfig {
  id: number;
  userId: string;
  slug: string;
  name: string;
  industry: string;
  description: string;
  onboardingGoal: string;
  tone: string;
  targetAudience: string;
  maxQuestions: number;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
}

// WebSocket Message Types
export interface WSMessage {
  type: 'audio_chunk' | 'transcript_segment' | 'checklist_updated' | 'question_suggested' | 'session_start' | 'session_end' | 'error';
  payload: any;
}

export interface AudioChunk {
  id: string;
  blob: Blob;
  timestamp: number;
  duration: number;
}

// Chrome Extension Storage
export interface ExtensionStorage {
  sessionId?: string;
  userId?: string;
  isRecording: boolean;
  currentMeetUrl?: string;
}

// API Response Types
export interface TranscriptionResponse {
  text: string;
  speaker: 'agent' | 'client' | 'unknown';
  confidence: number;
  segmentId: number;
}

export interface ChecklistAnalysisResponse {
  completedItems: {
    itemId: number;
    extractedInfo: string;
    confidence: number;
  }[];
  suggestedQuestions: string[];
}
