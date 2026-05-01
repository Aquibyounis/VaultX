require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  console.log('startOfMonth', startOfMonth);
  console.log('endOfMonth', endOfMonth);

  const totalsResult = await sql`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
    FROM invoices
    WHERE date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
  `;
  
  console.log('totalsResult', totalsResult);

  const allInvoices = await sql`SELECT * FROM invoices`;
  console.log('all invoices', allInvoices);
}

run().catch(console.error);
