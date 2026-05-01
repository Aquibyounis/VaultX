require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`INSERT INTO invoices (title, amount, type, date) VALUES ('Test', 1500, 'expense', NOW())`;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

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
    const found = dailyResult.find(r => parseInt(r.day) === day);
    return {
      day: day.toString(),
      expense: found ? parseFloat(found.expense) : 0,
      income: found ? parseFloat(found.income) : 0,
    };
  });

  console.log('Daily Data sample (first 5 days):', dailyData.slice(0, 5));
  console.log('Daily Result from SQL:', dailyResult);
}

run().catch(console.error);
