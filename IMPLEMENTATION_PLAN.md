# SmartOnboard AI - Live Call Assistant Implementation Plan

## 🎯 Project Vision

Transform SmartOnboard from an async AI onboarding form into a **real-time Google Meet companion** that:
- Transcribes agent-client conversations using OpenAI Whisper
- Provides intelligent, context-aware question prompts to the agent
- Maintains a dynamic checklist that auto-completes based on indirect answers
- Stores full transcripts for future RAG-based insights
- Maintains the human touch while AI assists behind the scenes

---

## 📋 Core Features Overview

### 1. **Browser Extension (Google Meet Sidebar)**
- Activates automatically when Google Meet is detected
- Displays as a collapsible sidebar overlay
- Real-time transcription with speaker identification (Agent vs Client)
- AI-generated question prompts for the agent
- Dynamic checklist of onboarding requirements
- Visual feedback for completed items

### 2. **Real-time Transcription**
- Uses OpenAI Whisper API for speech-to-text
- Speaker diarization (Agent vs Client identification)
- Live transcript display in sidebar
- Buffered audio processing for accuracy

### 3. **AI-Powered Assistance**
- Context-aware question suggestions based on:
  - Agency configuration (from existing system)
  - Current conversation context
  - Uncompleted checklist items
- Intelligent checklist auto-completion when questions are answered indirectly
- Natural language understanding to map responses to requirements

### 4. **Database Storage (RAG Foundation)**
- Store full transcripts with timestamps
- Link transcripts to agency configs and clients
- Enable future chatbot queries about client conversations
- Structured data extraction from conversations

---

## 🏗️ Technical Architecture

### Tech Stack Additions

```
Browser Extension:
- Plasmo Framework (already set up ✅)
- Chrome Extension Manifest V3
- React 18 for UI components
- Zustand for state management
- TailwindCSS for styling

Audio Processing:
- MediaRecorder API (browser native)
- Web Audio API for audio capture
- WebSocket for real-time audio streaming

AI Services:
- OpenAI Whisper API (transcription)
- OpenAI GPT-4o (question generation & checklist analysis)
- Optional: Deepgram (faster/cheaper alternative to Whisper)

Backend API:
- Next.js API Routes (extend existing)
- WebSocket server (Socket.io or native WebSockets)
- PostgreSQL (extend existing schema)
- Redis (optional: for real-time state caching)
```

---

## 📊 Database Schema Extensions

### New Tables

```typescript
// Call sessions table
export const callSessions = pgTable('call_sessions', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').notNull().references(() => users.id),
  agencyConfigId: integer('agency_config_id').references(() => agencyConfigs.id),
  clientName: text('client_name'),
  clientEmail: text('client_email'),
  meetingUrl: text('meeting_url'),
  status: text('status').notNull(), // 'active', 'completed', 'paused'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // seconds
  summary: text('summary'), // AI-generated post-call summary
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transcript segments table
export const transcriptSegments = pgTable('transcript_segments', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  speaker: text('speaker').notNull(), // 'agent' or 'client'
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'), // Whisper confidence score
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Checklist items table
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  agencyConfigId: integer('agency_config_id').notNull().references(() => agencyConfigs.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description'),
  category: text('category'), // 'business_basics', 'goals', 'budget', etc.
  order: integer('order').notNull(),
  required: boolean('required').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Checklist completions table
export const checklistCompletions = pgTable('checklist_completions', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  checklistItemId: integer('checklist_item_id').notNull().references(() => checklistItems.id),
  completedAt: timestamp('completed_at').notNull(),
  extractedInfo: text('extracted_info'), // What the client said that satisfied this item
  transcriptSegmentId: integer('transcript_segment_id').references(() => transcriptSegments.id),
  manuallyMarked: boolean('manually_marked').default(false),
});

// AI question prompts table (for analytics)
export const questionPrompts = pgTable('question_prompts', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  category: text('category'),
  suggested: boolean('suggested').default(true), // AI suggested vs manually triggered
  usedByAgent: boolean('used_by_agent').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Schema Update to `agencyConfigs`

Add checklist template configuration:
```typescript
checklistTemplate: jsonb('checklist_template'), // Default checklist items
enableLiveAssist: boolean('enable_live_assist').default(true),
whisperModel: text('whisper_model').default('whisper-1'),
```

---

## 🔧 Implementation Phases

## **Phase 1: Foundation & Audio Capture (Week 1-2)**

### 1.1 Extension Structure Setup
- [x] Plasmo dev environment running
- [ ] Content script for Google Meet detection
- [ ] Sidebar UI component (React)
- [ ] Message passing between content script and background
- [ ] Storage API for session persistence

**Files to Create:**
```
extension/
├── contents/
│   └── google-meet.tsx         # Content script for Meet detection
├── components/
│   ├── Sidebar.tsx              # Main sidebar component
│   ├── TranscriptView.tsx       # Live transcript display
│   ├── ChecklistPanel.tsx       # Checklist UI
│   └── QuestionPrompts.tsx      # AI question suggestions
├── background/
│   └── index.ts                 # Background service worker
├── lib/
│   ├── audio-capture.ts         # Audio recording logic
│   ├── websocket-client.ts      # WebSocket connection
│   └── storage.ts               # Chrome storage wrapper
├── hooks/
│   ├── useAudioRecorder.ts
│   ├── useTranscription.ts
│   └── useChecklist.ts
└── types/
    └── index.ts                 # TypeScript types
