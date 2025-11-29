import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checklistItems, agencyConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { corsResponse, handleCorsPreFlight } from '../cors';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/checklist?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const agencyConfigId = searchParams.get('agencyConfigId');

    if (!userId && !agencyConfigId) {
      return corsResponse({ error: 'userId or agencyConfigId required' }, 400);
    }

    let configId = agencyConfigId ? parseInt(agencyConfigId) : null;

    // If userId provided, get their agency config
    if (!configId && userId) {
      const [config] = await db
        .select()
        .from(agencyConfigs)
        .where(eq(agencyConfigs.userId, userId));

      if (!config) {
        // No config found, create default checklist
        return corsResponse(getDefaultChecklist());
      }

      configId = config.id;
    }

    if (!configId) {
      return corsResponse(getDefaultChecklist());
    }

    // Get checklist items for this agency config
    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.agencyConfigId, configId))
      .orderBy(checklistItems.order);

    // If no items exist, create default ones
    if (items.length === 0) {
      const defaultItems = await createDefaultChecklistForAgency(configId);
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
    const { agencyConfigId, items: newItems } = body;

    if (!agencyConfigId || !newItems) {
      return corsResponse({ error: 'agencyConfigId and items required' }, 400);
    }

    // Insert new checklist items
    const createdItems = await db
      .insert(checklistItems)
      .values(
        newItems.map((item: any, index: number) => ({
          agencyConfigId,
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

async function createDefaultChecklistForAgency(agencyConfigId: number) {
  const defaultItems = getDefaultChecklist();

  const created = await db
    .insert(checklistItems)
    .values(
      defaultItems.map((item) => ({
        agencyConfigId,
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
