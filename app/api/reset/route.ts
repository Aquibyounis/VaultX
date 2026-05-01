import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireEditor, isErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  try {
    // Truncate all data tables. CASCADE handles foreign keys.
    await sql`TRUNCATE TABLE invoices CASCADE`;
    await sql`TRUNCATE TABLE groups CASCADE`;
    
    // Reset categories spent amount
    await sql`UPDATE categories SET total_spent = 0`;
    
    // Reset account balance
    await sql`UPDATE account SET balance = 0, updated_at = NOW()`;

    return NextResponse.json({ success: true, message: 'All data reset' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
