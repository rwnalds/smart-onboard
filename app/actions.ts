'use server';

import { db, users, agencyConfigs, submissions, answers } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { Answer, Submission, AgencyConfig as AgencyConfigType } from '@/types';

// User operations
export async function upsertUser(userData: {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}) {
  const [user] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substring(2, 10);
}

// Agency config operations
export async function getAgencyConfig(userId: string) {
  const [config] = await db
    .select()
    .from(agencyConfigs)
    .where(eq(agencyConfigs.userId, userId))
    .limit(1);

  if (!config) return null;

  return {
    slug: config.slug,
    name: config.name,
    industry: config.industry,
    description: config.description,
    onboardingGoal: config.onboardingGoal,
    tone: config.tone,
    targetAudience: config.targetAudience,
    maxQuestions: config.maxQuestions,
    theme: {
      primaryColor: config.primaryColor,
      backgroundColor: config.backgroundColor,
      textColor: config.textColor,
    },
  };
}

export async function getAgencyConfigBySlug(slug: string) {
  const [config] = await db
    .select()
    .from(agencyConfigs)
    .where(eq(agencyConfigs.slug, slug))
    .limit(1);

  if (!config) return null;

  return {
    userId: config.userId,
    config: {
      slug: config.slug,
      name: config.name,
      industry: config.industry,
      description: config.description,
      onboardingGoal: config.onboardingGoal,
      tone: config.tone,
      targetAudience: config.targetAudience,
      maxQuestions: config.maxQuestions,
      theme: {
        primaryColor: config.primaryColor,
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
      },
    } as AgencyConfigType,
  };
}

export async function saveAgencyConfig(
  userId: string,
  config: AgencyConfigType
) {
  // Generate slug if not provided or if it's a new config
  const slug = config.slug || generateSlug(config.name);

  const [saved] = await db
    .insert(agencyConfigs)
    .values({
      userId,
      slug,
      name: config.name,
      industry: config.industry,
      description: config.description,
      onboardingGoal: config.onboardingGoal,
      tone: config.tone,
      targetAudience: config.targetAudience,
      maxQuestions: config.maxQuestions,
      primaryColor: config.theme.primaryColor,
      backgroundColor: config.theme.backgroundColor,
      textColor: config.theme.textColor,
    })
    .onConflictDoUpdate({
      target: agencyConfigs.userId,
      set: {
        name: config.name,
        industry: config.industry,
        description: config.description,
        onboardingGoal: config.onboardingGoal,
        tone: config.tone,
        targetAudience: config.targetAudience,
        maxQuestions: config.maxQuestions,
        primaryColor: config.theme.primaryColor,
        backgroundColor: config.theme.backgroundColor,
        textColor: config.theme.textColor,
        updatedAt: new Date(),
      },
    })
    .returning();

  return { ...saved, slug: saved.slug };
}

// Submission operations
export async function saveSubmission(
  userId: string,
  answersData: Answer[],
  summary: string
): Promise<Submission> {
  // Try to find a name in the answers to label the submission
  const nameAnswer = answersData.find(
    (a) =>
      a.questionText.toLowerCase().includes('name') ||
      a.questionText.toLowerCase().includes('who')
  );

  const submissionId = crypto.randomUUID();
  const submissionsCount = await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId));

  // Insert submission
  const [submission] = await db
    .insert(submissions)
    .values({
      id: submissionId,
      userId,
      clientName: nameAnswer
        ? String(nameAnswer.value)
        : `Client ${submissionsCount.length + 1}`,
      summary,
    })
    .returning();

  // Insert all answers
  if (answersData.length > 0) {
    await db.insert(answers).values(
      answersData.map((answer) => ({
        submissionId,
        questionId: answer.questionId,
        questionText: answer.questionText,
        value: answer.value,
      }))
    );
  }

  return {
    id: submission.id,
    timestamp: submission.createdAt.getTime(),
    answers: answersData,
    summary: submission.summary,
    clientName: submission.clientName || undefined,
  };
}

export async function getSubmissions(userId: string): Promise<Submission[]> {
  const submissionsData = await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt));

  const result: Submission[] = [];

  for (const submission of submissionsData) {
    const answersData = await db
      .select()
      .from(answers)
      .where(eq(answers.submissionId, submission.id));

    result.push({
      id: submission.id,
      timestamp: submission.createdAt.getTime(),
      answers: answersData.map((a) => ({
        questionId: a.questionId,
        questionText: a.questionText,
        value: a.value as string | string[] | number | boolean,
      })),
      summary: submission.summary,
      clientName: submission.clientName || undefined,
    });
  }

  return result;
}

export async function clearSubmissions(userId: string) {
  await db.delete(submissions).where(eq(submissions.userId, userId));
}
