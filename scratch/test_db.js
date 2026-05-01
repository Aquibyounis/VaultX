require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Account table:');
  const account = await sql`SELECT * FROM account`;
  console.log(account);

  console.log('Invoices table:');
  const invoices = await sql`SELECT * FROM invoices ORDER BY id DESC LIMIT 5`;
  console.log(invoices);
}

run().catch(console.error);
