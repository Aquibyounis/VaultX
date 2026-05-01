import { neon } from '@neondatabase/serverless';

export function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// Tagged template sql function - lazy initialized
export const sql = (...args: [TemplateStringsArray, ...unknown[]]) => {
  return getSQL()(...args);
};