```

### 1.2 Google Meet Integration
- [ ] Detect when user joins a Google Meet call
- [ ] Inject sidebar UI into Meet interface
- [ ] Capture tab audio using Chrome's `tabCapture` API
- [ ] Handle Meet-specific DOM manipulation
- [ ] Persist sidebar state across page reloads

**Key Challenges:**
- Google Meet uses Shadow DOM - need careful selector targeting
- Audio capture requires `activeTab` and `tabCapture` permissions
- Sidebar positioning must not interfere with Meet controls

### 1.3 Audio Processing Pipeline
- [ ] Set up MediaRecorder to capture audio stream
- [ ] Buffer audio in chunks (e.g., 5-second intervals)
- [ ] Convert audio to format compatible with Whisper (MP3/WAV)
- [ ] Implement audio quality optimization (noise reduction)
- [ ] Handle pause/resume during call

**Technical Notes:**
```typescript
// Audio capture example structure
interface AudioChunk {
  id: string;
  blob: Blob;
  timestamp: number;
  duration: number;
}

// MediaRecorder config
const recorderOptions = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000
};
```

---

## **Phase 2: Transcription & Speaker Diarization (Week 3-4)**

### 2.1 Backend API Endpoints
Create in `app/api/`:

```
app/api/
├── transcribe/
│   └── route.ts                # POST /api/transcribe
├── sessions/
│   ├── route.ts                # GET/POST /api/sessions
│   └── [id]/
│       ├── route.ts            # GET/PATCH /api/sessions/:id
│       └── transcript/
│           └── route.ts        # GET /api/sessions/:id/transcript
├── checklist/
│   ├── route.ts                # GET/POST /api/checklist
│   └── analyze/
│       └── route.ts            # POST /api/checklist/analyze
└── websocket/
    └── route.ts                # WebSocket upgrade handler
```

**API Endpoint Details:**

#### `POST /api/transcribe`
```typescript
// Request
{
  audioChunk: Blob,
  sessionId: string,
  timestamp: number
}

// Response
{
  text: string,
  speaker: 'agent' | 'client' | 'unknown',
  confidence: number,
  segmentId: number
}
```

#### `POST /api/checklist/analyze`
```typescript
// Request
{
  sessionId: string,
  recentTranscript: TranscriptSegment[],
  checklistItems: ChecklistItem[]
}

// Response
{
  completedItems: {
    itemId: number,
    extractedInfo: string,
    confidence: number
  }[],
  suggestedQuestions: string[]
}
```

### 2.2 OpenAI Whisper Integration
- [ ] Set up OpenAI SDK in backend
- [ ] Create transcription service (`services/whisperService.ts`)
- [ ] Handle API rate limits and retries
- [ ] Implement error handling for poor audio quality
- [ ] Add fallback mechanism (retry with different parameters)

**Service Structure:**
```typescript
// services/whisperService.ts
export async function transcribeAudio(
  audioBlob: Blob,
  options?: {
    language?: string,
    prompt?: string, // Context from previous segments
    temperature?: number
  }
): Promise<TranscriptionResult>
```

### 2.3 Speaker Diarization
**Options:**
1. **Simple heuristic approach:**
   - First speaker = Agent (assumption: agent starts call)
   - Use voice pattern detection (basic)
   - Manual correction UI in extension

2. **Advanced approach (future):**
   - Use Whisper with speaker labels (requires fine-tuning)
   - Integrate Pyannote.audio for diarization
   - ML model trained on agent-client patterns

**MVP Decision:** Start with Option 1 (simple heuristic) + manual override

### 2.4 Real-time WebSocket Connection
- [ ] Set up WebSocket server in Next.js
- [ ] Establish connection from extension to backend
- [ ] Stream audio chunks over WebSocket
- [ ] Receive transcription results in real-time
- [ ] Handle connection drops and reconnection

**WebSocket Events:**
```typescript
// Client → Server
'audio:chunk' - Send audio for transcription
'session:start' - Initialize new call session
'session:end' - End call session
'checklist:manual_toggle' - Manually check/uncheck item

