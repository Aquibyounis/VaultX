require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Inserting dummy invoice...');
  await sql`INSERT INTO invoices (title, amount, type, date) VALUES ('Test Dashboard', 1000, 'expense', NOW())`;

  console.log('Fetching stats...');
  
  // daily
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
  const dailyResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM invoices 
    WHERE type = 'expense' AND date >= ${startOfDay}::timestamp AND date <= ${endOfDay}::timestamp
  `;
  const totalSpent = parseFloat(dailyResult[0].total);

  // monthly
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const monthlyDailyResult = await sql`
    SELECT EXTRACT(DAY FROM date) as day,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
    FROM invoices
    WHERE date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
    GROUP BY EXTRACT(DAY FROM date)
  `;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const found = monthlyDailyResult.find(r => parseInt(r.day) === day);
    return { day: day.toString(), expense: found ? parseFloat(found.expense) : 0, income: found ? parseFloat(found.income) : 0 };
  });

  const totalsResult = await sql`
    SELECT COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
    FROM invoices WHERE date >= ${startOfMonth}::timestamp AND date <= ${endOfMonth}::timestamp
  `;
  const totalExpense = parseFloat(totalsResult[0].total_expense);

  // invoices
  const invoices = await sql`SELECT * FROM invoices ORDER BY date DESC LIMIT 5`;

  console.log('Dashboard mapped data:');
  console.log({
    todaySpend: totalSpent || 0,
    monthSpend: totalExpense || 0,
    recentInvoices: invoices,
    dailyDataPointsWithExpense: dailyData.filter(d => d.expense > 0)
  });

}

run().catch(console.error);
