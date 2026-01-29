export interface CountryOption {
  value: string;
  label: string;
  tier: number;
  region: string;
}

export interface BehaviorOption {
  id: string;
  label: string;
  priceMod: number;
}

export interface BehaviorCategory {
  category: string;
  options: BehaviorOption[];
}

export interface RegionPreset {
  id: string;
  label: string;
  countries: string[];
}

export const REGIONS: RegionPreset[] = [
  { id: 'gcc', label: 'GCC', countries: ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'] },
  { id: 'mena', label: 'MENA', countries: ['AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB', 'MA', 'TN'] },
  { id: 'north_america', label: 'North America', countries: ['US', 'CA'] },
  { id: 'eu5', label: 'Europe (EU5)', countries: ['GB', 'DE', 'FR', 'IT', 'ES'] },
];

export const CITIES: Record<string, string[]> = {
  AE: ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'],
  AU: ['Adelaide', 'Brisbane', 'Melbourne', 'Perth', 'Sydney'],
  BH: ['Hamad Town', 'Manama', 'Muharraq', 'Riffa'],
  CA: ['Calgary', 'Edmonton', 'Montreal', 'Ottawa', 'Quebec City', 'Toronto', 'Vancouver', 'Winnipeg'],
  DE: ['Berlin', 'Cologne', 'Dortmund', 'Düsseldorf', 'Frankfurt', 'Hamburg', 'Munich', 'Stuttgart'],
  EG: ['Alexandria', 'Aswan', 'Cairo', 'Giza', 'Luxor', 'Port Said'],
  ES: ['Barcelona', 'Bilbao', 'Madrid', 'Málaga', 'Seville', 'Valencia', 'Zaragoza'],
  FR: ['Bordeaux', 'Lyon', 'Marseille', 'Nantes', 'Nice', 'Paris', 'Strasbourg', 'Toulouse'],
  GB: ['Birmingham', 'Bristol', 'Edinburgh', 'Glasgow', 'Leeds', 'Liverpool', 'London', 'Manchester', 'Newcastle'],
  IN: ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'],
  IT: ['Bologna', 'Florence', 'Genoa', 'Milan', 'Naples', 'Palermo', 'Rome', 'Turin', 'Venice'],
  JO: ['Amman', 'Aqaba', 'Irbid', 'Zarqa'],
  JP: ['Fukuoka', 'Nagoya', 'Osaka', 'Sapporo', 'Tokyo', 'Yokohama'],
  KW: ['Farwaniya', 'Hawalli', 'Kuwait City', 'Salmiya'],
  LB: ['Beirut', 'Sidon', 'Tripoli', 'Tyre'],
  MA: ['Agadir', 'Casablanca', 'Fes', 'Marrakech', 'Rabat', 'Tangier'],
  OM: ['Muscat', 'Nizwa', 'Salalah', 'Sohar'],
  QA: ['Al Rayyan', 'Al Wakrah', 'Doha', 'Umm Salal'],
  SA: ['Dammam', 'Jeddah', 'Mecca', 'Medina', 'Riyadh'],
  SG: ['Singapore'],
  TN: ['Kairouan', 'Sfax', 'Sousse', 'Tunis'],
  US: ['Atlanta', 'Austin', 'Boston', 'Chicago', 'Dallas', 'Houston', 'Los Angeles', 'Miami', 'New York', 'Philadelphia', 'Phoenix', 'San Antonio', 'San Diego', 'San Francisco', 'Seattle'],
};

export const COUNTRIES: CountryOption[] = [
  { value: 'AR', label: 'Argentina', tier: 3, region: 'Americas' },
  { value: 'AU', label: 'Australia', tier: 1, region: 'Oceania' },
  { value: 'AT', label: 'Austria', tier: 2, region: 'Europe' },
  { value: 'BH', label: 'Bahrain', tier: 3, region: 'Middle East' },
  { value: 'BE', label: 'Belgium', tier: 2, region: 'Europe' },
  { value: 'BR', label: 'Brazil', tier: 3, region: 'Americas' },
  { value: 'CA', label: 'Canada', tier: 1, region: 'Americas' },
  { value: 'CL', label: 'Chile', tier: 3, region: 'Americas' },
  { value: 'CO', label: 'Colombia', tier: 3, region: 'Americas' },
  { value: 'CZ', label: 'Czech Republic', tier: 3, region: 'Europe' },
  { value: 'DK', label: 'Denmark', tier: 1, region: 'Europe' },
  { value: 'EG', label: 'Egypt', tier: 3, region: 'Africa' },
  { value: 'FI', label: 'Finland', tier: 2, region: 'Europe' },
  { value: 'FR', label: 'France', tier: 2, region: 'Europe' },
  { value: 'DE', label: 'Germany', tier: 2, region: 'Europe' },
  { value: 'GR', label: 'Greece', tier: 2, region: 'Europe' },
  { value: 'HK', label: 'Hong Kong', tier: 2, region: 'Asia' },
  { value: 'HU', label: 'Hungary', tier: 3, region: 'Europe' },
  { value: 'IN', label: 'India', tier: 3, region: 'Asia' },
  { value: 'ID', label: 'Indonesia', tier: 3, region: 'Asia' },
  { value: 'IE', label: 'Ireland', tier: 1, region: 'Europe' },
  { value: 'IL', label: 'Israel', tier: 2, region: 'Middle East' },
  { value: 'IT', label: 'Italy', tier: 2, region: 'Europe' },
  { value: 'JP', label: 'Japan', tier: 2, region: 'Asia' },
  { value: 'JO', label: 'Jordan', tier: 3, region: 'Middle East' },
  { value: 'KE', label: 'Kenya', tier: 3, region: 'Africa' },
  { value: 'KW', label: 'Kuwait', tier: 2, region: 'Middle East' },
  { value: 'LB', label: 'Lebanon', tier: 2, region: 'Middle East' },
  { value: 'MY', label: 'Malaysia', tier: 3, region: 'Asia' },
  { value: 'MX', label: 'Mexico', tier: 3, region: 'Americas' },
  { value: 'MA', label: 'Morocco', tier: 3, region: 'Africa' },
  { value: 'NL', label: 'Netherlands', tier: 2, region: 'Europe' },
  { value: 'NZ', label: 'New Zealand', tier: 1, region: 'Oceania' },
  { value: 'NG', label: 'Nigeria', tier: 3, region: 'Africa' },
  { value: 'NO', label: 'Norway', tier: 1, region: 'Europe' },
  { value: 'OM', label: 'Oman', tier: 3, region: 'Middle East' },
  { value: 'PK', label: 'Pakistan', tier: 3, region: 'Asia' },
  { value: 'PH', label: 'Philippines', tier: 3, region: 'Asia' },
  { value: 'PL', label: 'Poland', tier: 3, region: 'Europe' },
  { value: 'PT', label: 'Portugal', tier: 2, region: 'Europe' },
  { value: 'QA', label: 'Qatar', tier: 2, region: 'Middle East' },
  { value: 'RO', label: 'Romania', tier: 3, region: 'Europe' },
  { value: 'SA', label: 'Saudi Arabia', tier: 2, region: 'Middle East' },
  { value: 'SG', label: 'Singapore', tier: 1, region: 'Asia' },
  { value: 'ZA', label: 'South Africa', tier: 3, region: 'Africa' },
  { value: 'KR', label: 'South Korea', tier: 2, region: 'Asia' },
  { value: 'ES', label: 'Spain', tier: 2, region: 'Europe' },
  { value: 'SE', label: 'Sweden', tier: 1, region: 'Europe' },
  { value: 'CH', label: 'Switzerland', tier: 1, region: 'Europe' },
  { value: 'TW', label: 'Taiwan', tier: 2, region: 'Asia' },
  { value: 'TH', label: 'Thailand', tier: 3, region: 'Asia' },
  { value: 'TN', label: 'Tunisia', tier: 3, region: 'Africa' },
  { value: 'TR', label: 'Turkey', tier: 3, region: 'Europe' },
  { value: 'UA', label: 'Ukraine', tier: 3, region: 'Europe' },
  { value: 'AE', label: 'United Arab Emirates', tier: 1, region: 'Middle East' },
  { value: 'GB', label: 'United Kingdom', tier: 1, region: 'Europe' },
  { value: 'US', label: 'United States', tier: 1, region: 'Americas' },
  { value: 'VN', label: 'Vietnam', tier: 3, region: 'Asia' },
];

export const BEHAVIORS: BehaviorCategory[] = [
  {
    category: "Professional & B2B",
    options: [
      { id: 'b2b_decision_maker', label: 'Business Decision Makers', priceMod: 0.50 },
      { id: 'c_level', label: 'C-Suite Executives (CEO, CTO, CFO)', priceMod: 0.50 },
      { id: 'small_business_owner', label: 'Small Business Owners', priceMod: 0.50 },
      { id: 'freelancer', label: 'Freelancers / Consultants', priceMod: 0.50 },
      { id: 'it_professional', label: 'IT & Tech Professionals', priceMod: 0.50 },
      { id: 'healthcare_pro', label: 'Healthcare Professionals', priceMod: 0.50 },
      { id: 'educator', label: 'Teachers & Educators', priceMod: 0.50 }
    ]
  },
  {
    category: "Technographics",
    options: [
      { id: 'ios_user', label: 'iOS / iPhone Users', priceMod: 0.50 },
      { id: 'android_high', label: 'High-End Android Users', priceMod: 0.50 },
      { id: 'console_gamer', label: 'Console Gamers (PS5/Xbox)', priceMod: 0.50 },
      { id: 'pc_gamer', label: 'PC Gamers', priceMod: 0.50 },
      { id: 'smart_home', label: 'Smart Home Device Owners', priceMod: 0.50 },
      { id: 'wearable_tech', label: 'Smartwatch/Wearable Users', priceMod: 0.50 }
    ]
  },
  {
    category: "Finance & Shopping",
    options: [
      { id: 'crypto_trader', label: 'Cryptocurrency Traders', priceMod: 0.50 },
      { id: 'stock_investor', label: 'Stock Market Investors', priceMod: 0.50 },
      { id: 'credit_card', label: 'Credit Card Holders', priceMod: 0.50 },
      { id: 'online_shopper', label: 'Frequent Online Shoppers', priceMod: 0.50 },
      { id: 'luxury_shopper', label: 'Luxury Goods Buyers', priceMod: 0.50 }
    ]
  },
  {
    category: "Lifestyle & Family",
    options: [
      { id: 'parents_young', label: 'Parents (Kids 0-12)', priceMod: 0.50 },
      { id: 'parents_teen', label: 'Parents (Teens 13-17)', priceMod: 0.50 },
      { id: 'pet_cat', label: 'Cat Owners', priceMod: 0.50 },
      { id: 'pet_dog', label: 'Dog Owners', priceMod: 0.50 },
      { id: 'traveler', label: 'Frequent Travelers', priceMod: 0.50 },
      { id: 'fitness', label: 'Fitness & Gym Goers', priceMod: 0.50 },
      { id: 'car_owner', label: 'Car Owners', priceMod: 0.50 }
    ]
  }
];

export const targetingOptions = {
  countries: COUNTRIES,
  behaviors: BEHAVIORS,
  ageRanges: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
  genders: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
  education: ['High School', 'Vocational/Trade', 'Some College', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate/PhD'],
  marital: ['Single', 'Married', 'Living with Partner', 'Divorced', 'Widowed'],
  parental: ['No Children', 'Parent (Kids <18)', 'Parent (Adult Kids)', 'Expecting'],
  employment: ['Full-Time Employed', 'Part-Time Employed', 'Freelance/Self-Employed', 'Student', 'Retired', 'Unemployed', 'Stay-at-Home Parent'],
  industries: [
    'Technology/IT',
    'Healthcare',
    'Finance/Banking',
    'Retail/E-commerce',
    'Construction',
    'Oil & Gas',
    'Education',
    'Manufacturing',
    'Consulting',
    'Marketing/Advertising',
    'Real Estate',
    'Hospitality',
    'Transportation',
    'Media/Entertainment',
    'Legal Services',
  ],
  roles: [
    'C-Level (CEO, CTO, CFO)',
    'VP/SVP',
    'Director',
    'Manager',
    'Senior Professional',
    'Entry Level',
    'Student',
    'Self-Employed',
  ],
  companySizes: [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees (Enterprise)',
  ],
  incomeRanges: [
    'Under $25,000',
    '$25,000 - $49,999',
    '$50,000 - $74,999',
    '$75,000 - $99,999',
    '$100,000 - $149,999',
    '$150,000+',
  ],
  devices: ['iOS', 'Android', 'No Preference'],
};
