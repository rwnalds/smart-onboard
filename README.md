# 🎯 SmartOnboard AI

> AI-powered client intelligence platform for sales teams. Capture, transcribe, and analyze client conversations in real-time during Google Meet calls.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Features

### 🎙️ Real-Time Call Transcription
- Chrome extension seamlessly integrates with Google Meet
- Live audio capture and transcription using OpenAI Whisper
- Speaker identification (agent vs. client)
- Automatic transcript storage and indexing

### 🤖 AI-Powered Intelligence
- Context-aware question suggestions during calls
- Intelligent checklist auto-completion
- Post-call summaries and insights extraction
- RAG-powered chat for querying past conversations

### 📊 Client Management
- Centralized client database with automatic deduplication
- Track all interactions and touchpoints
- View conversation history and insights
- Export client data and analytics

### 🔍 Smart Search
- Search across all client transcripts
- Semantic search powered by AI
- Find specific topics or mentions instantly

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ or **Bun** 1.0+
- **PostgreSQL** database (we recommend [Neon](https://neon.tech))
- **Chrome browser** (for the extension)
- API keys for:
  - [Stack Auth](https://stack-auth.com) (authentication)
  - [OpenAI](https://platform.openai.com) (transcription)
  - [Google Gemini](https://ai.google.dev) (question generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-onboard.git
   cd smart-onboard
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host/database

   # Stack Auth (https://stack-auth.com)
   NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
   STACK_SECRET_SERVER_KEY=your_secret_key

   # OpenAI (https://platform.openai.com)
   OPENAI_API_KEY=sk-...

   # Google Gemini (https://ai.google.dev)
   NEXT_PUBLIC_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   ```bash
   bun run db:push
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

### Setting Up the Chrome Extension

1. **Install extension dependencies**
   ```bash
   cd extension
   bun install
   ```

2. **Build the extension**
   ```bash
   bun run dev
   ```

3. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select `extension/build/chrome-mv3-dev`

4. **Configure the extension**
   - Sign in to the web app at [http://localhost:3000](http://localhost:3000)
   - Copy your user ID from the browser console or settings
   - Open Chrome DevTools on any page and run:
     ```javascript
     chrome.storage.local.set({ userId: 'your-user-id-here' })
     ```

---

## 📖 How It Works

### The Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Join Google Meet Call                                    │
│     → Extension detects meeting and injects sidebar          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Start Recording                                          │
│     → Audio captured from tab using Chrome API               │
│     → Creates call session in database                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Real-Time Transcription                                  │
│     → Audio chunks sent to OpenAI Whisper every 5 seconds    │
│     → Transcripts appear live in sidebar                     │
│     → Speaker identification (agent vs client)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. AI Analysis                                              │
│     → GPT-4o analyzes conversation context                   │
│     → Auto-completes checklist items                         │
│     → Suggests next questions to ask                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Client Intelligence                                      │
│     → Automatic client identification/creation               │
│     → Insights extracted and stored                          │
│     → Searchable transcript archive                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Project Structure

```
smart-onboard/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── clients/            # Client management endpoints
│   │   ├── sessions/           # Call session CRUD
│   │   ├── transcripts/        # Transcript storage
│   │   ├── checklist/          # Checklist management
│   │   └── transcribe/         # Whisper transcription
│   ├── clients/                # Client management UI
│   │   ├── page.tsx            # Client list view
│   │   └── [clientId]/         # Individual client page
│   └── page.tsx                # Root page (redirects to /clients)
│
├── components/                 # React components
│   ├── ui/                     # Radix UI components
│   ├── ClientChat.tsx          # RAG-powered client chat
│   └── [deprecated]/           # Old onboarding components
│
├── db/                         # Database layer
│   ├── schema.ts               # Drizzle ORM schema
│   ├── index.ts                # Database client
│   └── migrations/             # SQL migrations
│
├── services/                   # Business logic
│   ├── whisperService.ts       # OpenAI Whisper integration
│   ├── questionService.ts      # AI question generation
│   ├── ragService.ts           # RAG chatbot
│   └── clientIdentifier.ts    # Client deduplication
│
├── extension/                  # Chrome Extension
│   ├── contents/
│   │   └── google-meet.tsx     # Google Meet content script
│   ├── components/
│   │   ├── Sidebar.tsx         # Main sidebar UI
│   │   ├── TranscriptView.tsx  # Live transcript
│   │   └── ChecklistPanel.tsx  # Checklist tracker
│   ├── hooks/
│   │   ├── useCallSession.ts   # Session management
│   │   └── useAudioRecorder.ts # Audio capture
│   └── package.json
│
└── types.ts                    # TypeScript type definitions
```

---

## 🗄️ Database Schema

The app uses PostgreSQL with Drizzle ORM. Here are the main tables:

### Core Tables

**`users`** - User accounts (synced from Stack Auth)
- `id`, `email`, `name`, `avatar`

**`clients`** - Client records
- `id`, `userId`, `name`, `email`, `company`, `role`
- `normalizedName` - For deduplication
- `lastContactedAt`, `tags`, `metadata`

**`callSessions`** - Google Meet call sessions
- `id`, `userId`, `clientId`, `meetingUrl`
- `status`, `startedAt`, `endedAt`, `duration`
- `summary`, `keyTakeaways`, `actionItems`, `sentiment`

**`transcriptSegments`** - Individual speech segments
- `id`, `callSessionId`, `clientId`, `speaker`, `text`
- `timestamp`, `confidence`

**`clientInsights`** - Extracted structured data
- `id`, `clientId`, `category`, `key`, `value`
- `confidence`, `sourceSessionId`

### Supporting Tables

- `checklistItems` - Template checklist per user
- `checklistCompletions` - Checklist tracking per call
- `questionPrompts` - AI-suggested questions log
- `chatMessages` - RAG chat history

See [db/schema.ts](db/schema.ts) for full schema details.

---

## 🛠️ Development

### Available Scripts

```bash
# Development server
bun run dev                    # Start Next.js dev server (localhost:3000)

# Production
bun run build                  # Build for production
bun start                      # Start production server

# Database
bun run db:push                # Push schema changes to database
bun run db:studio              # Open Drizzle Studio (database GUI)

# Code quality
bun run lint                   # Run ESLint
```

### Extension Development

```bash
cd extension

# Development mode (auto-reload)
bun run dev                    # Builds to build/chrome-mv3-dev

# Production build
bun run build                  # Builds to build/chrome-mv3-prod

# Package for distribution
bun run package                # Creates .zip for Chrome Web Store
```

---

## 🧪 Testing

### Testing the Extension

1. **Create a test Google Meet call**
   ```
   https://meet.google.com/new
   ```

2. **Join the call and verify:**
   - Sidebar appears on the right side
   - Microphone icon is visible
   - Checklist is displayed

3. **Start recording and speak:**
   - Click the microphone button
   - Grant permissions if prompted
   - Watch transcript appear in real-time

4. **Test checklist auto-completion:**

   Say phrases like:
   - "We're doing about $50k per month in revenue"
   - "Our marketing budget is around $10k monthly"
   - "We're currently using Shopify and Klaviyo"

   Watch the checklist items auto-complete!

### Test Question Suggestions

After the client responds, the AI will suggest contextual follow-up questions in the purple prompt box.

---

## 📊 API Reference

### Clients

```http
GET  /api/clients?userId={userId}
POST /api/clients
GET  /api/clients/{clientId}
PATCH /api/clients/{clientId}
```

### Sessions

```http
GET  /api/sessions?userId={userId}
POST /api/sessions
PATCH /api/sessions/{id}
```

### Transcription

```http
POST /api/transcribe
FormData {
  audio: Blob
  sessionId: string
  timestamp: string
}
```

### Checklist

```http
GET  /api/checklist?userId={userId}
POST /api/checklist
```

### RAG Chat

```http
POST /api/clients/{clientId}/chat
{
  userId: string
  message: string
}
```

See individual route files in `app/api/` for detailed parameters.

---

## 🔒 Security & Privacy

- All API routes are protected with CORS headers
- User authentication via Stack Auth
- Client data is isolated per user account
- Audio is processed server-side (not stored permanently)
- Transcripts are encrypted at rest in PostgreSQL

---

## 💰 Cost Estimates

Based on typical usage:

| Service | Cost | Notes |
|---------|------|-------|
| OpenAI Whisper | ~$0.006/min | $0.36/hour of audio |
| GPT-4o (questions) | ~$0.05/question | ~10 questions/call |
| Neon PostgreSQL | Free tier → $19/mo | 3GB storage included |
| Stack Auth | Free tier → $25/mo | Up to 1,000 MAUs |

**Estimated cost per 1-hour call:** ~$0.50 - $0.90

---

## 🐛 Troubleshooting

### Extension not appearing in Google Meet

- Verify you're on `https://meet.google.com/*`
- Check extension is enabled in `chrome://extensions`
- Open DevTools console for error messages
- Reload the extension

### Audio recording fails

- Grant microphone and tab capture permissions
- Check Chrome has `tabCapture` API access
- Verify extension manifest includes permissions
- Try refreshing the Google Meet page

### Transcription errors

- Verify OpenAI API key is valid and has credits
- Check audio format is WebM/Opus (automatic)
- Review backend logs in terminal
- Ensure `OPENAI_API_KEY` is set in `.env`

### Database connection issues

- Verify `DATABASE_URL` in `.env` is correct
- Check Neon dashboard for connection status
- Run `bun run db:push` to sync schema
- Ensure database is not suspended (Neon free tier)

---

## 🗺️ Roadmap

### ✅ Completed (v1.0)
- [x] Chrome extension with Google Meet integration
- [x] Real-time audio transcription
- [x] AI-powered question suggestions
- [x] Automatic checklist completion
- [x] Client management dashboard
- [x] Transcript search and storage
- [x] RAG-powered client chat

### 🚧 In Progress (v1.1)
- [ ] WebSocket for real-time updates (currently polling)
- [ ] Advanced speaker diarization
- [ ] Call recording storage
- [ ] Enhanced post-call summaries

### 📋 Planned (v2.0)
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Integrations (HubSpot, Salesforce, etc.)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Custom AI model training

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org) and [React](https://react.dev)
- UI components from [Radix UI](https://www.radix-ui.com) and [shadcn/ui](https://ui.shadcn.com)
- Authentication by [Stack Auth](https://stack-auth.com)
- Database hosted on [Neon](https://neon.tech)
- AI powered by [OpenAI](https://openai.com) and [Google Gemini](https://ai.google.dev)

---

## 📞 Support

- **Documentation:** See [QUICK_START.md](QUICK_START.md) for detailed setup
- **Issues:** [GitHub Issues](https://github.com/yourusername/smart-onboard/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/smart-onboard/discussions)

---

<div align="center">

**Built with ❤️ for sales teams who want to focus on conversations, not note-taking.**

[Get Started](#-quick-start) • [Documentation](QUICK_START.md) • [Report Bug](https://github.com/yourusername/smart-onboard/issues)

</div>
