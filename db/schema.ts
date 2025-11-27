import { pgTable, text, serial, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
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
