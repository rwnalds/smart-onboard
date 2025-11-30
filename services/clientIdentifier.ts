import { db } from '@/db';
import { clients } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Normalize a client name for matching
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate similarity between two names using Levenshtein distance
 * Returns a score between 0 (completely different) and 1 (identical)
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const s1 = normalizeName(name1);
  const s2 = normalizeName(name2);
  
  if (s1 === s2) return 1.0;
  
  // Simple Levenshtein distance implementation
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLength);
}

export interface ClientIdentificationResult {
  clientId: string;
  isNewClient: boolean;
  confidence: number;
  matchedName?: string;
}

/**
 * Identify or create a client based on their name
 * Uses fuzzy matching to find existing clients
 */
export async function identifyOrCreateClient(
  name: string,
  userId: string,
  options: {
    email?: string;
    similarityThreshold?: number; // Default: 0.85
  } = {}
): Promise<ClientIdentificationResult> {
  const { email, similarityThreshold = 0.85 } = options;
  
  const normalizedName = normalizeName(name);
  
  // First, try exact match on normalized name
  const exactMatch = await db.query.clients.findFirst({
    where: and(
      eq(clients.userId, userId),
      eq(clients.normalizedName, normalizedName)
    ),
  });
  
  if (exactMatch) {
    return {
      clientId: exactMatch.id,
      isNewClient: false,
      confidence: 1.0,
      matchedName: exactMatch.name,
    };
  }
  
  // If email provided, try matching by email
  if (email) {
    const emailMatch = await db.query.clients.findFirst({
      where: and(
        eq(clients.userId, userId),
        eq(clients.email, email)
      ),
    });
    
    if (emailMatch) {
      // Update the name if it's different
      if (emailMatch.normalizedName !== normalizedName) {
        await db.update(clients)
          .set({ 
            name,
            normalizedName,
            updatedAt: new Date()
          })
          .where(eq(clients.id, emailMatch.id));
      }
      
      return {
        clientId: emailMatch.id,
        isNewClient: false,
        confidence: 1.0,
        matchedName: emailMatch.name,
      };
    }
  }
  
  // Try fuzzy matching on all clients for this user
  const userClients = await db.query.clients.findMany({
    where: eq(clients.userId, userId),
  });
  
  let bestMatch: typeof userClients[0] | null = null;
  let bestSimilarity = 0;
  
  for (const client of userClients) {
    const similarity = calculateNameSimilarity(name, client.name);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = client;
    }
  }
  
  // If we found a good match, return it
  if (bestMatch && bestSimilarity >= similarityThreshold) {
    return {
      clientId: bestMatch.id,
      isNewClient: false,
      confidence: bestSimilarity,
      matchedName: bestMatch.name,
    };
  }
  
  // No match found, create new client
  const newClientId = nanoid();
  
  await db.insert(clients).values({
    id: newClientId,
    userId,
    name,
    normalizedName,
    email: email || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastContactedAt: new Date(),
  });
  
  console.log('[ClientIdentifier] Created new client:', {
    id: newClientId,
    name,
    normalizedName,
  });
  
  return {
    clientId: newClientId,
    isNewClient: true,
    confidence: 1.0,
  };
}

/**
 * Update client's last contacted timestamp
 */
export async function updateClientLastContacted(clientId: string): Promise<void> {
  await db.update(clients)
    .set({ lastContactedAt: new Date() })
    .where(eq(clients.id, clientId));
}

/**
 * Link a call session to a client
 */
export async function linkSessionToClient(
  sessionId: string,
  clientId: string
): Promise<void> {
  const { callSessions } = await import('@/db/schema');
  
  await db.update(callSessions)
    .set({ 
      clientId,
      updatedAt: new Date()
    })
    .where(eq(callSessions.id, sessionId));
  
  console.log('[ClientIdentifier] Linked session to client:', {
    sessionId,
    clientId,
  });
}
