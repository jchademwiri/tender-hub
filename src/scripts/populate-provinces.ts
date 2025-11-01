import { db } from "@/db";
import { provinces } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ProvinceData {
  name: string;
  code: string;
  description: string;
  capital: string;
  population: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Official South African provinces data with accurate information
const SA_PROVINCES: ProvinceData[] = [
  {
    name: "Eastern Cape",
    code: "EC",
    description: "The Eastern Cape is a province located on the southeast coast of South Africa. Known for its diverse landscapes, rich cultural heritage, and as the birthplace of Nelson Mandela.",
    capital: "Bhisho",
    population: 6734001,
    coordinates: { latitude: -32.2968, longitude: 26.4194 }
  },
  {
    name: "Free State",
    code: "FS", 
    description: "The Free State is a landlocked province in the center of South Africa. Known for its vast agricultural lands, gold mining, and historical significance in the Anglo-Boer Wars.",
    capital: "Bloemfontein",
    population: 2887465,
    coordinates: { latitude: -29.0852, longitude: 26.1596 }
  },
  {
    name: "Gauteng",
    code: "GP",
    description: "Gauteng is the smallest but most populous province in South Africa. It's the economic hub of the country, containing Johannesburg and Pretoria, and generates over a third of South Africa's GDP.",
    capital: "Johannesburg",
    population: 15810388,
    coordinates: { latitude: -26.2708, longitude: 28.1123 }
  },
  {
    name: "KwaZulu-Natal",
    code: "KZN",
    description: "KwaZulu-Natal is a coastal province known for its beaches, mountains, and rich Zulu cultural heritage. It's home to the Drakensberg Mountains and major ports like Durban.",
    capital: "Pietermaritzburg",
    population: 11513575,
    coordinates: { latitude: -29.6094, longitude: 30.3781 }
  },
  {
    name: "Limpopo",
    code: "LP",
    description: "Limpopo is the northernmost province of South Africa, bordering Botswana, Zimbabwe, and Mozambique. Known for its wildlife reserves, baobab trees, and diverse cultures.",
    capital: "Polokwane",
    population: 5982584,
    coordinates: { latitude: -23.9045, longitude: 29.4689 }
  },
  {
    name: "Mpumalanga",
    code: "MP",
    description: "Mpumalanga means 'place where the sun rises' in Zulu. This province is known for its scenic beauty, including the Kruger National Park, coal mining, and forestry.",
    capital: "Mbombela",
    population: 4679770,
    coordinates: { latitude: -25.4753, longitude: 30.9638 }
  },
  {
    name: "Northern Cape",
    code: "NC",
    description: "The Northern Cape is the largest province by area but least populated. Known for its diamond mining, desert landscapes, and the Orange River.",
    capital: "Kimberley",
    population: 1303047,
    coordinates: { latitude: -28.7282, longitude: 24.7499 }
  },
  {
    name: "North West",
    code: "NW",
    description: "North West province is known for its platinum mining, agricultural activities, and the Pilanesberg National Park. It borders Botswana to the west.",
    capital: "Mahikeng",
    population: 4072160,
    coordinates: { latitude: -25.8601, longitude: 25.6358 }
  },
  {
    name: "Western Cape",
    code: "WC",
    description: "The Western Cape is known for its Mediterranean climate, wine regions, and Cape Town. It's a major tourist destination with Table Mountain and beautiful coastlines.",
    capital: "Cape Town",
    population: 7005741,
    coordinates: { latitude: -33.9258, longitude: 18.4232 }
  }
];

async function validateProvinceData(): Promise<boolean> {
  console.log("🔍 Validating province data...");
  
  // Check that we have exactly 9 provinces
  if (SA_PROVINCES.length !== 9) {
    console.error(`❌ Expected 9 provinces, found ${SA_PROVINCES.length}`);
    return false;
  }

  // Check for duplicate codes
  const codes = SA_PROVINCES.map(p => p.code);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    console.error("❌ Duplicate province codes found");
    return false;
  }

  // Validate required fields
  for (const province of SA_PROVINCES) {
    if (!province.name || !province.code || !province.description || !province.capital) {
      console.error(`❌ Missing required fields for province: ${province.name || 'Unknown'}`);
      return false;
    }
    
    if (province.code.length < 2 || province.code.length > 3) {
      console.error(`❌ Invalid province code length for ${province.name}: ${province.code}`);
      return false;
    }

    if (province.population <= 0) {
      console.error(`❌ Invalid population for ${province.name}: ${province.population}`);
      return false;
    }

    // Validate coordinates are within South Africa bounds
    const { latitude, longitude } = province.coordinates;
    if (latitude < -35 || latitude > -22 || longitude < 16 || longitude > 33) {
      console.error(`❌ Invalid coordinates for ${province.name}: ${latitude}, ${longitude}`);
      return false;
    }
  }

  console.log("✅ Province data validation passed");
  return true;
}

