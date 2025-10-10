import { provinces, publishers } from "./schema";
import { db } from ".";
import publisherData, { provinceData } from "./data";


const provinceRecords: Record<string, any> = {};

async function seedProvinces() {
  for (const p of provinceData) {
    const [record] = await db
      .insert(provinces)
      .values(p)
      .onConflictDoUpdate({
        target: provinces.name,
        set: {
          code: p.code,
          description: p.description,
        },
      })
      .returning();
    provinceRecords[p.name] = record;
  }
}

async function seedPublishers() {
  for (const pub of publisherData) {
    const province = provinceRecords[pub.province];
    const provinceId = province?.id ?? null; // handle "National" as null
    await db
      .insert(publishers)
      .values({
        name: pub.name,
        website: pub.website,
        province_id: provinceId,
      })
      .onConflictDoNothing();
  }
}

async function seed() {
  await seedProvinces();
  await seedPublishers();
  console.log("✅ Seed completed successfully!");
}

seed().catch(console.error);
