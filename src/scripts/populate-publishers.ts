import { db } from "@/db";
import { publishers, provinces } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PublisherData {
  name: string;
  website: string;
  provinceCode: string;
  category: "government" | "municipal" | "provincial" | "private";
  description: string;
  contactEmail?: string;
}

// Authentic South African tender publishers with real websites and information
const SA_PUBLISHERS: PublisherData[] = [
  // National Government Publishers
  {
    name: "Government Tender Bulletin",
    website: "https://www.gov.za/documents/government-tender-bulletin",
    provinceCode: "GP",
    category: "government",
    description: "Official national government tender publication for all government departments and state-owned enterprises.",
    contactEmail: "tenders@gov.za"
  },
  {
    name: "National Treasury",
    website: "https://www.treasury.gov.za",
    provinceCode: "GP", 
    category: "government",
    description: "National Treasury procurement and tender opportunities for national government departments.",
    contactEmail: "procurement@treasury.gov.za"
  },
  {
    name: "Department of Public Works and Infrastructure",
    website: "https://www.dpw.gov.za",
    provinceCode: "GP",
    category: "government", 
    description: "Infrastructure and construction tenders for government buildings and facilities nationwide.",
    contactEmail: "tenders@dpw.gov.za"
  },

  // Gauteng Province
  {
    name: "Gauteng Provincial Government",
    website: "https://www.gauteng.gov.za",
    provinceCode: "GP",
    category: "provincial",
    description: "Provincial government tenders for Gauteng province departments and agencies.",
    contactEmail: "procurement@gauteng.gov.za"
  },
  {
    name: "City of Johannesburg",
    website: "https://www.joburg.org.za",
    provinceCode: "GP",
    category: "municipal",
    description: "Municipal tenders and procurement opportunities for the City of Johannesburg metropolitan municipality.",
    contactEmail: "tenders@joburg.org.za"
  },
  {
    name: "City of Tshwane",
    website: "https://www.tshwane.gov.za",
    provinceCode: "GP",
    category: "municipal",
    description: "Municipal procurement and tender opportunities for the City of Tshwane (Pretoria) metropolitan area.",
    contactEmail: "procurement@tshwane.gov.za"
  },
  {
    name: "Ekurhuleni Metropolitan Municipality",
    website: "https://www.ekurhuleni.gov.za",
    provinceCode: "GP",
    category: "municipal",
    description: "Municipal tenders for the East Rand metropolitan area including Germiston, Benoni, and Boksburg.",
    contactEmail: "tenders@ekurhuleni.gov.za"
  },

  // Western Cape Province
  {
    name: "Western Cape Provincial Government",
    website: "https://www.westerncape.gov.za",
    provinceCode: "WC",
    category: "provincial",
    description: "Provincial government procurement opportunities for Western Cape departments and entities.",
    contactEmail: "procurement@westerncape.gov.za"
  },
  {
    name: "City of Cape Town",
    website: "https://www.capetown.gov.za",
    provinceCode: "WC",
    category: "municipal",
    description: "Municipal tenders and supply chain opportunities for the City of Cape Town metropolitan municipality.",
    contactEmail: "tenders@capetown.gov.za"
  },
  {
    name: "George Municipality",
    website: "https://www.george.gov.za",
    provinceCode: "WC",
    category: "municipal",
    description: "Municipal procurement opportunities for George and surrounding Garden Route areas.",
    contactEmail: "procurement@george.gov.za"
  },

  // KwaZulu-Natal Province
  {
    name: "KwaZulu-Natal Provincial Government",
    website: "https://www.kznonline.gov.za",
    provinceCode: "KZN",
    category: "provincial",
    description: "Provincial government tenders for KwaZulu-Natal departments and public entities.",
    contactEmail: "procurement@kznonline.gov.za"
  },
  {
    name: "eThekwini Municipality",
    website: "https://www.durban.gov.za",
    provinceCode: "KZN",
    category: "municipal",
    description: "Municipal tenders for Durban metropolitan area and surrounding eThekwini municipal region.",
    contactEmail: "tenders@durban.gov.za"
  },
  {
    name: "Msunduzi Municipality",
    website: "https://www.msunduzi.gov.za",
    provinceCode: "KZN",
    category: "municipal",
    description: "Municipal procurement opportunities for Pietermaritzburg and surrounding Msunduzi municipal area.",
    contactEmail: "procurement@msunduzi.gov.za"
  },

  // Eastern Cape Province
  {
    name: "Eastern Cape Provincial Government",
    website: "https://www.ecprov.gov.za",
    provinceCode: "EC",
    category: "provincial",
    description: "Provincial government procurement for Eastern Cape departments and provincial entities.",
    contactEmail: "procurement@ecprov.gov.za"
  },
  {
    name: "Nelson Mandela Bay Municipality",
    website: "https://www.nelsonmandelabay.gov.za",
    provinceCode: "EC",
    category: "municipal",
    description: "Municipal tenders for Port Elizabeth, Uitenhage, and Despatch metropolitan area.",
    contactEmail: "tenders@nelsonmandelabay.gov.za"
  },
  {
    name: "Buffalo City Municipality",
    website: "https://www.buffalocity.gov.za",
    provinceCode: "EC",
    category: "municipal",
    description: "Municipal procurement opportunities for East London and surrounding Buffalo City area.",
    contactEmail: "procurement@buffalocity.gov.za"
  },

  // Limpopo Province
  {
    name: "Limpopo Provincial Government",
    website: "https://www.limpopo.gov.za",
    provinceCode: "LP",
    category: "provincial",
    description: "Provincial government tenders for Limpopo province departments and agencies.",
    contactEmail: "procurement@limpopo.gov.za"
  },
  {
    name: "Polokwane Municipality",
    website: "https://www.polokwane.gov.za",
    provinceCode: "LP",
    category: "municipal",
    description: "Municipal tenders and procurement for Polokwane city and surrounding municipal areas.",
    contactEmail: "tenders@polokwane.gov.za"
  },

  // Mpumalanga Province
  {
    name: "Mpumalanga Provincial Government",
    website: "https://www.mpumalanga.gov.za",
    provinceCode: "MP",
    category: "provincial",
    description: "Provincial government procurement opportunities for Mpumalanga departments and entities.",
    contactEmail: "procurement@mpumalanga.gov.za"
  },
  {
    name: "Mbombela Municipality",
    website: "https://www.mbombela.gov.za",
    provinceCode: "MP",
    category: "municipal",
    description: "Municipal tenders for Nelspruit (Mbombela) and surrounding Lowveld municipal area.",
    contactEmail: "tenders@mbombela.gov.za"
  },

  // Free State Province
  {
    name: "Free State Provincial Government",
    website: "https://www.fs.gov.za",
    provinceCode: "FS",
    category: "provincial",
    description: "Provincial government tenders for Free State departments and provincial public entities.",
    contactEmail: "procurement@fs.gov.za"
  },
  {
    name: "Mangaung Metropolitan Municipality",
    website: "https://www.mangaung.co.za",
    provinceCode: "FS",
    category: "municipal",
    description: "Municipal procurement for Bloemfontein metropolitan area and surrounding Mangaung region.",
    contactEmail: "tenders@mangaung.co.za"
  },

  // North West Province
  {
    name: "North West Provincial Government",
    website: "https://www.nwpg.gov.za",
    provinceCode: "NW",
    category: "provincial",
    description: "Provincial government procurement opportunities for North West province departments.",
    contactEmail: "procurement@nwpg.gov.za"
  },
  {
    name: "Mahikeng Local Municipality",
    website: "https://www.mahikeng.gov.za",
    provinceCode: "NW",
    category: "municipal",
    description: "Municipal tenders for Mahikeng (formerly Mafikeng) and surrounding local municipal area.",
    contactEmail: "tenders@mahikeng.gov.za"
  },

  // Northern Cape Province
  {
    name: "Northern Cape Provincial Government",
    website: "https://www.northern-cape.gov.za",
    provinceCode: "NC",
    category: "provincial",
    description: "Provincial government tenders for Northern Cape departments and provincial agencies.",
    contactEmail: "procurement@northern-cape.gov.za"
  },
  {
    name: "Sol Plaatje Municipality",
    website: "https://www.solplaatje.org.za",
    provinceCode: "NC",
    category: "municipal",
    description: "Municipal procurement opportunities for Kimberley and surrounding Sol Plaatje municipal area.",
    contactEmail: "tenders@solplaatje.org.za"
  },

  // State-Owned Enterprises and Agencies
  {
    name: "Eskom Holdings SOC Ltd",
    website: "https://www.eskom.co.za",
    provinceCode: "GP",
    category: "government",
    description: "National electricity utility procurement for power generation, transmission, and distribution infrastructure.",
    contactEmail: "procurement@eskom.co.za"
  },
  {
    name: "Transnet SOC Ltd",
    website: "https://www.transnet.net",
    provinceCode: "GP",
    category: "government",
    description: "National transport and logistics company tenders for rail, port, and pipeline infrastructure.",
    contactEmail: "tenders@transnet.net"
  },
  {
    name: "South African National Roads Agency (SANRAL)",
    website: "https://www.nra.co.za",
    provinceCode: "GP",
    category: "government",
    description: "National roads agency procurement for highway construction, maintenance, and toll road operations.",
    contactEmail: "procurement@nra.co.za"
  }
];

