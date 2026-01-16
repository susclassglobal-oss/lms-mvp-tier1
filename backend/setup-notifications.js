
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('Notification System Setup');
console.log('========================================\n');

const dbUrl = process.env.DATABASE_URL;
const useSSL = dbUrl?.includes('neon.tech') || 
               dbUrl?.includes('amazonaws.com') || 
               dbUrl?.includes('sslmode=require');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

async function setupNotifications() {
  try {
    console.log(' DATABASE_URL loaded from .env');
    console.log(' Connecting to database...\n');

    await pool.query('SELECT NOW()');
    console.log(' Database connection successful\n');

    const sqlFilePath = path.join(__dirname, 'notification-system.sql');
    console.log(` Reading SQL file: ${sqlFilePath}\n`);
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(' SQL file loaded\n');

    console.log('⏳ Executing SQL script...\n');
    console.log('-----------------------------------');

    const result = await pool.query(sql);
    
    console.log('-----------------------------------\n');
    console.log(' SQL executed successfully!\n');

    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'notification%' 
      ORDER BY table_name
    `);

    console.log(' Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`    ${row.table_name}`);
    });

    const eventsResult = await pool.query('SELECT COUNT(*) as count FROM notification_events');
    console.log(`\n Seeded ${eventsResult.rows[0].count} notification event types\n`);

    console.log('========================================');
    console.log(' NOTIFICATION SYSTEM SETUP COMPLETE');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('  1. Verify SMTP settings in .env');
    console.log('  2. Restart server: npm run dev');
    console.log('  3. Test notifications\n');

  } catch (error) {
    console.error('\n ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupNotifications();
