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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('category_id');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let invoices;
    
    if (!type && !categoryId && !dateFrom && !dateTo) {
      invoices = await sql`
        SELECT i.id, i.title, i.amount, i.category_id, i.group_id, i.type, i.note, i.date,
               c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM invoices i
        LEFT JOIN categories c ON i.category_id = c.id
        ORDER BY i.date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type && !categoryId && !dateFrom && !dateTo) {
      invoices = await sql`
        SELECT i.id, i.title, i.amount, i.category_id, i.group_id, i.type, i.note, i.date,
               c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM invoices i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.type = ${type}
        ORDER BY i.date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (categoryId && !type && !dateFrom && !dateTo) {
      invoices = await sql`
        SELECT i.id, i.title, i.amount, i.category_id, i.group_id, i.type, i.note, i.date,
               c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM invoices i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.category_id = ${parseInt(categoryId)}
        ORDER BY i.date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Full filter with all possible combinations
      invoices = await sql`
        SELECT i.id, i.title, i.amount, i.category_id, i.group_id, i.type, i.note, i.date,
               c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM invoices i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE 
          (${type || null}::text IS NULL OR i.type = ${type || ''})
          AND (${categoryId ? parseInt(categoryId) : null}::int IS NULL OR i.category_id = ${categoryId ? parseInt(categoryId) : 0})
          AND (${dateFrom || null}::timestamp IS NULL OR i.date >= ${dateFrom || '1970-01-01'}::timestamp)
          AND (${dateTo || null}::timestamp IS NULL OR i.date <= ${dateTo || '2099-12-31'}::timestamp)
        ORDER BY i.date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get total count for pagination
    const countResult = await sql`SELECT COUNT(*) as total FROM invoices`;
    const total = parseInt(countResult[0].total);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = requireEditor(request);
  if (isErrorResponse(session)) return session;

  try {
    const { title, amount, category_id, group_id, type, note, date } = await request.json();

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const invoiceType = type || 'expense';
    const invoiceDate = date || new Date().toISOString();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create invoice
    const result = await sql`
      INSERT INTO invoices (title, amount, category_id, group_id, type, note, date)
      VALUES (${title}, ${parsedAmount}, ${category_id || null}, ${group_id || null}, ${invoiceType}, ${note || null}, ${invoiceDate}::timestamp)
      RETURNING id, title, amount, category_id, group_id, type, note, date
    `;

    // Update account balance
    if (invoiceType === 'expense') {
      await sql`UPDATE account SET balance = balance - ${parsedAmount}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
    } else {
      await sql`UPDATE account SET balance = balance + ${parsedAmount}, updated_at = NOW() WHERE id = (SELECT id FROM account LIMIT 1)`;
    }

    // Update category total_spent
    if (category_id && invoiceType === 'expense') {
      await sql`UPDATE categories SET total_spent = total_spent + ${parsedAmount} WHERE id = ${category_id}`;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Invoice create error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
