# Caption Capture Implementation

## Overview

Instead of recording audio and using OpenAI Whisper for transcription, we now use **Google Meet's built-in captions** to capture the conversation. This approach is inspired by how Tactiq works.

## How It Works

### 1. Automatic Caption Enabling
When a session starts, the extension automatically enables Google Meet captions by:
- Finding the captions/CC button in the Meet UI
- Clicking it programmatically if captions aren't already enabled
- Operating silently in the background (captions are enabled but not necessarily visible to user)

### 2. Caption Monitoring
The extension uses a `MutationObserver` to watch the caption container for new text:
- Monitors the DOM for caption elements
- Extracts speaker name and text from captions
- Parses the format: "Speaker Name: caption text"
- Deduplicates captions to avoid processing the same text twice

### 3. Speaker Identification
Google Meet provides speaker names in the captions, so we get accurate attribution:
- **Client**: Anyone who isn't the logged-in user
- **Agent**: The logged-in user (detected by "You" or matching their name)
- **Unknown**: Fallback if speaker can't be determined

## Benefits Over Audio Recording

### ✅ Pros:
1. **Zero Cost** - No OpenAI Whisper API calls (~$0.006/minute saved)
2. **Perfect Accuracy** - Google's speech-to-text is industry-leading
3. **Speaker Attribution** - Google provides speaker names automatically
4. **Real-time** - Instant transcription with no upload/processing delay
5. **Multi-language** - Supports 30+ languages automatically
6. **No Permissions** - Doesn't require `tabCapture` permission
7. **Privacy** - No audio data leaves the browser
8. **Lightweight** - No audio processing or encoding needed

### ❌ Cons:
1. **Requires Captions** - Must enable Meet captions (done automatically)
2. **Google Meet Only** - Won't work on Zoom, Teams, etc. (can be extended)
3. **Caption Quality** - Dependent on Google's caption accuracy (usually excellent)

## Code Structure

### Files:
- **`extension/hooks/useCaptionCapture.ts`** - Caption monitoring hook
- **`extension/hooks/useCallSession.ts`** - Updated to use captions instead of audio
- **`extension/components/Sidebar.tsx`** - UI updated to show "Capturing Captions"

### Key Functions:

#### `useCaptionCapture()`
```typescript
useCaptionCapture({
  enabled: true,
  onCaption: (caption) => {
    console.log(caption.speaker, caption.text, caption.timestamp);
  }
});
```

**Parameters:**
- `enabled`: Boolean to start/stop caption monitoring
- `onCaption`: Callback fired when new caption is detected

**Returns:**
- `enableCaptions()`: Function to manually trigger caption enabling

#### Caption Processing Flow:
```
Google Meet Call
    ↓
Extension enables captions programmatically
    ↓
MutationObserver watches caption container
    ↓
New caption appears → Extract speaker & text
    ↓
Deduplicate & parse format
    ↓
Fire onCaption callback
    ↓
Add to transcript + analyze checklist
```

## Google Meet Caption Selectors

The extension looks for caption containers using these selectors:
```typescript
const selectors = [
  '[jsname="dsyhDe"]',     // Main caption container
  '.a4cQT',                // Alternative container
  '[data-caption-track]',
  '.caption-window',
  '[aria-live="assertive"]'
];
```

**Note:** These may change as Google updates Meet's DOM structure.

## Caption Format Parsing

Google Meet captions typically follow this format:
```
"Speaker Name: caption text here"
```

The extension parses this by:
1. Checking for colon separator: `/^([^:]+):\s*(.+)$/`
2. If no colon, looking for speaker element: `[data-sender-name], .speaker-name`
3. Defaulting to "unknown" if no speaker found

## Session Flow

1. **User joins Google Meet** → Extension detects call
2. **Sidebar appears** → User sees SmartOnboard AI sidebar
3. **User logs in** → User ID synced from main app
4. **Session starts** → `startSession()` called
   - Creates session in database
   - Loads checklist
   - **Enables caption capture** (`setIsCaptureEnabled(true)`)
5. **Captions appear** → `onCaption` callback fires
   - Adds to transcript state
   - Every 3 segments: Analyze checklist
   - Every 5 segments: Generate question prompt
6. **Session ends** → `stopSession()` called
   - Disables caption capture
   - Saves final state to database

## Testing

### Manual Test:
1. Join a Google Meet call
2. Open sidebar (should auto-appear)
3. Start speaking or have someone speak
4. Check console for: `[CaptionCapture] New caption: { speaker, text }`
5. Verify transcript tab shows captions in real-time
6. Verify checklist auto-completes based on conversation

### Debugging:
Enable verbose logging:
```javascript
// In browser console on Google Meet page
localStorage.setItem('debug', 'caption-capture');
```

Check console for:
- `[CaptionCapture] Starting caption capture...`
- `[CaptionCapture] Enabling captions...`
- `[CaptionCapture] Found caption container: [selector]`
- `[Session] New caption: { speaker, text }`

## Future Enhancements

### Multi-Platform Support:
- Zoom: Use Zoom's caption API
- Microsoft Teams: Parse Teams captions
- Generic: Fallback to Whisper for unsupported platforms

### Speaker Recognition Improvements:
- Voice fingerprinting for better agent/client detection
- Learning user's name from Google account
- Detecting multiple clients in group calls

### Caption Confidence:
- Track caption edit/correction frequency
- Flag low-confidence segments for review
- Allow manual correction in transcript

## Migration Notes

### Removed:
- ❌ `extension/hooks/useAudioRecorder.ts` - No longer needed
- ❌ `services/whisperService.ts` - No longer needed
- ❌ `/api/transcribe` endpoint - No longer needed
- ❌ `tabCapture` permission - Removed from manifest

### Updated:
- ✅ `extension/hooks/useCallSession.ts` - Uses `useCaptionCapture` instead of `useAudioRecorder`
- ✅ `extension/components/Sidebar.tsx` - Shows "Capturing Captions" instead of "Recording"
- ✅ `extension/package.json` - Removed `tabCapture` permission

### New Files:
- ➕ `extension/hooks/useCaptionCapture.ts` - Caption monitoring implementation

## Environment Setup

No additional environment variables needed! 🎉

Previously required:
- ~~`OPENAI_API_KEY`~~ - No longer needed

Still required:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack Auth
- `NEXT_PUBLIC_API_KEY` - Gemini (for question generation only)

## Cost Comparison

### Before (Audio Recording + Whisper):
- 1 hour call = ~$0.36 (60 min × $0.006/min)
- 10 calls/day = $3.60/day = $108/month

### After (Caption Capture):
- 1 hour call = **$0.00** ✅
- Unlimited calls = **$0.00** ✅

**Savings: 100% of transcription costs**

Only remaining AI cost is Gemini for question generation (~$0.02/call).
