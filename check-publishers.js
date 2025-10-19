const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function checkPublishers() {
  try {
    console.log("Checking publishers...");
    const sql = neon(process.env.DATABASE_URL);

    // Check publishers and their province references
    const publishers = await sql`SELECT * FROM publishers`;
    console.log("Publishers found:", publishers.length);

    if (publishers.length > 0) {
      console.log("Publishers:");
      for (const publisher of publishers) {
        // Check if the province exists
        const province =
          await sql`SELECT * FROM provinces WHERE id = ${publisher.province_id}`;

        if (province.length === 0) {
          console.log(
            `❌ Publisher "${publisher.name}" has invalid province_id: ${publisher.province_id}`,
          );

          // Find a valid province to assign (let's use Gauteng as default)
          const validProvince =
            await sql`SELECT * FROM provinces WHERE code = 'GP' LIMIT 1`;

          if (validProvince.length > 0) {
            console.log(`🔧 Updating publisher to use Gauteng province...`);
            await sql`UPDATE publishers SET province_id = ${validProvince[0].id} WHERE id = ${publisher.id}`;
            console.log(`✅ Updated publisher "${publisher.name}"`);
          }
        } else {
          console.log(
            `✅ Publisher "${publisher.name}" -> Province: ${province[0].name}`,
          );
        }
      }
    } else {
      console.log("No publishers found.");
    }
  } catch (error) {
    console.error("Error checking publishers:", error.message);
    console.error("Full error:", error);
  }
}

checkPublishers();