// Server → Client
'transcript:segment' - New transcription segment
'checklist:updated' - Checklist item auto-completed
'question:suggested' - New AI question prompt
'error' - Error occurred
```

---

## **Phase 3: AI Question Generation & Checklist Intelligence (Week 5-6)**

### 3.1 Context-Aware Question Generation
Create `services/questionService.ts`:

```typescript
export async function generateNextQuestion(
  context: {
    agencyConfig: AgencyConfig,
    checklist: ChecklistItem[],
    completedItems: number[],
    recentTranscript: TranscriptSegment[],
    callDuration: number
  }
): Promise<QuestionPrompt>
```

**Prompt Engineering Strategy:**
```
System Prompt:
You are an AI assistant helping a sales agent conduct a client onboarding call.
Based on the conversation so far and the remaining checklist items, suggest
the most natural next question for the agent to ask.

Rules:
1. Questions should feel conversational, not robotic
2. Build on what the client just said (reference their words)
3. Prioritize required checklist items
4. Don't repeat information already covered
5. Keep questions open-ended to encourage dialogue
6. Maximum 1-2 sentences

Conversation Context:
[Recent transcript segments]

Checklist Status:
✅ Completed: [items]
⏳ Remaining: [items]

Suggest the next question for the agent to ask.
```

### 3.2 Intelligent Checklist Analysis
Create `services/checklistAnalyzer.ts`:

```typescript
export async function analyzeTranscriptForCompletions(
  transcript: TranscriptSegment[],
  pendingItems: ChecklistItem[]
): Promise<ChecklistCompletion[]>
```

**Approach:**
1. Use GPT-4o with structured output (JSON mode)
2. Feed recent conversation + checklist items
3. Ask: "Which checklist items were answered (directly or indirectly)?"
4. Return matches with confidence scores
5. Only auto-complete items with >80% confidence

**Example Prompt:**
```json
{
  "checklist_items": [
    {
      "id": 1,
      "label": "Current monthly revenue",
      "description": "Understand client's business size"
    },
    {
      "id": 2,
      "label": "Marketing budget",
      "description": "Budget allocated for marketing"
    }
  ],
  "transcript": [
    {
      "speaker": "agent",
      "text": "Tell me about your business"
    },
    {
      "speaker": "client",
      "text": "We're doing about 50k a month right now, and we spend about 5k on ads"
    }
  ]
}

# Expected Output:
{
  "completed_items": [
    {
      "item_id": 1,
      "extracted_info": "50k monthly revenue",
      "confidence": 0.95
    },
    {
      "item_id": 2,
      "extracted_info": "5k monthly ad spend",
      "confidence": 0.90
    }
  ]
}
```

### 3.3 Checklist Template Management
- [ ] UI in dashboard to create/edit checklist templates
- [ ] Default templates for different industries
- [ ] Category grouping (Business Basics, Goals, Budget, Timeline, etc.)
- [ ] Required vs optional items
- [ ] Custom fields per agency

**UI Location:** Admin Dashboard → Setup Tab → "Call Checklist" section

---

## **Phase 4: Extension UI/UX (Week 7-8)**

### 4.1 Sidebar Layout

```
┌─────────────────────────────┐
│  SmartOnboard AI Assistant  │ ← Header
├─────────────────────────────┤
│                             │
│  🔴 Recording • 05:23       │ ← Status bar
│                             │
├─────────────────────────────┤
│ 💡 Suggested Question       │
├─────────────────────────────┤
│ "What's your current        │
│ monthly revenue range?"     │
│                             │
│ [Copy] [Dismiss] [Manual]   │
├─────────────────────────────┤
│ 📋 Onboarding Checklist     │
├─────────────────────────────┤
│ Business Basics             │
│ ✅ Industry                 │
│ ✅ Monthly revenue          │
│ ⏳ Team size                │
│ ⏳ Current tech stack       │
│                             │
│ Goals & Objectives          │
│ ⏳ Primary goal             │
│ ⏳ Success metrics          │
│                             │
│ [3 of 12 completed]         │
├─────────────────────────────┤
│ 📝 Live Transcript          │ ← Collapsible
├─────────────────────────────┤
│ 05:20 Agent                 │
│ What industry are you in?   │
│                             │
│ 05:22 Client                │
│ We're an e-commerce brand   │
│ selling fitness apparel     │
│                             │
└─────────────────────────────┘
```

### 4.2 Component Specifications

#### **Sidebar.tsx**
```typescript
interface SidebarProps {
  session: CallSession | null;
  isRecording: boolean;
  onToggleRecording: () => void;
}

