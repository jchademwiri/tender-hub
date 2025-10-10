export interface Province {
  name: string;
  code: string;
  description: string;
}

export interface PublisherListing {
  province: string;
  name: string;
  website: string;
}


// Full province data with codes and fun facts
export const provinceData = [
  { name: "Gauteng", code: "GP", description: "South Africa’s economic powerhouse and smallest province by land area." },
  { name: "Western Cape", code: "WC", description: "Home to Table Mountain and the iconic city of Cape Town." },
  { name: "KwaZulu-Natal", code: "KZN", description: "Known for Durban’s beaches and the majestic Drakensberg Mountains." },
  { name: "Limpopo", code: "LP", description: "Gateway to Kruger National Park and rich cultural heritage." },
  { name: "Mpumalanga", code: "MP", description: "Famous for breathtaking landscapes like the Panorama Route and Blyde River Canyon." },
  { name: "North West", code: "NW", description: "Home to Sun City and the Pilanesberg National Park." },
  { name: "Free State", code: "FS", description: "Known for its farmlands and the Gariep Dam — the largest in South Africa." },
  { name: "Northern Cape", code: "NC", description: "Largest province by area, famous for the Augrabies Falls and starry night skies." },
  { name: "Eastern Cape", code: "EC", description: "Birthplace of Nelson Mandela and home to the Wild Coast." },
  { name: "National", code: "ZA", description: "Covers all national-level publishers and tender aggregators." }, // 👈 new
];


export const publisherData: PublisherListing[] = [
  // 🏙️ Gauteng
  { province: "Gauteng", name: "Gauteng e-Government (GPG eTender Portal)", website: "https://www.gauteng.gov.za/services/business/tenders" },
  { province: "Gauteng", name: "City of Tshwane", website: "https://www.tshwane.gov.za/sites/business/Pages/Tenders.aspx" },
  { province: "Gauteng", name: "City of Johannesburg", website: "https://www.joburg.org.za" },
  { province: "Gauteng", name: "City of Ekurhuleni", website: "https://www.ekurhuleni.gov.za/tenders/" },
  { province: "Gauteng", name: "Sedibeng District Municipality", website: "http://www.sedibeng.gov.za" },
  { province: "Gauteng", name: "West Rand District Municipality", website: "http://www.wrdm.gov.za" },
  { province: "Gauteng", name: "Merafong City Local Municipality", website: "http://www.merafong.gov.za" },
  { province: "Gauteng", name: "Lesedi Local Municipality", website: "https://www.lesedilm.gov.za" },
  { province: "Gauteng", name: "Gautrain Management Agency", website: "https://www.gautrain.co.za" },
  { province: "Gauteng", name: "Rand Water", website: "https://www.randwater.co.za" },
  { province: "Gauteng", name: "City Power Johannesburg", website: "https://www.citypower.co.za" },
  { province: "Gauteng", name: "Johannesburg Roads Agency (JRA)", website: "https://www.jra.org.za" },
  { province: "Gauteng", name: "Ekurhuleni Water Care Company (ERWAT)", website: "https://www.erwat.co.za" },
  { province: "Gauteng", name: "University of Johannesburg (UJ)", website: "https://www.uj.ac.za" },
  { province: "Gauteng", name: "University of Pretoria (UP)", website: "https://www.up.ac.za" },
  { province: "Gauteng", name: "University of the Witwatersrand (Wits)", website: "https://www.wits.ac.za" },
  { province: "Gauteng", name: "Tshwane University of Technology (TUT)", website: "https://www.tut.ac.za" },
  { province: "Gauteng", name: "North-West University (Vanderbijlpark Campus)", website: "https://www.nwu.ac.za" },

  // 🌍 Mpumalanga
  { province: "Mpumalanga", name: "Mpumalanga Provincial Government eTender Portal", website: "https://www.mpumalanga.gov.za" },
  { province: "Mpumalanga", name: "Emalahleni Local Municipality", website: "https://www.emalahleni.gov.za" },
  { province: "Mpumalanga", name: "Mbombela Local Municipality", website: "https://www.mbombela.gov.za" },

  // 🌐 National / Aggregators
  { province: "National", name: "Leads 2 Business (L2B)", website: "https://www.l2b.co.za" },
  { province: "National", name: "OnlineTenders", website: "https://www.onlinetenders.co.za" },
  { province: "National", name: "SA-Tenders", website: "https://www.sa-tenders.co.za" },
  { province: "National", name: "TenderBulletin", website: "https://www.tenderbulletin.co.za" },
  { province: "National", name: "Tenders24", website: "https://www.tenders24.co.za" },
  { province: "National", name: "TenderCom", website: "https://www.tendercom.co.za" },
  { province: "National", name: "TenderAlerts", website: "https://www.tenderalerts.co.za" },
  { province: "National", name: "EasyTenders", website: "https://www.easytenders.co.za" },
  { province: "National", name: "TendersOnTime", website: "https://www.tendersonline.co.za" },
  { province: "National", name: "TenderFilter", website: "https://www.tenderfilter.co.za" },
  { province: "National", name: "South Africa Tenders", website: "https://www.southafricatenders.com" },
  { province: "National", name: "Bidsstack", website: "https://www.bidsstack.com" },
  { province: "National", name: "CIDB Register of Projects", website: "https://www.cidb.org.za" },
  { province: "National", name: "National Treasury eTenders Portal", website: "https://www.etenders.gov.za" },
];
export default publisherData;