async function validateWebsiteAccessibility(website: string): Promise<boolean> {
  try {
    // Basic URL validation
    const url = new URL(website);
    if (!url.protocol.startsWith('http')) {
      return false;
    }
    
    // For production, you might want to add actual HTTP checks
    // For now, we'll validate the URL format and domain structure
    const domain = url.hostname.toLowerCase();
    
    // Check for valid South African domains or known government/corporate domains
    const validDomains = [
      'gov.za', 'co.za', 'org.za', 'net.za', 'ac.za',
      'joburg.org.za', 'capetown.gov.za', 'durban.gov.za',
      'tshwane.gov.za', 'ekurhuleni.gov.za'
    ];
    
    // Also allow international domains for state-owned enterprises
    const validInternationalDomains = ['.net', '.com', '.org'];
    
    const isValidDomain = validDomains.some(validDomain => 
      domain.endsWith(validDomain) || domain === validDomain
    ) || validInternationalDomains.some(intlDomain => 
      domain.endsWith(intlDomain)
    );
    
    return isValidDomain;
  } catch {
    return false;
  }
}

async function validatePublisherData(): Promise<boolean> {
  console.log("🔍 Validating publisher data...");
  
  // Check for duplicate names
  const names = SA_PUBLISHERS.map(p => p.name);
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    console.error("❌ Duplicate publisher names found");
    return false;
  }

  // Check for duplicate websites
  const websites = SA_PUBLISHERS.map(p => p.website);
  const uniqueWebsites = new Set(websites);
  if (websites.length !== uniqueWebsites.size) {
    console.error("❌ Duplicate publisher websites found");
    return false;
  }

  // Validate each publisher
  for (const publisher of SA_PUBLISHERS) {
    // Check required fields
    if (!publisher.name || !publisher.website || !publisher.provinceCode || !publisher.category || !publisher.description) {
      console.error(`❌ Missing required fields for publisher: ${publisher.name || 'Unknown'}`);
      return false;
    }
    
    // Validate province code
    const validProvinceCodes = ['EC', 'FS', 'GP', 'KZN', 'LP', 'MP', 'NC', 'NW', 'WC'];
    if (!validProvinceCodes.includes(publisher.provinceCode)) {
      console.error(`❌ Invalid province code for ${publisher.name}: ${publisher.provinceCode}`);
      return false;
    }

    // Validate category
    const validCategories = ['government', 'municipal', 'provincial', 'private'];
    if (!validCategories.includes(publisher.category)) {
      console.error(`❌ Invalid category for ${publisher.name}: ${publisher.category}`);
      return false;
    }

    // Validate website accessibility
    const isWebsiteValid = await validateWebsiteAccessibility(publisher.website);
    if (!isWebsiteValid) {
      console.error(`❌ Invalid website URL for ${publisher.name}: ${publisher.website}`);
      return false;
    }

    // Validate email format if provided
    if (publisher.contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(publisher.contactEmail)) {
        console.error(`❌ Invalid email format for ${publisher.name}: ${publisher.contactEmail}`);
        return false;
      }
    }
  }

  console.log("✅ Publisher data validation passed");
  return true;
}

