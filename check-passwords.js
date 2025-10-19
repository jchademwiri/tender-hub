require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkPasswords() {
  try {
    console.log('Checking password hashes...');
    const sql = neon(process.env.DATABASE_URL);

    // Check account entries with password hashes
    const accounts = await sql`SELECT user_id, provider_id, password FROM account WHERE provider_id = 'credential'`;
    console.log('Account entries with passwords:', accounts.length);

    // Get user details
    const users = await sql`SELECT id, email FROM "user"`;

    console.log('\nPassword hashes:');
    for (const account of accounts) {
      const user = users.find(u => u.id === account.user_id);
      if (user) {
        console.log(`  - ${user.email}:`);
        console.log(`    Password hash: ${account.password}`);
        console.log(`    Hash length: ${account.password.length}`);
        console.log(`    Hash prefix: ${account.password.substring(0, 20)}...`);
      }
    }

  } catch (error) {
    console.error('Error checking passwords:', error.message);
    console.error('Full error:', error);
  }
}

checkPasswords();