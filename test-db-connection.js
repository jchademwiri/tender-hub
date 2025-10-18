require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./src/db/schema');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle({ client: sql, schema });

    // Try to query users table first (simpler query)
    const users = await db.select().from(schema.user).limit(1);
    console.log('Successfully connected to database!');
    console.log('Found users:', users.length);

    // Try to query the invitations table (if users exist, try simpler query)
    if (users.length > 0) {
      console.log('Sample user:', users[0]);
    }

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();