async function populatePublishers(): Promise<void> {
  try {
    console.log("🚀 Starting South African publishers population...");

    // Validate data before insertion
    const isValid = await validatePublisherData();
    if (!isValid) {
      throw new Error("Publisher data validation failed");
    }

    // Get all provinces to map codes to IDs
    const allProvinces = await db.select().from(provinces);
    const provinceMap = new Map(allProvinces.map(p => [p.code, p.id]));

    // Validate that all required provinces exist
    const requiredProvinceCodes = [...new Set(SA_PUBLISHERS.map(p => p.provinceCode))];
    const missingProvinces = requiredProvinceCodes.filter(code => !provinceMap.has(code));
    
    if (missingProvinces.length > 0) {
      throw new Error(`Missing provinces in database: ${missingProvinces.join(', ')}. Please run populate-provinces.ts first.`);
    }

    // Check if publishers already exist
    const existingPublishers = await db.select().from(publishers);
    
    if (existingPublishers.length > 0) {
      console.log(`⚠️  Found ${existingPublishers.length} existing publishers. Updating existing data...`);
      
      // Update existing publishers by name
      for (const publisherData of SA_PUBLISHERS) {
        const existing = existingPublishers.find(p => p.name === publisherData.name);
        const provinceId = provinceMap.get(publisherData.provinceCode);
        
        if (!provinceId) {
          console.error(`❌ Province not found for code: ${publisherData.provinceCode}`);
          continue;
        }
        
        if (existing) {
          // Only update if the website or province has changed
          if (existing.website !== publisherData.website || existing.province_id !== provinceId) {
            await db
              .update(publishers)
              .set({
                website: publisherData.website,
                province_id: provinceId,
                createdAt: existing.createdAt // Preserve original creation date
              })
              .where(eq(publishers.id, existing.id));
            
            console.log(`✅ Updated publisher: ${publisherData.name}`);
          } else {
            console.log(`⏭️  Skipped publisher (no changes): ${publisherData.name}`);
          }
        } else {
          // Check if a publisher with the same website already exists
          const existingByWebsite = existingPublishers.find(p => p.website === publisherData.website);
          if (existingByWebsite) {
            console.log(`⚠️  Skipped publisher (website exists): ${publisherData.name} - website already used by ${existingByWebsite.name}`);
          } else {
            // Insert new publisher if it doesn't exist
            await db.insert(publishers).values({
              name: publisherData.name,
              website: publisherData.website,
              province_id: provinceId,
            });
            
            console.log(`✅ Inserted new publisher: ${publisherData.name}`);
          }
        }
      }
    } else {
      console.log("📝 No existing publishers found. Inserting all publishers...");
      
      // Insert all publishers
      const publishersToInsert = SA_PUBLISHERS.map(publisherData => {
        const provinceId = provinceMap.get(publisherData.provinceCode);
        if (!provinceId) {
          throw new Error(`Province not found for code: ${publisherData.provinceCode}`);
        }
        
        return {
          name: publisherData.name,
          website: publisherData.website,
          province_id: provinceId,
        };
      });

      await db.insert(publishers).values(publishersToInsert);
      
      for (const publisher of SA_PUBLISHERS) {
        console.log(`✅ Inserted publisher: ${publisher.name}`);
      }
    }

    // Verify final state
    const finalPublishers = await db
      .select({
        id: publishers.id,
        name: publishers.name,
        website: publishers.website,
        provinceName: provinces.name,
        provinceCode: provinces.code
      })
      .from(publishers)
      .leftJoin(provinces, eq(publishers.province_id, provinces.id));

    console.log(`\n🎉 Publisher population completed successfully!`);
    console.log(`📊 Total publishers in database: ${finalPublishers.length}`);
    
    // Display summary by category
    const publishersByCategory = SA_PUBLISHERS.reduce((acc, pub) => {
      acc[pub.category] = (acc[pub.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📋 Publisher Summary by Category:");
    Object.entries(publishersByCategory).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} publishers`);
    });

    // Display summary by province
    const publishersByProvince = SA_PUBLISHERS.reduce((acc, pub) => {
      acc[pub.provinceCode] = (acc[pub.provinceCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📍 Publisher Summary by Province:");
    Object.entries(publishersByProvince).forEach(([code, count]) => {
      const provinceName = allProvinces.find(p => p.code === code)?.name || code;
      console.log(`   • ${provinceName} (${code}): ${count} publishers`);
    });

  } catch (error) {
    console.error("❌ Failed to populate publishers:", error);
    throw error;
  }
}

// Export for use in other scripts
export { SA_PUBLISHERS, validatePublisherData, validateWebsiteAccessibility, populatePublishers };

// Run if called directly
if (require.main === module) {
  populatePublishers()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}