// Features:
// - Collapsible sections
// - Draggable/resizable
// - Minimize to floating button
// - Dark mode support
```

#### **QuestionPrompts.tsx**
```typescript
interface QuestionPromptsProps {
  currentPrompt: QuestionPrompt | null;
  onDismiss: () => void;
  onCopy: () => void;
  onRequestManual: () => void;
}

// Features:
// - Auto-rotate prompts (optional)
// - Manual question request
// - History of suggested questions
// - Copy to clipboard
```

#### **ChecklistPanel.tsx**
```typescript
interface ChecklistPanelProps {
  items: ChecklistItem[];
  completions: ChecklistCompletion[];
  onManualToggle: (itemId: number) => void;
}

// Features:
// - Grouped by category
// - Progress bar
// - Manual check/uncheck
// - Hover to see extracted info
// - Highlight recently completed
```

#### **TranscriptView.tsx**
```typescript
interface TranscriptViewProps {
  segments: TranscriptSegment[];
  autoScroll: boolean;
}

// Features:
// - Speaker color coding
// - Timestamps
// - Auto-scroll to latest
// - Search/filter
// - Export transcript
```

### 4.3 Animations & Feedback
- [ ] Smooth slide-in when call starts
- [ ] Pulse animation when new question suggested
- [ ] Checkmark animation when item auto-completes
- [ ] Shimmer loading for transcription in progress
- [ ] Toast notifications for errors

**Libraries:**
- Framer Motion (already used in main app - `motion` package)
- Tailwind transitions

---

## **Phase 5: Dashboard Integration (Week 9-10)**

### 5.1 Call History View
New section in Admin Dashboard:

```typescript
// components/CallHistory.tsx
interface CallHistoryProps {
  sessions: CallSession[];
}

// Features:
// - List of all past calls
// - Filter by date, client, status
// - Search by client name or transcript content
// - Quick stats (avg duration, completion rate)
// - Export to CSV
```

**UI Mockup:**
```
┌────────────────────────────────────────────────────────┐
│ Recent Calls                                           │
├────────────────────────────────────────────────────────┤
│ Client Name       | Date       | Duration | Checklist  │
├────────────────────────────────────────────────────────┤
│ Acme Corp        │ Nov 28     │ 23:45    │ 12/12 ✅   │
│ TechStart Inc    │ Nov 27     │ 18:32    │ 8/12 ⏳    │
│ FitBrand LLC     │ Nov 26     │ 31:12    │ 12/12 ✅   │
└────────────────────────────────────────────────────────┘
```

### 5.2 Call Detail View
Click into a call to see:
- Full transcript with timestamps
- Checklist completion timeline
- AI-generated summary
- Extracted key info (structured data)
- Recording playback (future feature)

### 5.3 Analytics Dashboard
New "Analytics" tab:
- Average call duration
- Checklist completion rates
- Most commonly missed items
- Question effectiveness (did agent use AI suggestions?)
- Transcription accuracy metrics

---

## **Phase 6: RAG Foundation (Week 11-12)**

### 6.1 Vector Database Setup
**Options:**
1. **Supabase pgvector** (extends existing Postgres)
2. **Pinecone** (dedicated vector DB)
3. **Weaviate** (open-source)

**Recommendation:** Supabase pgvector (least infrastructure overhead)

### 6.2 Embedding Generation
- [ ] Generate embeddings for each transcript segment
- [ ] Store in vector database with metadata
- [ ] Create semantic search endpoint

```typescript
// services/embeddingService.ts
export async function generateEmbedding(
  text: string
): Promise<number[]> {
  // Use OpenAI text-embedding-3-small
}

