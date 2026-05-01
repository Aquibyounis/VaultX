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
    const result = await sql`SELECT id, balance, currency, updated_at FROM account LIMIT 1`;
    if (result.length === 0) {
      return NextResponse.json({ balance: 0, currency: '₹' });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  try {
    const { balance, currency } = await request.json();

    if (balance !== undefined) {
      await sql`UPDATE account SET balance = ${balance}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
    }
    if (currency !== undefined) {
      await sql`UPDATE account SET currency = ${currency}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
    }

    const result = await sql`SELECT id, balance, currency, updated_at FROM account LIMIT 1`;
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}
