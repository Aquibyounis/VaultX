import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession, requireEditor, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface GroupResult {
  id: number;
  name: string;
  created_at: string;
  total_expense: string | number;
  total_income: string | number;
}

export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  try {
    // Get all groups and compute total spent/income
    const groups = await sql<GroupResult[]>`
      SELECT 
        g.id, 
        g.name, 
        g.created_at,
        COALESCE(SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END), 0) as total_income
      FROM groups g
      LEFT JOIN invoices i ON i.group_id = g.id
      GROUP BY g.id, g.name, g.created_at
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json(groups.map((g) => ({
      ...g,
      total_expense: typeof g.total_expense === 'string' ? parseFloat(g.total_expense) : g.total_expense,
      total_income: typeof g.total_income === 'string' ? parseFloat(g.total_income) : g.total_income,
    })));
  } catch (error) {
    console.error('Fetch groups error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  try {
    const { name, created_at } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO groups (name, created_at)
      VALUES (${name.trim()}, ${created_at ? created_at : new Date().toISOString()}::timestamp)
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error('Create group error:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('unique constraint')) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