async function populateProvinces(): Promise<void> {
  try {
    console.log("🚀 Starting South African provinces population...");

    // Validate data before insertion
    const isValid = await validateProvinceData();
    if (!isValid) {
      throw new Error("Province data validation failed");
    }

    // Check if provinces already exist
    const existingProvinces = await db.select().from(provinces);
    
    if (existingProvinces.length > 0) {
      console.log(`⚠️  Found ${existingProvinces.length} existing provinces. Updating existing data...`);
      
      // Update existing provinces
      for (const provinceData of SA_PROVINCES) {
        const existing = existingProvinces.find(p => p.code === provinceData.code);
        
        if (existing) {
          await db
            .update(provinces)
            .set({
              name: provinceData.name,
              description: `${provinceData.description} Capital: ${provinceData.capital}. Population: ${provinceData.population.toLocaleString()}. Coordinates: ${provinceData.coordinates.latitude}, ${provinceData.coordinates.longitude}`,
              createdAt: existing.createdAt // Preserve original creation date
            })
            .where(eq(provinces.id, existing.id));
          
          console.log(`✅ Updated province: ${provinceData.name} (${provinceData.code})`);
        } else {
          // Insert new province if it doesn't exist
          await db.insert(provinces).values({
            name: provinceData.name,
            code: provinceData.code,
            description: `${provinceData.description} Capital: ${provinceData.capital}. Population: ${provinceData.population.toLocaleString()}. Coordinates: ${provinceData.coordinates.latitude}, ${provinceData.coordinates.longitude}`,
          });
          
          console.log(`✅ Inserted new province: ${provinceData.name} (${provinceData.code})`);
        }
      }
    } else {
      console.log("📝 No existing provinces found. Inserting all provinces...");
      
      // Insert all provinces
      const provincesToInsert = SA_PROVINCES.map(provinceData => ({
        name: provinceData.name,
        code: provinceData.code,
        description: `${provinceData.description} Capital: ${provinceData.capital}. Population: ${provinceData.population.toLocaleString()}. Coordinates: ${provinceData.coordinates.latitude}, ${provinceData.coordinates.longitude}`,
      }));

      await db.insert(provinces).values(provincesToInsert);
      
      for (const province of SA_PROVINCES) {
        console.log(`✅ Inserted province: ${province.name} (${province.code})`);
      }
    }

    // Verify final state
    const finalProvinces = await db.select().from(provinces);
    console.log(`\n🎉 Province population completed successfully!`);
    console.log(`📊 Total provinces in database: ${finalProvinces.length}`);
    
    // Display summary
    console.log("\n📋 Province Summary:");
    for (const province of finalProvinces.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`   • ${province.name} (${province.code})`);
    }

  } catch (error) {
    console.error("❌ Failed to populate provinces:", error);
    throw error;
  }
}

// Export for use in other scripts
export { SA_PROVINCES, validateProvinceData, populateProvinces };

// Run if called directly
if (require.main === module) {
  populateProvinces()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}