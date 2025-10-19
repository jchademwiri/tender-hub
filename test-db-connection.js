require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { sql } = require('drizzle-orm');
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

    // Check if invitation table exists
    try {
      // Try a simple query first
      const result = await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invitation')`);
      console.log('Invitation table exists:', result.rows[0].exists);

      if (result.rows[0].exists) {
        // If table exists, try to query it
        const invitations = await db.select({
          id: schema.invitation.id,
          email: schema.invitation.email,
          role: schema.invitation.role,
          status: schema.invitation.status,
        }).from(schema.invitation).limit(1);
        console.log('Found invitations:', invitations.length);
        if (invitations.length > 0) {
          console.log('Sample invitation:', invitations[0]);
        }
      } else {
        console.log('Invitation table does not exist - needs to be created via migrations');
      }
    } catch (error) {
      console.error('Error checking invitations table:', error.message);
    }

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();