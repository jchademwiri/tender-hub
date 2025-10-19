require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkAccounts() {
  try {
    console.log('Checking accounts table...');
    const sql = neon(process.env.DATABASE_URL);

    // Check account entries
    const accounts = await sql`SELECT user_id, provider_id, password FROM account`;
    console.log('Account entries found:', accounts.length);

    accounts.forEach(account => {
      console.log(`  - User ID: ${account.user_id}, Provider: ${account.provider_id}, Has Password: ${!!account.password}`);
    });

    // Check specific users
    const users = await sql`SELECT id, email FROM "user"`;
    console.log('\nChecking each user:');
    for (const user of users) {
      const userAccounts = accounts.filter(acc => acc.user_id === user.id);
      console.log(`  - ${user.email}: ${userAccounts.length} account(s)`);
    }

  } catch (error) {
    console.error('Error checking accounts:', error.message);
    console.error('Full error:', error);
  }
}

checkAccounts();