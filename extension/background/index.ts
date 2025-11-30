// Background service worker for SmartOnboard extension

// Listen for messages from the main website
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log('[Background] Received message:', request);

    if (request.type === 'SYNC_USER') {
      const { userId, userEmail, userName } = request.data;

      // Store user data in extension storage
      chrome.storage.local.set(
        {
          userId,
          userEmail,
          userName,
          syncedAt: new Date().toISOString()
        },
        () => {
          console.log('[Background] ✅ User data stored:', userId);
          sendResponse({ success: true, userId });

          // Notify all content scripts that user data is ready
          chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'USER_SYNCED',
                  userId
                });
              }
            });
          });
        }
      );

      return true; // Keep message channel open for async response
    }

    if (request.type === 'GET_USER') {
      chrome.storage.local.get(['userId', 'userEmail', 'userName'], (result) => {
        console.log('[Background] Sending user data:', result);
        sendResponse({ success: true, data: result });
      });

      return true;
    }
  }
);

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
});

console.log('[Background] SmartOnboard background script loaded');
