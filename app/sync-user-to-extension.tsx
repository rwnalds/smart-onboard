'use client';

import { useEffect, Suspense } from 'react';
import { useUser } from '@stackframe/stack';

/**
 * Internal component that uses the useUser hook
 */
function SyncUserToExtensionInner() {
  const user = useUser(); // No redirect - just sync if user exists

  useEffect(() => {
    console.log('[SyncUser] User state:', user?.id ? `Found: ${user.id}` : 'No user');

    if (user?.id) {
      // Get the extension ID from localStorage (needs to be set once)
      const sendToExtension = async () => {
        try {
          const savedExtensionId = localStorage.getItem('smartonboard_extension_id');

          if (savedExtensionId && typeof window !== 'undefined' && (window as any).chrome?.runtime) {
            const chrome = (window as any).chrome;
            console.log('[SyncUser] Sending to extension:', savedExtensionId);
            try {
              chrome.runtime.sendMessage(
                savedExtensionId,
                {
                  type: 'SYNC_USER',
                  data: {
                    userId: user.id,
                    userEmail: user.primaryEmail,
                    userName: user.displayName || user.primaryEmail
                  }
                },
                (response: any) => {
                  if (chrome.runtime.lastError) {
                    console.error('[SyncUser] ❌ Error:', chrome.runtime.lastError.message);
                    console.log('[SyncUser] 💡 Make sure extension is loaded');
                  } else {
                    console.log('[SyncUser] ✅ User synced to extension!', response);
                  }
                }
              );
            } catch (error) {
              console.error('[SyncUser] Failed to send message to extension:', error);
            }
          } else {
            // Show instructions for first-time setup
            console.log('[SyncUser] ⚠️ Extension ID not set');
            console.log('[SyncUser] 📝 One-time setup:');
            console.log('[SyncUser]    1. Go to chrome://extensions/');
            console.log('[SyncUser]    2. Find "SmartOnboard" extension');
            console.log('[SyncUser]    3. Copy the ID (long string below the name)');
            console.log('[SyncUser]    4. Run this command:');
            console.log('[SyncUser]       localStorage.setItem("smartonboard_extension_id", "YOUR_EXTENSION_ID_HERE")');
            console.log('[SyncUser]    5. Refresh this page');
          }

          // Always save to localStorage as fallback
          localStorage.setItem('smartonboard_userId', user.id);
          localStorage.setItem('smartonboard_userEmail', user.primaryEmail || '');
          console.log('[SyncUser] ✅ Saved to localStorage');
        } catch (error) {
          console.error('[SyncUser] Error:', error);
        }
      };

      sendToExtension();
    }
  }, [user?.id, user?.primaryEmail, user?.displayName]);

  return null;
}

/**
 * Syncs authenticated user ID to Chrome extension storage
 * Place this component in the root layout
 */
export function SyncUserToExtension() {
  return (
    <Suspense fallback={null}>
      <SyncUserToExtensionInner />
    </Suspense>
  );
}
