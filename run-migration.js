const { execSync } = require('child_process');

try {
  console.log('Running database migration...');
  execSync('pnpm db:push', {
    stdio: 'inherit',
    input: 'Yes\n'
  });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}