// New table for embeddings
export const transcriptEmbeddings = pgTable('transcript_embeddings', {
  id: serial('id').primaryKey(),
  segmentId: integer('segment_id').references(() => transcriptSegments.id),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 6.3 RAG Query Endpoint
```typescript
// app/api/chat/route.ts
POST /api/chat

// Request
{
  userId: string,
  question: string,
  context?: {
    clientName?: string,
    dateRange?: [string, string]
  }
}

// Response
{
  answer: string,
  sources: {
    callSessionId: string,
    clientName: string,
    date: string,
    excerpt: string
  }[]
}
```

### 6.4 Chatbot UI (Future)
- [ ] New "Ask AI" tab in dashboard
- [ ] Chat interface to query call history
- [ ] Examples:
  - "What did John from Acme Corp say about their budget?"
  - "Show me all clients who mentioned TikTok ads"
  - "What are common objections about pricing?"

---

## 🚀 MVP Scope (First 8 Weeks)

### Must-Have Features (P0)
✅ Extension activates on Google Meet
✅ Audio capture and real-time transcription
✅ Basic speaker identification (agent vs client)
✅ Display live transcript in sidebar
✅ Predefined checklist for agency
✅ AI question suggestions based on checklist
✅ Store transcript in database
✅ Dashboard view of past call transcripts

### Nice-to-Have (P1 - Post-MVP)
⏳ Auto-complete checklist items from conversation
⏳ Resizable/draggable sidebar
⏳ Export transcript to PDF
⏳ Multi-language support
⏳ Call recording storage
⏳ Real-time collaboration (multiple agents on same call)

### Future (P2 - V2.0)
🔮 RAG-powered chatbot
🔮 Automatic CRM updates
🔮 Post-call summary emails
🔮 Sentiment analysis
🔮 Integration with calendar (auto-start on scheduled calls)
🔮 Mobile app for reviewing calls

---

## 📝 What You Need to Provide

### Immediately (for MVP)

1. **OpenAI API Keys**
   - Whisper API access
   - GPT-4o API access for question generation
   - Budget expectations for API costs

2. **Sample Checklist Templates**
   - What are the 10-15 things you MUST learn from every client call?
   - How should they be categorized?
   - Example:
     - Business Basics: Industry, revenue, team size
     - Goals: Primary objective, success metrics, timeline
     - Budget: Marketing spend, price sensitivity
     - Technical: Current tools, integrations needed

3. **Agent Personas**
   - What tone should AI questions have? (Professional, Friendly, Consultative)
   - Any specific terminology your industry uses?
   - Example questions you'd ask in real calls

4. **Google Meet Access**
   - Google Workspace account for testing
   - Sample meet links for development
   - Any specific Meet features you use (breakout rooms, recording, etc.)

### Soon (Week 3-4)

5. **Beta Testers**
   - 2-3 agents willing to test extension on real calls
   - Feedback on accuracy, helpfulness, UX

6. **Design Preferences**
   - Color scheme for extension (should match your brand?)
   - Logo/branding assets
   - Preferred placement for sidebar (left vs right)

### Later (Week 8+)

7. **RAG Use Cases**
   - What questions would you want to ask your call database?
   - How would you use insights from past calls?
   - Integration needs (CRM, email, Slack, etc.)

---

## ⚙️ Environment Setup Checklist

Before starting development, ensure you have:

```bash
# Backend
✅ DATABASE_URL (Postgres with Neon)
✅ NEXT_PUBLIC_STACK_PROJECT_ID
✅ STACK_SECRET_SERVER_KEY
□ OPENAI_API_KEY (Whisper + GPT-4o)
□ REDIS_URL (optional, for WebSocket scaling)

# Extension
□ Chrome Web Store Developer Account ($5 one-time)
□ Extension ID (generated during first publish)
□ CSP configuration for API calls

# Development Tools
✅ Bun installed
✅ Node.js 20+
✅ Chrome browser
□ ngrok or similar (for WebSocket testing)
```

---

## 🎯 Success Metrics

### Technical Metrics
- **Transcription Accuracy:** >90% word accuracy
- **Latency:** <3 seconds from speech to transcript display
- **Checklist Auto-completion:** >70% accuracy
- **Question Relevance:** >80% agent acceptance rate
- **Uptime:** >99% during calls (no crashes)

### Business Metrics
- **Agent Time Saved:** Target 20+ min per call (less note-taking)
- **Onboarding Completion:** >95% of checklist items covered
- **Client Satisfaction:** Maintain or improve (AI should be invisible to client)
- **Proposal Accuracy:** Reduce revision cycles by 30%

---

## 🚧 Potential Challenges & Solutions

### Challenge 1: Audio Quality in Browser
**Problem:** Tab audio capture may have background noise, music, notifications
**Solution:**
- Use Web Audio API noise suppression
- Whisper's robustness to background noise
- Allow manual re-transcription of segments

### Challenge 2: Google Meet Updates Breaking Extension
**Problem:** Google frequently updates Meet UI
**Solution:**
- Use stable selectors (data attributes, not class names)
- Graceful degradation if elements not found
- Automated tests for Meet compatibility
- Monitor Google Meet release notes

### Challenge 3: Whisper API Costs
**Problem:** At scale, transcription costs could be high ($0.006/min = $0.36 per hour call)
**Solution:**
- Implement local Whisper model (faster, free)
- Use Deepgram (cheaper alternative: $0.0043/min)
- Offer tiered plans (unlimited vs pay-per-minute)
- Cache and deduplicate audio chunks

### Challenge 4: Real-time Performance
**Problem:** WebSocket latency, API delays
**Solution:**
- Use edge functions for transcription (Vercel Edge)
- Batch audio chunks intelligently (balance speed vs accuracy)
- Client-side buffering and optimistic UI updates
- Redis for session state (faster than Postgres queries)

### Challenge 5: Speaker Diarization Accuracy
**Problem:** Hard to distinguish agent from client
**Solution:**
- Start with manual "I'm the agent" button
- Use voice fingerprinting (different pitch/tone)
- Future: Train custom model on agency's calls
- Allow quick correction UI (swap speaker labels)

### Challenge 6: Privacy & Compliance
**Problem:** Recording calls has legal implications
**Solution:**
- Clear consent mechanism (client sees "Recording" indicator)
- Compliance with recording laws (2-party consent states)
- Data encryption at rest and in transit
- GDPR/CCPA data deletion workflows
- Terms of service updates

---

## 📚 Development Resources

### APIs & SDKs
- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Plasmo Framework Docs](https://docs.plasmo.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

### Similar Projects (for inspiration)
- [Fireflies.ai](https://fireflies.ai/) - Meeting transcription
- [Gong.io](https://www.gong.io/) - Sales call intelligence
- [Otter.ai](https://otter.ai/) - Live transcription
- [Momentum](https://momentum.io/) - Sales automation

### Codebase References
- Existing: `services/geminiService.ts` - Pattern for AI service
- Existing: `app/actions.ts` - Pattern for server actions
- Existing: `components/OnboardingFlow.tsx` - State management pattern

---

## 🎬 Next Steps (Getting Started)

1. **Review this plan** - Ask questions, clarify requirements
2. **Provide OpenAI API key** - Critical for starting transcription work
3. **Share sample checklist** - What must be learned on every call?
4. **Test Google Meet access** - Ensure you can join test meetings
5. **Approve schema changes** - Database migrations for new tables
6. **Set up dev environment** - Install any missing dependencies

**Estimated Timeline:**
- Weeks 1-2: Foundation (Extension + Audio)
- Weeks 3-4: Transcription (Whisper integration)
- Weeks 5-6: AI Intelligence (Questions + Checklist)
- Weeks 7-8: UI Polish + Testing
- **Target MVP:** 8 weeks from start

---

## 💬 Questions for You

Before I start implementing:

1. **Checklist Priority:** Do you have a standard set of questions/info you need from every call? Can you list them?

2. **Speaker Identification:** How important is automatic agent vs client detection? Would a manual "I'm speaking" / "Client speaking" toggle be acceptable for MVP?

3. **Budget:** What's your expected monthly OpenAI spend? (Whisper: ~$0.36/hour, GPT-4o: ~$0.05 per question generation)

4. **Timeline:** Is the 8-week MVP timeline acceptable, or is there a hard deadline?

5. **Scope Adjustment:** Would you prefer a working basic version in 4 weeks, then iterate? Or full-featured in 8 weeks?

6. **Integration:** Any other tools you want this to connect to? (Slack notifications, CRM auto-fill, etc.)

7. **Deployment:** Who will be using this initially? Just you, or a team of agents?

---

**Ready to build when you are! 🚀**

Let me know which questions above are most urgent, and I'll start with the highest-priority features first.
