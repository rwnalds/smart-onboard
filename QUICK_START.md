# SmartOnboard AI - Quick Start Guide

## 🚀 What We Built (24-Hour Sprint)

A **live Google Meet assistant** that transcribes conversations in real-time, provides intelligent question prompts to sales agents, and automatically tracks onboarding checklist completion.

### Core Features Implemented:

✅ **Browser Extension (Chrome)**
- Google Meet detection and sidebar injection
- Real-time audio capture using tabCapture API
- Beautiful UI with transcript view and checklist panel
- Collapsible/minimizable sidebar

✅ **Real-Time Transcription**
- OpenAI Whisper integration for speech-to-text
- Basic speaker identification (agent vs client)
- Transcript storage in database

✅ **AI-Powered Assistance**
- Context-aware question suggestions based on conversation
- Intelligent checklist auto-completion
- Natural language processing to detect indirectly answered questions

✅ **Backend Services**
- API endpoints for sessions, transcription, and checklists
- PostgreSQL database with new tables
- OpenAI GPT-4o for question generation and analysis

---

## 📦 Project Structure

```
smart-onboard/
├── extension/                  # Chrome Extension
│   ├── contents/
│   │   └── google-meet.tsx    # Content script for Meet
│   ├── components/
│   │   ├── Sidebar.tsx        # Main sidebar UI
│   │   ├── TranscriptView.tsx # Live transcript display
│   │   ├── ChecklistPanel.tsx # Checklist with progress
│   │   └── QuestionPrompts.tsx # AI question suggestions
│   ├── hooks/
│   │   ├── useCallSession.ts  # Session state management
│   │   ├── useWebSocket.ts    # Real-time updates
│   │   └── useAudioRecorder.ts # Audio capture
│   └── types/index.ts         # TypeScript types
│
├── app/api/                    # Next.js API Routes
│   ├── sessions/              # Call session CRUD
│   ├── transcribe/            # Whisper transcription
│   └── checklist/             # Checklist generation
│
├── services/                   # Business Logic
│   ├── whisperService.ts      # OpenAI Whisper integration
│   ├── questionService.ts     # AI question generation
│   └── checklistAnalyzer.ts   # Smart checklist completion
│
└── db/
    ├── schema.ts              # Database schema (extended)
    └── migrations/            # SQL migrations
```

---

## 🛠️ Setup Instructions

### 1. Database Migration

Run the SQL migration to create new tables:

```bash
# Option 1: Using Drizzle
bun run db:push

# Option 2: Manual SQL
# The migration file is at: db/migrations/0000_misty_night_nurse.sql
# Run it against your Neon database
```

### 2. Install Dependencies

Already installed:
- ✅ `openai` (main project)
- ✅ `zustand` + `ws` (extension)

### 3. Environment Variables

Check `.env` - already configured:
```
OPENAI_API_KEY=sk-svcacct-...
DATABASE_URL=postgresql://...
```

### 4. Start Development Servers

**Extension (already running):**
```bash
cd extension
bun run dev
```
Extension builds to `extension/build/chrome-mv3-dev`

**Main App:**
```bash
cd ..
bun run dev
```
App runs on http://localhost:3000

---

## 🧪 Testing the Extension

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select `/Users/ronaldspalacis/Projects/smart-onboard/extension/build/chrome-mv3-dev`

### Test on Google Meet

1. Join a Google Meet call (create a test meeting)
2. The sidebar should automatically appear on the right side
3. Click the microphone to start recording
4. Speak to test transcription

### What to Expect:

- **Sidebar appears** when you join a Google Meet call
- **Audio is captured** from your tab
- **Transcription** happens every 5 seconds (chunks sent to Whisper)
- **Speaker identification** attempts to label agent vs client
- **Checklist items** auto-complete based on conversation
- **AI question prompts** suggest what to ask next

---

## 🔧 Configuration

### Set User ID for Extension

The extension needs to know which user is using it. Store the user ID:

```javascript
// Run in Chrome DevTools console on your app
chrome.storage.local.set({ userId: 'your-stack-auth-user-id' })
```

Or create a settings page in the extension to authenticate.

### Customize Default Checklist

Edit `app/api/checklist/route.ts` - function `getDefaultChecklist()`:

```typescript
{
  label: 'Your custom checklist item',
  description: 'What info you want to gather',
  category: 'business_basics', // or 'goals', 'technical', 'budget'
  required: true,
}
```

---

## 🎯 How It Works

### 1. Extension Flow

```
User joins Meet → Content script detects → Sidebar renders →
→ useCallSession hook creates session →
→ useAudioRecorder starts capturing →
→ Audio chunks sent to /api/transcribe →
→ Whisper transcribes → Saved to DB →
→ AI analyzes for checklist completion →
→ Question service generates next prompt →
→ WebSocket updates sidebar in real-time
```

### 2. Audio Processing

- **Capture:** `MediaRecorder` API records tab audio every 5 seconds
- **Format:** WebM with Opus codec
- **Upload:** Chunks sent as `FormData` to `/api/transcribe`
- **Transcription:** OpenAI Whisper API (`whisper-1` model)
- **Storage:** Text saved to `transcript_segments` table

### 3. Speaker Identification

Currently using **simple heuristic**:
- First speaker = Agent
- Alternates between agent/client based on conversation flow
- Questions (contains "?") likely from agent

**Future improvement:** Integrate Pyannote.audio or similar for voice fingerprinting.

### 4. Checklist Auto-Completion

