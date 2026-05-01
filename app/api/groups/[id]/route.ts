import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession, requireEditor, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const groups = await sql`
      SELECT 
        g.id, 
        g.name, 
        g.created_at,
        COALESCE(SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END), 0) as total_income
      FROM groups g
      LEFT JOIN invoices i ON i.group_id = g.id
      WHERE g.id = ${id}
      GROUP BY g.id, g.name, g.created_at
    `;

    if (groups.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const invoices = await sql`
      SELECT i.id, i.title, i.amount, i.category_id, i.type, i.note, i.date, i.group_id,
             c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM invoices i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.group_id = ${id}
      ORDER BY i.date DESC
    `;

    return NextResponse.json({
      ...groups[0],
      total_expense: parseFloat(groups[0].total_expense),
      total_income: parseFloat(groups[0].total_income),
      invoices: invoices.map((inv: any) => ({
        ...inv,
        amount: parseFloat(inv.amount),
      }))
    });
  } catch (error) {
    console.error('Fetch group details error:', error);
    return NextResponse.json({ error: 'Failed to fetch group details' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Note: Due to ON DELETE CASCADE on invoices.group_id, deleting the group 
    // will automatically delete all invoices within it as per user's request.
    // However, before we delete, we need to adjust the account balance!
    
    const invoices = await sql`SELECT amount, type FROM invoices WHERE group_id = ${id}`;
    let balanceAdjustment = 0;
    
    for (const inv of invoices) {
      const amount = parseFloat(inv.amount);
      if (inv.type === 'expense') {
        balanceAdjustment += amount; // We get money back from deleted expenses
      } else {
        balanceAdjustment -= amount; // We lose money from deleted incomes
      }
    }

    // Delete group (cascades to invoices)
    const result = await sql`DELETE FROM groups WHERE id = ${id} RETURNING id`;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Update account balance
    if (balanceAdjustment !== 0) {
      if (balanceAdjustment > 0) {
        await sql`UPDATE account SET balance = balance + ${balanceAdjustment}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
      } else {
        await sql`UPDATE account SET balance = balance - ${Math.abs(balanceAdjustment)}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
