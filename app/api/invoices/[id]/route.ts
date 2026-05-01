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

    // Get invoice details before deleting
    const invoiceResult = await sql`
      SELECT id, amount, type, category_id FROM invoices WHERE id = ${id}
    `;

    if (invoiceResult.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceResult[0];
    const amount = parseFloat(invoice.amount);

    // Reverse balance change
    if (invoice.type === 'expense') {
      await sql`UPDATE account SET balance = balance + ${amount}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
    } else {
      await sql`UPDATE account SET balance = balance - ${amount}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
    }

    // Reverse category total_spent
    if (invoice.category_id && invoice.type === 'expense') {
      await sql`
        UPDATE categories 
        SET total_spent = GREATEST(0, total_spent - ${amount}) 
        WHERE id = ${invoice.category_id}
      `;
    }

    // Delete invoice
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Invoice delete error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
