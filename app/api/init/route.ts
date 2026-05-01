import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS account (
        id SERIAL PRIMARY KEY,
        balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        currency TEXT DEFAULT '₹',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT,
        color TEXT,
        total_spent NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        type TEXT CHECK(type IN ('expense','income')) DEFAULT 'expense',
        note TEXT,
        date TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add group_id column to existing invoices table if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='invoices' AND column_name='group_id'
        ) THEN
          ALTER TABLE invoices ADD COLUMN group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    // Insert default account if none exists
    const existing = await sql`SELECT id FROM account LIMIT 1`;
    if (existing.length === 0) {
      await sql`INSERT INTO account (balance) VALUES (0)`;
    }

    // Insert default categories
    const cats = await sql`SELECT id FROM categories LIMIT 1`;
    if (cats.length === 0) {
      await sql`INSERT INTO categories (name, icon, color) VALUES 
        ('Food', '🍔', '#f97316'),
        ('Transport', '🚗', '#3b82f6'),
        ('Shopping', '🛍️', '#a855f7'),
        ('Bills', '📄', '#eab308'),
        ('Entertainment', '🎮', '#ec4899'),
        ('Health', '💊', '#14b8a6'),
        ('Education', '📚', '#6366f1'),
        ('Other', '📦', '#6b7280')
        ON CONFLICT (name) DO NOTHING
      `;
    }

    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
