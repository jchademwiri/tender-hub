const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
require('dotenv').config();

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

async function checkAndCreateProvinces() {
  try {
    console.log('Checking provinces...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle({ client: sql });

    // Check existing provinces
    const existingProvinces = await sql`SELECT * FROM provinces`;
    console.log('Existing provinces:', existingProvinces.length);

    if (existingProvinces.length === 0) {
      console.log('No provinces found. Creating provinces...');

      // Create provinces
      for (const provinceName of provinces) {
        const provinceCode = provinceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
        await sql`INSERT INTO provinces (name, code) VALUES (${provinceName}, ${provinceCode})`;
        console.log(`Created province: ${provinceName}`);
      }

      console.log('All provinces created successfully!');
    } else {
      console.log('Provinces already exist:');
      existingProvinces.forEach(p => {
        console.log(`  - ${p.name} (${p.code})`);
      });
    }

  } catch (error) {
    console.error('Error managing provinces:', error.message);
    console.error('Full error:', error);
  }
}

checkAndCreateProvinces();