import { useEffect, useState } from "react"
import type { CallSession, ChecklistItem, QuestionPrompt, TranscriptSegment } from "~types"
import { useCaptionCapture } from "./useCaptionCapture"

export function useCallSession(meetingUrl: string) {
  const [session, setSession] = useState<CallSession | null>(null)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [currentPrompt, setCurrentPrompt] = useState<QuestionPrompt | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(false)

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
            // Same speaker - update the existing segment's text
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastSegment,
              text: caption.text, // Replace with latest caption text (word-by-word updates)
              timestamp: caption.timestamp
            };
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

            // Analyze for checklist completion every 3 complete speaker segments
            if (updated.length % 3 === 0) {
              analyzeChecklist();
            }

            // Generate next question every 5 complete speaker segments
            if (updated.length % 5 === 0) {
              generateQuestion();
            }

            console.log('[Session] New speaker:', { speaker, actualName: caption.speaker });
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

  // Analyze checklist for auto-completion
  const analyzeChecklist = async () => {
    if (!session || transcript.length < 2) return;

    try {
      const pendingItems = checklist.filter(item => !item.completed);
      if (pendingItems.length === 0) return;

      // Get recent transcript (last 10 segments)
      const recentTranscript = transcript.slice(-10);

      const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/checklist/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          recentTranscript,
          pendingItems
        })
      });

      if (response.ok) {
        const { completedItems } = await response.json();

        // Update checklist
        setChecklist(prev =>
          prev.map(item => {
            const completion = completedItems.find((c: any) => c.itemId === item.id);
            if (completion) {
              return {
                ...item,
                completed: true,
                extractedInfo: completion.extractedInfo,
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
    if (!session) return;

    try {
      const completedIds = checklist.filter(item => item.completed).map(item => item.id);
      const recentTranscript = transcript.slice(-10);

      const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000'}/api/questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          completedItemIds: completedIds,
          recentTranscript
        })
      });

      if (response.ok) {
        const prompt = await response.json();
        setCurrentPrompt(prompt);
      }
    } catch (error) {
      console.error('Question generation error:', error);
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
