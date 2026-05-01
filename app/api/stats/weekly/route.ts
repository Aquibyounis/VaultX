import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSession, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (isErrorResponse(session)) return session;

  try {
    const now = new Date();
    const thisWeek = getWeekBounds(now);
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = getWeekBounds(lastWeekDate);

    // Current week daily breakdown
    const thisWeekResult = await sql`
      SELECT EXTRACT(DOW FROM date) as dow,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
      FROM invoices
      WHERE date >= ${thisWeek.start}::timestamp AND date <= ${thisWeek.end}::timestamp
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY dow
    `;

    // Last week daily breakdown
    const lastWeekResult = await sql`
      SELECT EXTRACT(DOW FROM date) as dow,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM invoices
      WHERE date >= ${lastWeek.start}::timestamp AND date <= ${lastWeek.end}::timestamp
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY dow
    `;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Reorder to Mon-Sun
    const orderedDays = [1, 2, 3, 4, 5, 6, 0];

    const weeklyData = orderedDays.map((dow) => {
      const thisFound = thisWeekResult.find((r: Record<string, string>) => parseInt(r.dow) === dow);
      const lastFound = lastWeekResult.find((r: Record<string, string>) => parseInt(r.dow) === dow);
      return {
        day: dayNames[dow],
        expense: thisFound ? parseFloat(thisFound.expense) : 0,
        income: thisFound ? parseFloat(thisFound.income) : 0,
        lastWeek: lastFound ? parseFloat(lastFound.expense) : 0,
      };
    });

    // Top 3 categories this week
    const topCategoriesResult = await sql`
      SELECT c.name, c.icon, c.color, SUM(i.amount) as total
      FROM invoices i
      JOIN categories c ON i.category_id = c.id
      WHERE i.type = 'expense' 
        AND i.date >= ${thisWeek.start}::timestamp 
        AND i.date <= ${thisWeek.end}::timestamp
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC
      LIMIT 3
    `;

    return NextResponse.json({
      weeklyData,
      topCategories: topCategoriesResult.map((c: Record<string, string>) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        total: parseFloat(c.total),
      })),
    });
  } catch (error) {
    console.error('Weekly stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly stats' }, { status: 500 });
  }
}
