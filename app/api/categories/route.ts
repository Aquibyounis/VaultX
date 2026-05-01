import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession, requireEditor, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  try {
    const categories = await sql`
      SELECT id, name, icon, color, total_spent, created_at 
      FROM categories 
      ORDER BY name ASC
    `;
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  try {
    const { name, icon, color } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO categories (name, icon, color)
      VALUES (${name.trim()}, ${icon || '📦'}, ${color || '#6b7280'})
      RETURNING id, name, icon, color, total_spent, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as Record<string, unknown>).code === '23505') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('Category create error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
