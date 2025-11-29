# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartOnboard AI is an AI-powered client onboarding platform that enables agencies to create customized, conversational onboarding forms. The system uses Google's Gemini AI to dynamically generate contextual questions based on agency configuration and client responses.

**Core Workflow:**
1. Agency admins configure their onboarding flow (brand, industry, goals, tone, target audience)
2. System generates a unique shareable URL slug for the onboarding form
3. Clients access the form via the public URL and answer AI-generated questions
4. AI adapts questions based on responses, gathering comprehensive business intelligence
5. Submissions are saved to PostgreSQL database for the agency to review

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **Authentication:** Stack Auth (@stackframe/stack)
- **AI:** Google Gemini 2.5 Flash (@google/genai)
- **UI:** React 19 + Tailwind CSS 4 + Radix UI + Motion (Framer Motion)
- **Styling:** Tailwind CSS with custom theming support

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
bun run dev

# Production build
bun run build

# Start production server
bun start

# Lint codebase
bun run lint

# Push database schema changes to Neon
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio
```

## Environment Variables

Required environment variables (check `.env` file):

- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack Auth project ID
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Stack Auth public key
- `STACK_SECRET_SERVER_KEY` - Stack Auth secret key
- `NEXT_PUBLIC_API_KEY` - Google Gemini API key (used in geminiService.ts)

## Architecture & Key Patterns

### Directory Structure

```
/app                    # Next.js App Router pages
  /actions.ts          # Server actions (database operations)
  /page.tsx            # Main dashboard (admin view)
  /layout.tsx          # Root layout with Stack Auth provider
  /onboard/[slug]/     # Public onboarding form route
  /handler/[...stack]/ # Stack Auth handler routes

/components            # React components
  /AdminDashboard.tsx  # Agency configuration & submissions view
  /OnboardingFlow.tsx  # Conversational form UI
  /FormInput.tsx       # Dynamic input renderer
  /ui/                 # Radix UI components (shadcn-style)

/db                    # Database layer
  /schema.ts           # Drizzle ORM schema definitions
  /index.ts            # Database client export

/services              # Business logic
  /geminiService.ts    # AI question generation

/stack                 # Stack Auth configuration
  /client.tsx          # Client-side auth app
  /server.tsx          # Server-side auth app

/types.ts              # Global TypeScript types
```

### Authentication Flow

- **Stack Auth** handles all authentication
- Root layout wraps app in `<StackProvider>` and `<StackTheme>`
- Main page checks for authenticated user via `useUser()` hook
- Unauthenticated users are redirected to `/handler/sign-in`
- User data is synced to local database via `upsertUser()` server action

### Database Schema (db/schema.ts)

The schema uses Drizzle ORM with four main tables:

1. **users** - Synced from Stack Auth (id, email, name, avatar)
2. **agencyConfigs** - One per user (configuration, theming, slug for public URL)
3. **submissions** - Client onboarding responses (linked to agency user)
4. **answers** - Individual question-answer pairs (linked to submission)

Key relationships:
- `users` → `agencyConfigs` (one-to-one via userId)
- `users` → `submissions` (one-to-many)
- `submissions` → `answers` (one-to-many)

### Server Actions Pattern (app/actions.ts)

All database operations use Next.js Server Actions (`'use server'` directive):
- `upsertUser()` - Create or update user from Stack Auth data
- `getAgencyConfig()` - Fetch config by userId
- `getAgencyConfigBySlug()` - Fetch config by public slug
- `saveAgencyConfig()` - Create/update agency configuration
- `saveSubmission()` - Store completed onboarding session
- `getSubmissions()` - Retrieve all submissions for a user
- `clearSubmissions()` - Delete all submissions for testing

### AI Question Generation (services/geminiService.ts)

**Function:** `generateNextQuestion(config, history)`

Uses Google Gemini with structured output (JSON schema) to generate contextual questions:
- Takes agency config + conversation history as input
- Returns QuestionData object (text, type, options, progressEstimation, isComplete, summary)
- Follows a structured framework: Business Basics → Value Prop → Audience → Metrics → Assets
- Enforces completion at `maxQuestions - 1` limit
- Temperature: 0.5 for balanced creativity/consistency

**API Key:** Reads from `process.env.NEXT_PUBLIC_API_KEY`

### View Modes & Routing

The app has three distinct modes controlled by view state and URL routing:

1. **Admin Dashboard** (default, `/`)
   - Configure agency settings, view submissions, start preview mode
   - Requires authentication (Stack Auth)

2. **Preview Mode** (`/#preview` or view state)
   - Test onboarding flow as agency admin
   - Shows AI summary at completion
   - "Back to Dashboard" button

3. **Client Mode** (`/onboard/[slug]`)
   - Public URL for actual client submissions
   - No authentication required
   - Automatically saves to database on completion

### Theming System

Each agency config includes a theme object:
```typescript
theme: {
  primaryColor: string,     // Used for buttons, progress bar, accents
  backgroundColor: string,   // Page background
  textColor: string         // Main text color
}
```

These are applied via inline styles in OnboardingFlow component for per-agency customization.

### Type System (types.ts)

Core types to understand:
- `InputType` - Enum for form field types (TEXT, TEXTAREA, NUMBER, DATE, SELECT, MULTI_SELECT, BOOLEAN)
- `AgencyConfig` - Agency settings including theme and onboarding parameters
- `QuestionData` - AI-generated question with metadata
- `Answer` - User's response to a question
- `Submission` - Complete onboarding session with all answers and summary
- `SessionState` - React state for OnboardingFlow component

## Database Migrations

Uses Drizzle Kit for migrations:

```bash
# After modifying db/schema.ts, push changes to Neon database
bun run db:push

# View and edit data with Drizzle Studio
bun run db:studio
```

Schema file: `db/schema.ts`
Migration output: `db/migrations/`
Config: `drizzle.config.ts`

## Component Architecture Notes

### AdminDashboard.tsx
- Single-page dashboard with tabs: "Setup" and "Submissions"
- Setup tab: Form to configure agency details and theming
- Submissions tab: List of client responses with AI summaries
- Generates shareable URL from agency slug

### OnboardingFlow.tsx
- State-driven conversational UI with Motion animations
- Manages session state (answers, current question, loading, completion)
- Calls `generateNextQuestion()` after each answer submission
- Auto-saves to database on completion in client mode
- Shows progress bar based on AI's progressEstimation

### FormInput.tsx
- Dynamic input renderer based on InputType
- Handles all input types with appropriate UI components
- Auto-focus and keyboard shortcuts (Enter to submit)
- Integrated validation

## Path Aliases

TypeScript path alias configured in tsconfig.json:
```typescript
"@/*": ["./*"]
```

Use `@/` for all imports from project root (e.g., `@/components/FormInput`, `@/db`, `@/types`)

## Common Patterns

**Reading from database:**
```typescript
import { db, tableName } from '@/db';
import { eq } from 'drizzle-orm';

const results = await db.select().from(tableName).where(eq(tableName.column, value));
```

**Calling server actions from client:**
```typescript
import { serverActionName } from '@/app/actions';

const result = await serverActionName(params);
```

**Accessing authenticated user:**
```typescript
import { useUser } from '@stackframe/stack';

const user = useUser(); // Returns user object or null
```

## Development Notes

- The project uses React 19 and Next.js 16 (latest versions as of project creation)
- All client components must have `'use client'` directive
- Server actions must have `'use server'` directive
- Animations use Motion library (modern Framer Motion)
- UI components from Radix UI are in `components/ui/` directory
- Database client is configured in `db/index.ts` with Neon serverless driver
