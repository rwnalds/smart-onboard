'use server';

import { db, users } from '@/db';
import { AgencyConfig as AgencyConfigType, Answer, Submission } from '@/types';

// NOTE: This file contains legacy code for the old onboarding system.
// The new client-centric system uses the /api/clients endpoints instead.
// These functions are kept for backward compatibility but may be deprecated.

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

// Agency config operations (DEPRECATED - use /api/clients instead)
export async function getAgencyConfig(userId: string) {
  throw new Error('This function is deprecated. Use the new client-centric API at /api/clients');
}

export async function getAgencyConfigBySlug(slug: string) {
  throw new Error('This function is deprecated. Use the new client-centric API at /api/clients');
}

export async function saveAgencyConfig(
  userId: string,
  config: AgencyConfigType
) {
  throw new Error('This function is deprecated. Use the new client-centric API at /api/clients');
}

// Submission operations (DEPRECATED - use /api/clients instead)
export async function saveSubmission(
  userId: string,
  answersData: Answer[],
  summary: string
): Promise<Submission> {
  throw new Error('This function is deprecated. Use the new client-centric API at /api/clients');
}

export async function getSubmissions(userId: string): Promise<Submission[]> {
  throw new Error('This function is deprecated. Use the new client-centric API at /api/clients');
}

export async function clearSubmissions(userId: string) {
  throw new Error('This function is deprecated. Use the new client-centric API at /api/clients');
}
