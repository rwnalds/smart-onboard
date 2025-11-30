# Extension ID Setup (One-Time)

## Quick Setup Steps

### 1. Get Your Extension ID

1. Open Chrome and go to: `chrome://extensions/`
2. Find **"Extension"** or **"SmartOnboard"** in the list
3. Look for the **ID** field under the extension name
4. Copy the entire ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Set the Extension ID in Main App

1. Go to http://localhost:3000
2. Open Browser Console (F12)
3. Run this command (replace with your actual ID):

```javascript
localStorage.setItem("smartonboard_extension_id", "YOUR_EXTENSION_ID_HERE")
```

4. Refresh the page

### 3. Verify It Works

After refreshing http://localhost:3000, check the console. You should see:

```
[SyncUser] User state: Found: clxxx...
[SyncUser] Sending to extension: YOUR_EXTENSION_ID
[SyncUser] ✅ User synced to extension!
```

### 4. Test on Google Meet

1. Join a Google Meet call
2. The sidebar should appear
3. Check console - should see:
   ```
   ✅ User ID loaded from chrome.storage: clxxx...
   Session created: abc123...
   Checklist loaded: 6 items
   Recording started
   ```

---

## If It Still Doesn't Work

### Check Extension Background Script

1. Go to `chrome://extensions/`
2. Click "Service Worker" link under your extension
3. Check the console for errors
4. You should see: `[Background] SmartOnboard background script loaded`

### Manually Set User ID (Temporary Workaround)

If the message passing isn't working, you can manually set it:

1. Get your user ID from http://localhost:3000 console
2. Go to Google Meet
3. Open console and run:

```javascript
chrome.storage.local.set({
  userId: 'YOUR_USER_ID_HERE'
}, () => {
  console.log('Set!');
  location.reload();
})
```

---

## How It Works

```
Main App (localhost:3000)
    ↓
  Detects logged-in user
    ↓
  Sends message to extension via chrome.runtime.sendMessage()
    ↓
Extension Background Script
    ↓
  Stores user data in chrome.storage.local
    ↓
Content Script (on Google Meet)
    ↓
  Reads user ID from storage
    ↓
  Creates session & starts recording
```

---

## Troubleshooting

**"Extension ID not set"**
→ Follow Step 2 above to set the extension ID

**"Error: Could not establish connection"**
→ Make sure extension is loaded and enabled in chrome://extensions/

**"No user ID in chrome.storage"**
→ Check main app console for sync errors
→ Try manual setup as workaround

**Extension ID keeps changing**
→ This happens in dev mode. You'll need to update it each time you reload the extension
→ In production, the ID is permanent

---

## Production Note

In production, you would:
1. Publish the extension to Chrome Web Store
2. Get a permanent extension ID
3. Hardcode it in the main app (no localStorage needed)
4. Use that ID in `externally_connectable` manifest

For development, the localStorage approach works fine!
