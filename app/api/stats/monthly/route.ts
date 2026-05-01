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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    console.log('[MONTHLY STATS] startOfMonth:', startOfMonth, 'endOfMonth:', endOfMonth);

    // Current month daily breakdown
    const dailyResult = await sql`
      SELECT EXTRACT(DAY FROM date) as day,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
      FROM invoices
      WHERE date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
      GROUP BY EXTRACT(DAY FROM date)
      ORDER BY day
    `;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const found = dailyResult.find((r: Record<string, string>) => parseInt(r.day) === day);
      return {
        day: day.toString(),
        expense: found ? parseFloat(found.expense) : 0,
        income: found ? parseFloat(found.income) : 0,
      };
    });

    // Last 6 months comparison
    const monthlyResult = await sql`
      SELECT TO_CHAR(date, 'YYYY-MM') as month,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
      FROM invoices
      WHERE date >= (NOW() - INTERVAL '6 months')
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthlyResult.map((m: Record<string, string>) => {
      const monthIndex = parseInt(m.month.split('-')[1]) - 1;
      return {
        month: monthNames[monthIndex],
        expense: parseFloat(m.expense),
        income: parseFloat(m.income),
      };
    });

    // Category pie data for current month
    const categoryResult = await sql`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(i.amount), 0) as total
      FROM invoices i
      JOIN categories c ON i.category_id = c.id
      WHERE i.type = 'expense'
        AND i.date >= ${startOfMonth}::timestamp AND i.date <= ${endOfMonth}::timestamp
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC
    `;

    // Biggest expense this month
    const biggestResult = await sql`
      SELECT title, amount, date
      FROM invoices
      WHERE type = 'expense' AND date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
      ORDER BY amount DESC
      LIMIT 1
    `;

    // Total income/expense this month
    const totalsResult = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
      FROM invoices
      WHERE date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
    `;

    return NextResponse.json({
      dailyData,
      monthlyData,
      categoryData: categoryResult.map((c: Record<string, string>) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        value: parseFloat(c.total),
      })),
      biggestExpense: biggestResult.length > 0
        ? { title: biggestResult[0].title, amount: parseFloat(biggestResult[0].amount), date: biggestResult[0].date }
        : null,
      totalExpense: parseFloat(totalsResult[0].total_expense),
      totalIncome: parseFloat(totalsResult[0].total_income),
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly stats' }, { status: 500 });
  }
}
