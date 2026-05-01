import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    // Total spent today
    const totalResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM invoices 
      WHERE type = 'expense' AND date >= ${startOfDay}::timestamp AND date <= ${endOfDay}::timestamp
    `;

    // Transaction count today
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE date >= ${startOfDay}::timestamp AND date <= ${endOfDay}::timestamp
    `;

    // Biggest expense today
    const biggestResult = await sql`
      SELECT title, amount 
      FROM invoices 
      WHERE type = 'expense' AND date >= ${startOfDay}::timestamp AND date <= ${endOfDay}::timestamp
      ORDER BY amount DESC LIMIT 1
    `;

    // Hourly breakdown
    const hourlyResult = await sql`
      SELECT EXTRACT(HOUR FROM date) as hour, 
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
      FROM invoices 
      WHERE date >= ${startOfDay}::timestamp AND date <= ${endOfDay}::timestamp
      GROUP BY EXTRACT(HOUR FROM date)
      ORDER BY hour
    `;

    // Fill all 24 hours
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const found = hourlyResult.find((h: Record<string, string>) => parseInt(h.hour) === i);
      return {
        hour: `${i.toString().padStart(2, '0')}:00`,
        expense: found ? parseFloat(found.expense) : 0,
        income: found ? parseFloat(found.income) : 0,
      };
    });

    return NextResponse.json({
      totalSpent: parseFloat(totalResult[0].total),
      transactionCount: parseInt(countResult[0].count),
      biggestExpense: biggestResult.length > 0
        ? { title: biggestResult[0].title, amount: parseFloat(biggestResult[0].amount) }
        : null,
      hourlyData,
    });
  } catch (error) {
    console.error('Daily stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 });
  }
}
