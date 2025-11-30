import { useEffect, useRef } from 'react';

interface CaptionData {
  speaker: string;
  text: string;
  timestamp: Date;
}

interface UseCaptionCaptureOptions {
  onCaption: (caption: CaptionData) => void;
  enabled: boolean;
}

/**
 * Hook to capture Google Meet captions
 * Automatically enables captions and monitors the caption container
 */
export function useCaptionCapture({ onCaption, enabled }: UseCaptionCaptureOptions) {
  const observerRef = useRef<MutationObserver | null>(null);
  const processedCaptionsRef = useRef<Set<string>>(new Set());
  const lastSpeakerRef = useRef<string | null>(null);
  const lastTextRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    console.log('[CaptionCapture] Starting caption capture...');

    // Enable captions automatically
    enableCaptions();

    // Start monitoring captions
    const captionContainer = waitForCaptionContainer();

    if (captionContainer) {
      startMonitoring(captionContainer);
    } else {
      // Retry finding caption container after captions are enabled
      setTimeout(() => {
        const container = waitForCaptionContainer();
        if (container) {
          startMonitoring(container);
        } else {
          console.warn('[CaptionCapture] Could not find caption container');
        }
      }, 2000);
    }

    return cleanup;
  }, [enabled]);

  const enableCaptions = () => {
    try {
      // Look for the captions button in Google Meet UI
      // Common selectors for the CC button
      const captionButton =
        document.querySelector('[aria-label*="captions" i]') ||
        document.querySelector('[aria-label*="subtitles" i]') ||
        document.querySelector('[data-tooltip*="captions" i]') ||
        document.querySelector('button[jsname="r8qRAd"]'); // Meet's caption button

      if (captionButton instanceof HTMLElement) {
        const isActive = captionButton.getAttribute('aria-pressed') === 'true' ||
                        captionButton.classList.contains('active');

        if (!isActive) {
          console.log('[CaptionCapture] Enabling captions...');
          captionButton.click();
        } else {
          console.log('[CaptionCapture] Captions already enabled');
        }
      } else {
        console.warn('[CaptionCapture] Caption button not found - captions may need to be enabled manually');
      }
    } catch (error) {
      console.error('[CaptionCapture] Error enabling captions:', error);
    }
  };

  const waitForCaptionContainer = (): Element | null => {
    // Google Meet caption container selectors
    // Based on actual HTML structure: <div role="region" aria-label="Captions" class="vNKgIf UDinHf">
    const selectors = [
      '[role="region"][aria-label="Captions"]', // Most specific - current structure
      '.vNKgIf.UDinHf', // Class-based selector
      '[jsname="dsyhDe"]', // Backup selector
      '.a4cQT', // Alternative caption container
      '[aria-live="assertive"]' // Live region for captions
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log('[CaptionCapture] Found caption container:', selector);
        return container;
      }
    }

    return null;
  };

  const startMonitoring = (container: Element) => {
    console.log('[CaptionCapture] Starting caption monitoring...');

    // Create mutation observer to watch for new captions
    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          processCaptions(container);
        }
      }
    });

    // Start observing
    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });

    // Process any existing captions
    processCaptions(container);
  };

  const processCaptions = (container: Element) => {
    try {
      // Google Meet caption structure:
      // <div class="nMcdL bj4p3b">
      //   <div class="adE6rb">
      //     <span class="NWpY1d">Speaker Name</span>
      //   </div>
      //   <div class="ygicle VbkSUe">Caption text here</div>
      // </div>

      // Find all caption blocks (each has speaker + text)
      const captionBlocks = container.querySelectorAll('.nMcdL.bj4p3b');

      // Get the LAST caption block (most recent)
      const lastBlock = captionBlocks[captionBlocks.length - 1];

      if (!lastBlock) return;

      // Extract speaker name
      const speakerElement = lastBlock.querySelector('.NWpY1d');
      const speaker = speakerElement?.textContent?.trim() || 'unknown';

      // Extract caption text
      const textElement = lastBlock.querySelector('.ygicle.VbkSUe');
      const text = textElement?.textContent?.trim() || '';

      // Skip if no text
      if (!text || text.length < 3) return;

      // Skip button text like "Jump to bottom", "arrow_downward"
      if (text.includes('Jump to') || text.includes('arrow_') || text.length < 5) {
        return;
      }

      // Check if this is an update to the same speaker's caption or a new speaker
      const isSameSpeaker = lastSpeakerRef.current === speaker;
      const textChanged = lastTextRef.current !== text;

      // Only emit if:
      // 1. Speaker changed (new person talking), OR
      // 2. Same speaker but text changed (word-by-word update)
      if (!isSameSpeaker || textChanged) {
        // Update refs
        lastSpeakerRef.current = speaker;
        lastTextRef.current = text;

        // Emit caption
        console.log('[CaptionCapture] Caption update:', {
          speaker,
          text: text.substring(0, 50) + '...',
          isSameSpeaker,
          textChanged
        });

        onCaption({
          speaker,
          text,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('[CaptionCapture] Error processing captions:', error);
    }
  };

  const cleanup = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    processedCaptionsRef.current.clear();
    lastSpeakerRef.current = null;
    lastTextRef.current = '';
  };

  return {
    enableCaptions
  };
}
