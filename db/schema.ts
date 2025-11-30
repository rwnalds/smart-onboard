import { relations } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (synced with Neon Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization settings table - One per user
export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name').notNull(),
  industry: text('industry'),
  description: text('description'),
  targetAudience: text('target_audience'),
  onboardingGoal: text('onboarding_goal'),
  tone: text('tone').default('Professional & Friendly'),
  maxQuestions: integer('max_questions').default(10),
  customInstructions: text('custom_instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('organization_settings_user_id_idx').on(table.userId),
}));

// ============================================
// CLIENT-CENTRIC SCHEMA
// ============================================

// Clients table - Central entity for all client data
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // From Google Meet captions
  normalizedName: text('normalized_name').notNull(), // Lowercase, trimmed for matching
  email: text('email'),
  company: text('company'),
  role: text('role'),
  phone: text('phone'),
  linkedinUrl: text('linkedin_url'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastContactedAt: timestamp('last_contacted_at'),
}, (table) => ({
  userIdIdx: index('clients_user_id_idx').on(table.userId),
  normalizedNameIdx: index('clients_normalized_name_idx').on(table.normalizedName),
  createdAtIdx: index('clients_created_at_idx').on(table.createdAt),
}));

// Call sessions table - Linked to clients
export const callSessions = pgTable('call_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }), // Link to client
  clientName: text('client_name'), // Store raw name from captions
  meetingUrl: text('meeting_url'),
  status: text('status').notNull().default('active'), // 'active', 'completed', 'paused'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // seconds
  summary: text('summary'), // AI-generated post-call summary
  keyTakeaways: jsonb('key_takeaways').$type<string[]>(),
  actionItems: jsonb('action_items').$type<string[]>(),
  sentiment: text('sentiment'), // 'positive', 'neutral', 'negative'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('call_sessions_user_id_idx').on(table.userId),
  clientIdIdx: index('call_sessions_client_id_idx').on(table.clientId),
  statusIdx: index('call_sessions_status_idx').on(table.status),
  startedAtIdx: index('call_sessions_started_at_idx').on(table.startedAt),
}));

// Transcript segments table - Stores conversation data for RAG
export const transcriptSegments = pgTable('transcript_segments', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }), // Denormalized for faster queries
  speaker: text('speaker').notNull(), // 'agent', 'client', 'unknown'
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  // Vector embedding for semantic search (optional, can add later)
  // embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  callSessionIdIdx: index('transcript_segments_call_session_id_idx').on(table.callSessionId),
  clientIdIdx: index('transcript_segments_client_id_idx').on(table.clientId),
  timestampIdx: index('transcript_segments_timestamp_idx').on(table.timestamp),
  speakerIdx: index('transcript_segments_speaker_idx').on(table.speaker),
}));

// Client insights table - Extracted structured information about clients
export const clientInsights = pgTable('client_insights', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'business_info', 'goals', 'budget', 'pain_points', 'tech_stack'
  key: text('key').notNull(), // e.g., 'monthly_revenue', 'target_audience', 'current_mrr'
  value: text('value').notNull(),
  confidence: real('confidence').notNull().default(1.0),
  sourceSessionId: text('source_session_id').references(() => callSessions.id),
  sourceTranscriptId: integer('source_transcript_id').references(() => transcriptSegments.id),
  extractedAt: timestamp('extracted_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdIdx: index('client_insights_client_id_idx').on(table.clientId),
  categoryIdx: index('client_insights_category_idx').on(table.category),
  keyIdx: index('client_insights_key_idx').on(table.key),
}));

// Checklist items table (templates per user)
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description'),
  category: text('category'), // 'business_basics', 'goals', 'budget', 'technical'
  order: integer('order').notNull(),
  required: boolean('required').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('checklist_items_user_id_idx').on(table.userId),
}));

// Checklist completions table (per call session)
export const checklistCompletions = pgTable('checklist_completions', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  checklistItemId: integer('checklist_item_id').notNull().references(() => checklistItems.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at').notNull(),
  extractedInfo: text('extracted_info'),
  transcriptSegmentId: integer('transcript_segment_id').references(() => transcriptSegments.id),
  manuallyMarked: boolean('manually_marked').default(false).notNull(),
}, (table) => ({
  callSessionIdIdx: index('checklist_completions_call_session_id_idx').on(table.callSessionId),
  clientIdIdx: index('checklist_completions_client_id_idx').on(table.clientId),
}));

// Question prompts table (AI suggestions during call)
export const questionPrompts = pgTable('question_prompts', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  category: text('category'),
  suggested: boolean('suggested').default(true).notNull(),
  usedByAgent: boolean('used_by_agent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  callSessionIdIdx: index('question_prompts_call_session_id_idx').on(table.callSessionId),
}));

// Chat messages table - For RAG-powered client chat
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  context: jsonb('context').$type<{ sessionIds?: string[], transcriptIds?: number[] }>(), // Which transcripts were used
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  clientIdIdx: index('chat_messages_client_id_idx').on(table.clientId),
  createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  organizationSettings: one(organizationSettings),
  clients: many(clients),
  callSessions: many(callSessions),
  checklistItems: many(checklistItems),
  chatMessages: many(chatMessages),
}));

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  user: one(users, {
    fields: [organizationSettings.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  callSessions: many(callSessions),
  transcriptSegments: many(transcriptSegments),
  insights: many(clientInsights),
  checklistCompletions: many(checklistCompletions),
  chatMessages: many(chatMessages),
}));

export const callSessionsRelations = relations(callSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [callSessions.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [callSessions.clientId],
    references: [clients.id],
  }),
  transcriptSegments: many(transcriptSegments),
  checklistCompletions: many(checklistCompletions),
  questionPrompts: many(questionPrompts),
}));

export const transcriptSegmentsRelations = relations(transcriptSegments, ({ one }) => ({
  callSession: one(callSessions, {
    fields: [transcriptSegments.callSessionId],
    references: [callSessions.id],
  }),
  client: one(clients, {
    fields: [transcriptSegments.clientId],
    references: [clients.id],
  }),
}));

export const clientInsightsRelations = relations(clientInsights, ({ one }) => ({
  client: one(clients, {
    fields: [clientInsights.clientId],
    references: [clients.id],
  }),
  sourceSession: one(callSessions, {
    fields: [clientInsights.sourceSessionId],
    references: [callSessions.id],
  }),
  sourceTranscript: one(transcriptSegments, {
    fields: [clientInsights.sourceTranscriptId],
    references: [transcriptSegments.id],
  }),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  user: one(users, {
    fields: [checklistItems.userId],
    references: [users.id],
  }),
  completions: many(checklistCompletions),
}));

export const checklistCompletionsRelations = relations(checklistCompletions, ({ one }) => ({
  callSession: one(callSessions, {
    fields: [checklistCompletions.callSessionId],
    references: [callSessions.id],
  }),
  client: one(clients, {
    fields: [checklistCompletions.clientId],
    references: [clients.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [checklistCompletions.checklistItemId],
    references: [checklistItems.id],
  }),
  transcriptSegment: one(transcriptSegments, {
    fields: [checklistCompletions.transcriptSegmentId],
    references: [transcriptSegments.id],
  }),
}));

export const questionPromptsRelations = relations(questionPrompts, ({ one }) => ({
  callSession: one(callSessions, {
    fields: [questionPrompts.callSessionId],
    references: [callSessions.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [chatMessages.clientId],
    references: [clients.id],
  }),
}));
