import { useEffect, useRef, useState } from "react"
import type { CallSession, ChecklistItem, QuestionPrompt, TranscriptSegment } from "~types"
import { useCaptionCapture } from "./useCaptionCapture"

export function useCallSession(meetingUrl: string) {
  const [session, setSession] = useState<CallSession | null>(null)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [currentPrompt, setCurrentPrompt] = useState<QuestionPrompt | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(false)
  const [clientName, setClientName] = useState<string | null>(null) // Track client name from captions
  
  // Track timing and state for smart question generation
  const lastQuestionTimeRef = useRef<number>(0)
  const lastAnswerCheckRef = useRef<number>(0)
  const isGeneratingQuestionRef = useRef<boolean>(false)
  const pauseCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastClientUpdateTimeRef = useRef<number>(0)
  const askedQuestionsRef = useRef<string[]>([]) // Track questions that were generated to avoid duplicates
  const clientIsSpeakingRef = useRef<boolean>(false) // Track if client is actively speaking
  const MIN_QUESTION_INTERVAL_MS = 5000 // Increased to 5 seconds between questions for stability
  
  // Use refs to access latest state in callbacks
  const sessionRef = useRef<CallSession | null>(null)
  const transcriptRef = useRef<TranscriptSegment[]>([])
  const checklistRef = useRef<ChecklistItem[]>([])
  const currentPromptRef = useRef<QuestionPrompt | null>(null)
  
  // Keep refs in sync with state
  useEffect(() => {
    sessionRef.current = session
  }, [session])
  
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])
  
  useEffect(() => {
    checklistRef.current = checklist
  }, [checklist])
  
  useEffect(() => {
    currentPromptRef.current = currentPrompt
  }, [currentPrompt])

  // Caption capture (replaces audio recording)
  useCaptionCapture({
    enabled: isCaptureEnabled,
    onCaption: async (caption) => {
      if (!session) return;

      try {
        // Determine speaker type (agent vs client)
        // "You" = agent (the logged-in user)
        // Any other name = client
        const isAgent = caption.speaker.toLowerCase() === 'you';
        const speaker = isAgent ? 'agent' : 'client';

        setTranscript(prev => {
          // Check if last segment is from the same speaker
          const lastSegment = prev[prev.length - 1];

          if (lastSegment && lastSegment.speaker === speaker) {
            // Same speaker - update the existing segment's text (word-by-word updates)
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastSegment,
              text: caption.text, // Replace with latest caption text (word-by-word updates)
              timestamp: caption.timestamp
            };
            
            // Store updated transcript in ref immediately
            transcriptRef.current = updated;
            
            // Track client updates for pause detection
            if (speaker === 'client') {
              lastClientUpdateTimeRef.current = Date.now();
              clientIsSpeakingRef.current = true; // Mark that client is actively speaking
              // Clear any pending pause checks - client is still speaking
              if (pauseCheckIntervalRef.current) {
                clearTimeout(pauseCheckIntervalRef.current);
                pauseCheckIntervalRef.current = null;
              }
              // Reschedule pause check (client is still speaking - keep extending the timeout)
              scheduleAnswerQualityCheck();
            }
            
            return updated;
          } else {
            // Different speaker - create new segment
            const newSegment: TranscriptSegment = {
              id: Date.now(),
              speaker,
              text: caption.text,
              timestamp: caption.timestamp,
              confidence: 1.0 // Captions are accurate
            };

            const updated = [...prev, newSegment];

            // Store updated transcript in ref immediately for use in callbacks
            transcriptRef.current = updated;

            // Analyze for checklist completion when new segments arrive
            // Trigger on every client segment to ensure we catch answers quickly
            if (speaker === 'client') {
              // Use setTimeout to defer execution, ensuring refs are updated
              setTimeout(() => analyzeChecklist(), 0);
            }

            // Handle question generation triggers based on speaker
            if (speaker === 'client') {
              // Client just started speaking (new segment)
              lastClientUpdateTimeRef.current = Date.now();
              clientIsSpeakingRef.current = true; // Mark that client is actively speaking
              // Clear any pending generation - client is speaking now
              if (pauseCheckIntervalRef.current) {
                clearTimeout(pauseCheckIntervalRef.current);
                pauseCheckIntervalRef.current = null;
              }
              // Schedule check after they finish (longer delay to ensure they're done)
              setTimeout(() => scheduleAnswerQualityCheck(), 0);
            } else if (speaker === 'agent') {
              // Agent started speaking - client must have finished
              clientIsSpeakingRef.current = false; // Client stopped speaking
              // Clear any pending pause check
              if (pauseCheckIntervalRef.current) {
                clearTimeout(pauseCheckIntervalRef.current);
                pauseCheckIntervalRef.current = null;
              }
              // Wait longer before checking - agent might be asking follow-up
              setTimeout(() => {
                checkAnswerQualityAndGenerateQuestion();
              }, 1500);
            }

            console.log('[Session] New speaker:', { speaker, actualName: caption.speaker });
            
            // Track client name (first non-agent speaker)
            if (speaker === 'client' && !clientName) {
              setClientName(caption.speaker);
              console.log('[Session] Client identified:', caption.speaker);
            }
            
            return updated;
          }
        });
      } catch (error) {
        console.error('[Session] Caption processing error:', error);
      }
    }
  })

  // Get user ID from storage (set by main app)
  useEffect(() => {
    const loadUserId = () => {
      chrome.storage.local.get(['userId'], (result) => {
        if (result.userId) {
          setUserId(result.userId);
          console.log('✅ User ID loaded from chrome.storage:', result.userId);
        } else {
          console.log('❌ No user ID in chrome.storage');
          console.log('💡 To fix: Log in to http://localhost:3000 in the same browser');
          console.log('💡 Or manually set it:');
          console.log('   chrome.storage.local.set({ userId: "your-user-id" })');
        }
      });
    };

    // Load immediately
    loadUserId();

    // Also listen for changes (when synced from main app)
    const handleStorageChange = (changes: any, area: string) => {
      if (area === 'local' && changes.userId) {
        console.log('🔄 User ID updated:', changes.userId.newValue);
        setUserId(changes.userId.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [])

  // Schedule answer quality check after a pause
  const scheduleAnswerQualityCheck = () => {
    // Don't schedule if client is actively speaking - REMOVED to fix bug
    // We WANT to schedule it so it runs after they stop speaking
    // if (clientIsSpeakingRef.current) {
    //   return;
    // }

    // Clear any existing timeout
    if (pauseCheckIntervalRef.current) {
      clearTimeout(pauseCheckIntervalRef.current);
    }

    // Wait 4 seconds after last client update, then check if they finished answering
    // This gives time for the client to finish speaking (word-by-word captions may keep updating)
    pauseCheckIntervalRef.current = setTimeout(() => {
      // Double-check that client is not actively speaking
      const timeSinceLastUpdate = Date.now() - lastClientUpdateTimeRef.current;
      
      if (clientIsSpeakingRef.current || timeSinceLastUpdate < 3500) {
        // Client is still speaking or paused too recently, reschedule
        console.log('[Session] Client still speaking or pause too short, rescheduling check...');
        if (!clientIsSpeakingRef.current) {
          scheduleAnswerQualityCheck();
        }
        return;
      }

      // Mark that client stopped speaking
      clientIsSpeakingRef.current = false;
      console.log('[Session] Pause detected after client response, checking answer quality...');
      checkAnswerQualityAndGenerateQuestion();
    }, 4000);
  };

  // Check answer quality and generate question if appropriate
  const checkAnswerQualityAndGenerateQuestion = async () => {
    const currentSession = sessionRef.current;
    const currentTranscript = transcriptRef.current;
    
    if (!currentSession || currentTranscript.length < 2) return;
    
    // CRITICAL: Don't generate if client is actively speaking
    if (clientIsSpeakingRef.current) {
      console.log('[Session] ⏸️ Skipping - client is actively speaking');
      return;
    }
    
    if (isGeneratingQuestionRef.current) {
      console.log('[Session] ⏸️ Skipping - question generation already in progress');
      return;
    }

    const now = Date.now();
    
    // Don't generate questions too frequently
    if (now - lastQuestionTimeRef.current < MIN_QUESTION_INTERVAL_MS) {
      console.log('[Session] ⏸️ Skipping question generation - too soon since last question');
      return;
    }

    // Don't check answer quality too frequently (min 2 seconds between checks)
    if (now - lastAnswerCheckRef.current < 2000) {
      return;
    }

    lastAnswerCheckRef.current = now;

    try {
      const recentTranscript = currentTranscript.slice(-10);
      const currentQuestion = currentPromptRef.current?.prompt || null;
      
      // Check if client has paused (client-side check based on last update time)
      const timeSinceLastClientUpdate = Date.now() - lastClientUpdateTimeRef.current;
      
      // Check if agent has started speaking (fallback for pause detection)
      const isAgentSpeaking = currentTranscript.length > 0 && currentTranscript[currentTranscript.length - 1].speaker === 'agent';
      
      const hasPause = timeSinceLastClientUpdate >= 2500 || isAgentSpeaking;
      
      // Also check if last segment is from client
      const lastSegment = currentTranscript[currentTranscript.length - 1];
      const isLastSpeakerClient = lastSegment?.speaker === 'client';

      console.log('[Session] Checking answer quality...', {
        timeSinceLastClientUpdate,
        hasPause,
        isLastSpeakerClient,
        lastSpeaker: lastSegment?.speaker,
        transcriptLength: currentTranscript.length
      });

      // Check answer quality
      const requestBody = {
          currentQuestion,
          recentTranscript,
          pauseThresholdMs: 2000,
          // Also pass client-side pause detection
          hasClientPause: hasPause
      };

      console.log('[Session] Sending answer analysis request:', {
        hasClientPause: requestBody.hasClientPause,
        hasPauseVar: hasPause,
        transcriptLength: recentTranscript.length,
        lastSpeaker: recentTranscript[recentTranscript.length - 1]?.speaker
      });

      const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/answers/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

        if (response.ok) {
        const { quality, hasPause, shouldGenerateQuestion, hasServerPause } = await response.json();
        
        const recentTranscript = currentTranscript.slice(-5);
        const lastClientSegments = recentTranscript.filter(seg => seg.speaker === 'client').slice(-2);
        
        console.log('[Session] Answer quality check:', {
          hasAnswered: quality.hasAnswered,
          isSubstantial: quality.isSubstantial,
          hasPause,
          shouldGenerateQuestion,
          confidence: quality.confidence,
          reasoning: quality.reasoning,
          currentQuestion: currentQuestion?.substring(0, 80),
          lastClientResponse: lastClientSegments.map(seg => seg.text).join(' ').substring(0, 150),
          transcriptLength: currentTranscript.length
        });

        if (shouldGenerateQuestion) {
          console.log('[Session] ✅ Client finished answering - generating next question');
          console.log('[Session] Current question that was answered:', currentQuestion?.substring(0, 80));
          
          // Generate new question
          await generateQuestion();
          
          // After generating new question, give it a moment then verify it was set
          setTimeout(() => {
            const newQuestion = currentPromptRef.current?.prompt;
            if (newQuestion) {
              console.log('[Session] ✅ New question set and ready for tracking:', newQuestion.substring(0, 80));
            } else {
              console.warn('[Session] ⚠️ New question was not set properly');
            }
          }, 500);
        } else {
          // Log why we're not generating
          if (!hasPause) {
            console.log('[Session] ⏸️ No pause detected yet - waiting for client to finish speaking');
          } else if (!quality.hasAnswered) {
            console.log('[Session] ❌ Client paused but answer not recognized as adequate:', quality.reasoning);
          } else if (!quality.isSubstantial) {
            console.log('[Session] ⚠️ Client answered but response is not substantial enough:', quality.reasoning);
          } else {
            console.log('[Session] ⚠️ All conditions met but not generating (this shouldn\'t happen)');
          }
        }
      }
    } catch (error) {
      console.error('[Session] Answer quality check error:', error);
    }
  };

  // Analyze checklist for auto-completion
  const analyzeChecklist = async () => {
    const currentSession = sessionRef.current;
    const currentTranscript = transcriptRef.current;
    const currentChecklist = checklistRef.current;
    
    if (!currentSession || currentTranscript.length < 2) return;

    try {
      const pendingItems = currentChecklist.filter(item => !item.completed);
      if (pendingItems.length === 0) {
        console.log('[Checklist] All items completed');
        return;
      }

      console.log('[Checklist] Analyzing transcript for completions...', {
        pendingCount: pendingItems.length,
        transcriptLength: currentTranscript.length
      });

      // Get recent transcript (last 10 segments)
      const recentTranscript = currentTranscript.slice(-10);

      const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/checklist/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          recentTranscript,
          pendingItems
        })
      });

      if (response.ok) {
        const { completedItems } = await response.json();

        console.log('[Checklist] Analysis complete:', {
          foundCompletions: completedItems.length,
          completions: completedItems
        });

        // Update checklist
        setChecklist(prev =>
          prev.map(item => {
            // Handle both item_id (from AI) and itemId (camelCase)
            const completion = completedItems.find((c: any) => (c.itemId || c.item_id) === item.id);
            if (completion) {
              console.log('[Checklist] ✅ Marking item as completed:', {
                itemId: item.id,
                label: item.label,
                extractedInfo: completion.extractedInfo || completion.extracted_info
              });
              return {
                ...item,
                completed: true,
                extractedInfo: completion.extractedInfo || completion.extracted_info,
                completedAt: new Date()
              };
            }
            return item;
          })
        );
      }
    } catch (error) {
      console.error('Checklist analysis error:', error);
    }
  };

  // Generate next question suggestion
  const generateQuestion = async () => {
    const currentSession = sessionRef.current;
    const currentChecklist = checklistRef.current;
    const currentTranscript = transcriptRef.current;
    
    if (!currentSession) return;
    if (isGeneratingQuestionRef.current) {
      console.log('[Session] Question generation already in progress');
      return;
    }

    const now = Date.now();
    
    // Don't generate questions too frequently
    if (now - lastQuestionTimeRef.current < MIN_QUESTION_INTERVAL_MS) {
      console.log('[Session] Skipping question generation - too soon since last question');
      return;
    }

    isGeneratingQuestionRef.current = true;
    lastQuestionTimeRef.current = now;

    try {
      const completedIds = currentChecklist.filter(item => item.completed).map(item => item.id);
      const pendingItems = currentChecklist.filter(item => !item.completed);
      const recentTranscript = currentTranscript.slice(-10);

      // Only generate question if there are pending checklist items
      if (pendingItems.length === 0) {
        console.log('[Session] ⏸️ Skipping question generation - all checklist items completed');
        isGeneratingQuestionRef.current = false;
        return;
      }

      console.log('[Session] Generating next question based on checklist gaps...', {
        completedItems: completedIds.length,
        pendingItems: pendingItems.length,
        recentSegments: recentTranscript.length
      });

      // Get previously asked questions - combine from both transcript and our tracked list
      const transcriptQuestions = currentTranscript
        .filter(seg => seg.speaker === 'agent')
        .map(seg => seg.text.trim())
        .filter(text => text.length > 0 && (text.endsWith('?') || text.includes('?')))
        .slice(-5);
      
      // Combine with our tracked list of generated questions
      const previousQuestions = [...new Set([...askedQuestionsRef.current, ...transcriptQuestions])].slice(-10);

      const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          completedItemIds: completedIds,
          recentTranscript,
          previousQuestions: previousQuestions // Pass to avoid repetition
        })
      });

      if (response.ok) {
        const prompt = await response.json();
        const questionText = prompt.prompt;
        
        setCurrentPrompt(prompt);
        
        // Track this question to avoid generating it again
        if (questionText) {
          askedQuestionsRef.current = [...askedQuestionsRef.current, questionText].slice(-10);
          console.log('[Session] ✅ New question generated:', questionText.substring(0, 80) + '...');
          console.log('[Session] Tracked questions count:', askedQuestionsRef.current.length);
        }
        
        // Reset last question time to allow immediate question generation after this one is answered
        // This ensures we can generate the next question promptly after client answers
        console.log('[Session] Ready to check answers for this new question');
      }
    } catch (error) {
      console.error('Question generation error:', error);
    } finally {
      isGeneratingQuestionRef.current = false;
    }
  };

  // Start a new call session
  const startSession = async () => {
    if (!userId) {
      console.error('No user ID found - please log in to the main app first');
      return
    }

    try {
      console.log('Creating session for user:', userId);

      // Create session via API
      const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          meetingUrl,
          clientName: clientName || undefined, // Send client name if known
          status: 'active'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const newSession: CallSession = await response.json()
      setSession(newSession)
      console.log('Session created:', newSession.id);

      // Load checklist for this user
      const checklistResponse = await fetch(
        `${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/checklist?userId=${userId}`
      )

      if (!checklistResponse.ok) {
        throw new Error(`Failed to load checklist: ${checklistResponse.statusText}`);
      }

      const checklistData: ChecklistItem[] = await checklistResponse.json()
      setChecklist(checklistData.map(item => ({ ...item, completed: false })))
      console.log('Checklist loaded:', checklistData.length, 'items');

      // Start caption capture
      setIsCaptureEnabled(true)
      console.log('Caption capture enabled');

      // Generate initial question if checklist has items
      if (checklistData.length > 0) {
        // Wait a moment for transcript to start, then generate first question
        setTimeout(() => {
          generateQuestion();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start call session. Please check the console for errors.');
    }
  }

  // Stop the call session
  const stopSession = async () => {
    if (!session) return

    try {
      // Stop caption capture
      setIsCaptureEnabled(false)

      // Clear any pending pause checks
      if (pauseCheckIntervalRef.current) {
        clearTimeout(pauseCheckIntervalRef.current);
        pauseCheckIntervalRef.current = null;
      }

      // Update session status
      await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endedAt: new Date().toISOString(),
          duration: Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        })
      })

      setSession(null)
      console.log('Session stopped');
    } catch (error) {
      console.error('Failed to stop session:', error)
    }
  }

  // Removed periodic check - it was causing chaotic question generation
  // Question generation now only happens through structured state machine

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pauseCheckIntervalRef.current) {
        clearTimeout(pauseCheckIntervalRef.current);
      }
    };
  }, [])

  const toggleCapture = () => {
    setIsCaptureEnabled(prev => !prev)
  }

  return {
    session,
    userId,
    isCapturing: isCaptureEnabled,
    transcript,
    checklist,
    currentPrompt,
    startSession,
    stopSession,
    toggleCapture
  }
}
