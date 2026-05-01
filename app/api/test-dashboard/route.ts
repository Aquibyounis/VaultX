import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const totalsResult = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
      FROM invoices
      WHERE date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
    `;

    const allInvoices = await sql`SELECT * FROM invoices ORDER BY date DESC LIMIT 10`;

    return NextResponse.json({
      startOfMonth,
      endOfMonth,
      totalsResult,
      allInvoices,
      total_expense: parseFloat(totalsResult[0].total_expense)
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
