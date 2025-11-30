/**
 * Structured Question Generation Framework
 * 
 * This hook manages the lifecycle of question generation with proper state management
 * to prevent chaotic/question generation and ensure questions are based on checklist gaps.
 */

import { useRef, useCallback } from 'react';
import type { ChecklistItem, TranscriptSegment } from '~types';

export enum QuestionState {
  IDLE = 'idle',                    // No question pending
  WAITING_FOR_ANSWER = 'waiting',   // Question asked, waiting for client response
  CLIENT_SPEAKING = 'speaking',     // Client is actively speaking
  ANSWER_RECEIVED = 'received',     // Client finished speaking, answer received
  EVALUATING = 'evaluating',        // Evaluating if answer is adequate
  GENERATING = 'generating'         // Generating next question
}

interface QuestionGenerationConfig {
  clientPauseThreshold: number;     // ms to wait after client stops speaking
  minQuestionInterval: number;      // min ms between questions
  isClientActivelySpeaking: () => boolean;
  getRecentTranscript: () => TranscriptSegment[];
  getPendingChecklistItems: () => ChecklistItem[];
}

export function useQuestionGeneration(config: QuestionGenerationConfig) {
  const stateRef = useRef<QuestionState>(QuestionState.IDLE);
  const lastQuestionTimeRef = useRef<number>(0);
  const lastClientActivityRef = useRef<number>(0);
  const clientSpeakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingRef = useRef<boolean>(false);

  /**
   * Check if client is actively speaking (has spoken recently)
   */
  const checkClientSpeaking = useCallback((): boolean => {
    const timeSinceLastActivity = Date.now() - lastClientActivityRef.current;
    // If client spoke in last 2 seconds, they're actively speaking
    return timeSinceLastActivity < 2000 && config.isClientActivelySpeaking();
  }, [config]);

  /**
   * Update client activity timestamp
   */
  const markClientActivity = useCallback(() => {
    lastClientActivityRef.current = Date.now();
    
    // Clear existing timeout
    if (clientSpeakingTimeoutRef.current) {
      clearTimeout(clientSpeakingTimeoutRef.current);
    }

    // If client is speaking, update state
    if (stateRef.current === QuestionState.WAITING_FOR_ANSWER) {
      stateRef.current = QuestionState.CLIENT_SPEAKING;
    }

    // Set timeout to detect when client stops speaking
    clientSpeakingTimeoutRef.current = setTimeout(() => {
      // Only transition if we're in speaking state and enough time has passed
      if (stateRef.current === QuestionState.CLIENT_SPEAKING) {
        const timeSinceLastActivity = Date.now() - lastClientActivityRef.current;
        if (timeSinceLastActivity >= config.clientPauseThreshold) {
          stateRef.current = QuestionState.ANSWER_RECEIVED;
        }
      }
    }, config.clientPauseThreshold);
  }, [config.clientPauseThreshold]);

  /**
   * Determine if we should generate a new question
   */
  const shouldGenerateQuestion = useCallback((): boolean => {
    const now = Date.now();
    
    // Don't generate if already generating
    if (isGeneratingRef.current) {
      return false;
    }

    // Don't generate if client is actively speaking
    if (checkClientSpeaking()) {
      return false;
    }

    // Don't generate too frequently
    if (now - lastQuestionTimeRef.current < config.minQuestionInterval) {
      return false;
    }

    // Check if we have pending checklist items
    const pendingItems = config.getPendingChecklistItems();
    if (pendingItems.length === 0) {
      return false;
    }

    // Check state - only generate if in appropriate state
    const state = stateRef.current;
    if (state === QuestionState.IDLE || state === QuestionState.ANSWER_RECEIVED) {
      return true;
    }

    return false;
  }, [config, checkClientSpeaking]);

  /**
   * Mark that a question was asked
   */
  const markQuestionAsked = useCallback(() => {
    stateRef.current = QuestionState.WAITING_FOR_ANSWER;
    lastQuestionTimeRef.current = Date.now();
  }, []);

  /**
   * Mark that question generation started
   */
  const markGenerationStarted = useCallback(() => {
    isGeneratingRef.current = true;
    stateRef.current = QuestionState.GENERATING;
  }, []);

  /**
   * Mark that question generation completed
   */
  const markGenerationCompleted = useCallback(() => {
    isGeneratingRef.current = false;
    stateRef.current = QuestionState.IDLE;
  }, []);

  /**
   * Reset state (e.g., when starting new session)
   */
  const reset = useCallback(() => {
    stateRef.current = QuestionState.IDLE;
    lastQuestionTimeRef.current = 0;
    lastClientActivityRef.current = 0;
    isGeneratingRef.current = false;
    if (clientSpeakingTimeoutRef.current) {
      clearTimeout(clientSpeakingTimeoutRef.current);
      clientSpeakingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Get current state (for debugging)
   */
  const getState = useCallback(() => stateRef.current, []);

  return {
    shouldGenerateQuestion,
    markClientActivity,
    markQuestionAsked,
    markGenerationStarted,
    markGenerationCompleted,
    reset,
    getState,
    checkClientSpeaking
  };
}

