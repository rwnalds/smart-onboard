# Manual User ID Setup

## The Issue

Chrome extensions have **isolated storage** - they can't access the main website's storage directly. The `SyncUserToExtension` component we created can't automatically sync to the extension.

## Quick Fix (Manual Setup)

### Option 1: Set User ID Manually in Extension

1. **Get your User ID:**
   - Go to http://localhost:3000
   - Log in
   - Open Console (F12)
   - You should see: `[SyncUser] User state: Found: clxxx...`
   - Copy the user ID (starts with `cl`)

2. **Go to Google Meet:**
   - Join any Google Meet call
   - Open Console (F12)
   - Run this command:
   ```javascript
   chrome.storage.local.set({ userId: 'paste-your-user-id-here' }, () => {
     console.log('User ID set!');
     location.reload(); // Reload the page
   })
   ```

3. **Reload the Meet page** - The sidebar should now work!

---

## Option 2: Get User ID from Dashboard

1. Go to http://localhost:3000
2. Open Console
3. Run:
   ```javascript
   // This will show your user ID
   chrome.storage.local.get(['userId'], (r) => console.log('User ID:', r.userId))

   // Or get it from the user object
   window.location.href // Check the URL or inspect the page
   ```

---

## Option 3: Use Background Script Message Passing (Better Solution)

I can implement a proper message passing system where:
1. Main app sends user ID to extension via `chrome.runtime.sendMessage`
2. Extension background script receives and stores it
3. Content script (sidebar) reads from storage

This requires adding a background script to the extension. Want me to implement this?

---

## For Now (Quickest):

1. Check main app console for user ID
2. Set it manually in Meet console:
   ```javascript
   chrome.storage.local.set({ userId: 'YOUR_ID_HERE' })
   ```
3. Reload Meet page

The extension should then work perfectly!
