import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: './.env' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL in env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    // Determine target schema from DATABASE_URL query param (e.g. ?schema=budgetwise_app)
    let schemaName = 'public';
    try {
      const url = new URL(connectionString);
      const schemaParam = url.searchParams.get('schema');
      if (schemaParam) schemaName = schemaParam;
    } catch (e) {
      // fall back to public
    }

    const tables = await pool.query(
      'SELECT tablename FROM pg_tables WHERE schemaname = $1',
      [schemaName],
    );
    console.log(`Tables in schema '${schemaName}':`, tables.rows.map((r) => r.tablename));

    // Directly query the Prisma-created User table (capitalized) using proper quoting
    try {
      const qualified = `"${schemaName}"."User"`;
      const res = await pool.query(`SELECT id, email, name FROM ${qualified} ORDER BY id LIMIT 1`);
      console.log('User row:', JSON.stringify(res.rows[0] || null, null, 2));
    } catch (e) {
      console.error(`Failed querying ${schemaName}.User table:`, e && e.stack ? e.stack : e);
    }
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
