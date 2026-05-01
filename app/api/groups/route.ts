import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession, requireEditor, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  try {
    // Get all groups and compute total spent/income
    const groups = await sql`
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

    return NextResponse.json(groups.map((g: any) => ({
      ...g,
      total_expense: parseFloat(g.total_expense),
      total_income: parseFloat(g.total_income),
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
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO groups (name)
      VALUES (${name.trim()})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Create group error:', error);
    if (error.message?.includes('unique constraint')) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