Every few transcript segments:
1. Recent conversation sent to GPT-4o
2. AI identifies which checklist items were answered
3. Extracts exact client quotes
4. Returns confidence score (only ≥0.8 auto-complete)
5. Updates checklist in sidebar with animation

### 5. Question Generation

Based on:
- Agency config (industry, tone, goals)
- Uncompleted checklist items
- Recent conversation context
- Client's last response

GPT-4o generates natural, conversational follow-up questions.

---

## 🐛 Troubleshooting

### Extension Not Appearing

- Check you're on `https://meet.google.com/*`
- Open DevTools → Console for errors
- Reload the extension in `chrome://extensions`

### Audio Not Recording

- Grant microphone permission when prompted
- Check Chrome has `tabCapture` permission
- Verify `package.json` manifest includes permissions

### Transcription Fails

- Check OpenAI API key is valid
- Verify API has credits
- Check audio format is supported (WebM/Opus)
- Look at backend logs (`bun run dev` terminal)

### Database Errors

- Ensure migration ran successfully
- Check `DATABASE_URL` is correct
- Verify tables exist: `call_sessions`, `transcript_segments`, `checklist_items`, etc.

---

## 📊 Database Schema

New tables created:

### `call_sessions`
- Stores each Google Meet call session
- Links to user and agency config
- Tracks duration, status, meeting URL

### `transcript_segments`
- Individual speech segments
- Speaker identification (agent/client)
- Timestamp and confidence score

### `checklist_items`
- Template checklist per agency
- Categorized and ordered items
- Required vs optional

### `checklist_completions`
- Tracks which items were answered
- Stores extracted info from client
- Links to specific transcript segment

### `question_prompts`
- Log of AI-suggested questions
- Analytics on which prompts were used

---

## 🚧 What's NOT Implemented (Yet)

These are in the implementation plan but not built in the 24-hour MVP:

❌ WebSocket server (currently extension polls API)
❌ Voice fingerprinting for speaker ID
❌ Call recording storage
❌ Post-call summary generation
❌ RAG chatbot for querying past calls
❌ Dashboard view of call history
❌ Multi-language support
❌ Mobile support

---

## 🔜 Next Steps (Priority Order)

### Immediate (Next 4-8 Hours)

1. **WebSocket Server**
   - Real-time bidirectional communication
   - Eliminates polling delays
   - Better for live updates

2. **Test with Real Calls**
   - Join actual client calls
   - Refine speaker identification
   - Improve question prompts

3. **Dashboard Integration**
   - Add "Calls" tab to admin dashboard
   - Display call history
   - View transcripts and checklists

### Soon (Next 2-3 Days)

4. **Improve Speaker Diarization**
   - Integrate Deepgram or AssemblyAI (has built-in diarization)
   - Voice fingerprinting
   - Manual override UI

5. **Post-Call Summary**
   - Generate AI summary when call ends
   - Extract key insights
   - Create structured data for CRM

6. **Better UX**
   - Loading states
   - Error handling
   - Offline mode
   - Settings panel

---

## 💡 Tips for Testing

### Simulate Two Speakers

Since you're testing solo:
1. Start a Meet call
2. Use two browser profiles (different windows)
3. One profile = agent (you speaking)
4. Other profile = client (use text-to-speech or recordings)

### Test Checklist Auto-Completion

Say sentences like:
- "We're doing about $50k per month in revenue"
- "Our current budget for ads is around $5k monthly"
- "We're using Shopify and Klaviyo right now"

Watch the checklist auto-complete in sidebar!

### Test Question Suggestions

After client responds, wait 2-3 seconds for AI to suggest next question.

---

## 📞 API Endpoints Reference

### Sessions

```bash
# Create session
POST /api/sessions
{
  "userId": "user-123",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "agencyConfigId": 1
}

# Get user's sessions
GET /api/sessions?userId=user-123

# Update session
PATCH /api/sessions/:id
{
  "status": "completed",
  "duration": 1850
}
```

### Transcription

```bash
# Transcribe audio chunk
POST /api/transcribe
FormData {
  audio: Blob,
  sessionId: "session-123",
  timestamp: "2025-11-29T18:00:00Z"
}
```

### Checklist

```bash
# Get checklist for user
GET /api/checklist?userId=user-123

# Create custom checklist
POST /api/checklist
{
  "agencyConfigId": 1,
  "items": [
    {
      "label": "Monthly revenue",
      "description": "Current MRR",
      "category": "business_basics",
      "required": true
    }
  ]
}
```

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Extension sidebar appears on Google Meet
✅ You see live transcript as you speak
✅ Checklist items auto-complete based on what you say
✅ AI suggests relevant questions in the purple prompt box
✅ Progress bar updates as items are completed
✅ Database has transcript segments and session records

---

## 📝 Notes

- **Whisper cost:** ~$0.006/minute ($0.36/hour)
- **GPT-4o cost:** ~$0.05 per question generation
- **Expected cost:** ~$0.50 per 1-hour call
- **Latency:** 2-4 seconds for transcription per chunk
- **Browser support:** Chrome only (Plasmo supports others but needs testing)

---

## 🆘 Need Help?

### Check Logs

**Extension logs:**
```
Chrome DevTools → Console (F12) while on Google Meet
```

**Backend logs:**
```
Terminal running `bun run dev`
```

### Common Issues

**"Failed to transcribe"**
→ Check OpenAI API key and credits

**"Session not found"**
→ Ensure userId is set in extension storage

**"Checklist empty"**
→ Create agency config in dashboard first

---

**You're all set!** 🚀

Load the extension, join a Google Meet call, and watch your AI assistant in action.
