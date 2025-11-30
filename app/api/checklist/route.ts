import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checklistItems, organizationSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { corsResponse, handleCorsPreFlight } from '@/app/api/cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/checklist?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return corsResponse({ error: 'userId required' }, 400);
    }

    // Get checklist items for this user
    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.userId, userId))
      .orderBy(checklistItems.order);

    // If no items exist, create default ones
    if (items.length === 0) {
      const defaultItems = await createDefaultChecklistForUser(userId);
      return corsResponse(defaultItems);
    }

    return corsResponse(items);
  } catch (error) {
    console.error('Failed to fetch checklist:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// POST /api/checklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items: newItems } = body;

    if (!userId || !newItems) {
      return corsResponse({ error: 'userId and items required' }, 400);
    }

    // Insert new checklist items
    const createdItems = await db
      .insert(checklistItems)
      .values(
        newItems.map((item: any, index: number) => ({
          userId,
          label: item.label,
          description: item.description,
          category: item.category,
          order: item.order !== undefined ? item.order : index,
          required: item.required !== undefined ? item.required : true,
        }))
      )
      .returning();

    return corsResponse(createdItems, 201);
  } catch (error) {
    console.error('Failed to create checklist:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
}

// Default checklist based on user requirements
function getDefaultChecklist() {
  return [
    {
      id: 1,
      label: 'Current monthly revenue',
      description: 'Understand business size and scale',
      category: 'business_basics',
      order: 1,
      required: true,
    },
    {
      id: 2,
      label: 'Revenue projections for next 12 months',
      description: 'Growth trajectory and ambitions',
      category: 'business_basics',
      order: 2,
      required: true,
    },
    {
      id: 3,
      label: 'Current monthly marketing budget',
      description: 'Budget allocated for marketing/advertising',
      category: 'business_basics',
      order: 3,
      required: true,
    },
    {
      id: 4,
      label: 'Ideal solution description',
      description: 'What would the perfect outcome look like',
      category: 'goals',
      order: 4,
      required: true,
    },
    {
      id: 5,
      label: 'Current systems and tools',
      description: 'What tools/platforms they currently use',
      category: 'technical',
      order: 5,
      required: true,
    },
    {
      id: 6,
      label: 'Price sensitivity and budget flexibility',
      description: 'Understanding budget constraints for pricing',
      category: 'business_basics',
      order: 6,
      required: false,
    },
  ];
}

async function createDefaultChecklistForUser(userId: string) {
  // Try to get organization settings to customize checklist
  const [settings] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.userId, userId))
    .limit(1);

  let defaultItems = getDefaultChecklist();

  // If organization settings exist and have onboarding goals, customize the checklist
  if (settings?.onboardingGoal) {
    // Parse the onboarding goals to create custom checklist items
    const goals = settings.onboardingGoal.split(',').map(g => g.trim()).filter(Boolean);

    if (goals.length > 0) {
      defaultItems = goals.map((goal, index) => ({
        id: index + 1,
        label: goal,
        description: `Gather information about: ${goal}`,
        category: 'business_basics',
        order: index + 1,
        required: true,
      }));
    }
  }

  const created = await db
    .insert(checklistItems)
    .values(
      defaultItems.map((item) => ({
        userId,
        label: item.label,
        description: item.description,
        category: item.category,
        order: item.order,
        required: item.required,
      }))
    )
    .returning();

  return created;
}
