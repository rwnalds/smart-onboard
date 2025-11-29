import { pgTable, text, serial, integer, timestamp, jsonb, index, uniqueIndex, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synced with Neon Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agency configurations table
export const agencyConfigs = pgTable('agency_configs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  description: text('description').notNull(),
  onboardingGoal: text('onboarding_goal').notNull(),
  tone: text('tone').notNull(),
  targetAudience: text('target_audience').notNull(),
  maxQuestions: integer('max_questions').notNull().default(8),
  primaryColor: text('primary_color').notNull().default('#4f46e5'),
  backgroundColor: text('background_color').notNull().default('#ffffff'),
  textColor: text('text_color').notNull().default('#111827'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('agency_configs_user_id_idx').on(table.userId),
  slugIdx: uniqueIndex('agency_configs_slug_idx').on(table.slug),
}));

// Submissions table (stores client onboarding responses)
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientName: text('client_name'),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('submissions_user_id_idx').on(table.userId),
  createdAtIdx: index('submissions_created_at_idx').on(table.createdAt),
}));

// Answers table (stores individual question-answer pairs)
export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  questionText: text('question_text').notNull(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  submissionIdIdx: index('answers_submission_id_idx').on(table.submissionId),
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  submissions: many(submissions),
  agencyConfig: one(agencyConfigs, {
    fields: [users.id],
    references: [agencyConfigs.userId],
  }),
}));

export const agencyConfigsRelations = relations(agencyConfigs, ({ one }) => ({
  user: one(users, {
    fields: [agencyConfigs.userId],
    references: [users.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  submission: one(submissions, {
    fields: [answers.submissionId],
    references: [submissions.id],
  }),
}));

// Call sessions table (for live call transcription)
export const callSessions = pgTable('call_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agencyConfigId: integer('agency_config_id').references(() => agencyConfigs.id, { onDelete: 'set null' }),
  clientName: text('client_name'),
  clientEmail: text('client_email'),
  meetingUrl: text('meeting_url'),
  status: text('status').notNull().default('active'), // 'active', 'completed', 'paused'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // seconds
  summary: text('summary'), // AI-generated post-call summary
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('call_sessions_user_id_idx').on(table.userId),
  statusIdx: index('call_sessions_status_idx').on(table.status),
  startedAtIdx: index('call_sessions_started_at_idx').on(table.startedAt),
}));

// Transcript segments table
export const transcriptSegments = pgTable('transcript_segments', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  speaker: text('speaker').notNull(), // 'agent', 'client', 'unknown'
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'), // Whisper confidence score
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  callSessionIdIdx: index('transcript_segments_call_session_id_idx').on(table.callSessionId),
  timestampIdx: index('transcript_segments_timestamp_idx').on(table.timestamp),
}));

// Checklist items table (templates per agency)
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  agencyConfigId: integer('agency_config_id').notNull().references(() => agencyConfigs.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description'),
  category: text('category'), // 'business_basics', 'goals', 'budget', 'technical'
  order: integer('order').notNull(),
  required: boolean('required').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  agencyConfigIdIdx: index('checklist_items_agency_config_id_idx').on(table.agencyConfigId),
}));

// Checklist completions table (per call session)
export const checklistCompletions = pgTable('checklist_completions', {
  id: serial('id').primaryKey(),
  callSessionId: text('call_session_id').notNull().references(() => callSessions.id, { onDelete: 'cascade' }),
  checklistItemId: integer('checklist_item_id').notNull().references(() => checklistItems.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at').notNull(),
  extractedInfo: text('extracted_info'), // What the client said
  transcriptSegmentId: integer('transcript_segment_id').references(() => transcriptSegments.id),
  manuallyMarked: boolean('manually_marked').default(false).notNull(),
}, (table) => ({
  callSessionIdIdx: index('checklist_completions_call_session_id_idx').on(table.callSessionId),
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

// Relations for new tables
export const callSessionsRelations = relations(callSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [callSessions.userId],
    references: [users.id],
  }),
  agencyConfig: one(agencyConfigs, {
    fields: [callSessions.agencyConfigId],
    references: [agencyConfigs.id],
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
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  agencyConfig: one(agencyConfigs, {
    fields: [checklistItems.agencyConfigId],
    references: [agencyConfigs.id],
  }),
  completions: many(checklistCompletions),
}));

export const checklistCompletionsRelations = relations(checklistCompletions, ({ one }) => ({
  callSession: one(callSessions, {
    fields: [checklistCompletions.callSessionId],
    references: [callSessions.id],
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
