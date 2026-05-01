import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireEditor, isErrorResponse } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check if category has invoices
    const invoices = await sql`SELECT COUNT(*) as count FROM invoices WHERE category_id = ${id}`;
    if (parseInt(invoices[0].count) > 0) {
      // Set category_id to null for existing invoices
      await sql`UPDATE invoices SET category_id = NULL WHERE category_id = ${id}`;
    }

    await sql`DELETE FROM categories WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Category delete error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
