/**
 * Demo Template Configurations
 * 
 * Canonical source of truth for all demo templates used by:
 * - server/demoSeed.ts (for seeding demo workspaces)
 * - scripts/template-readiness-check.ts (for validation)
 * 
 * This file contains only the template definitions without database dependencies.
 */

export interface DemoTemplateConfig {
  slug: string;
  businessName: string;
  businessType: string;
  location?: string;
  phone?: string;
  email?: string;
  services: string[];
  about: string;
  faqs?: Array<{ question: string; answer: string }>;
  operatingHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      monday: { open: string; close: string; enabled: boolean };
      tuesday: { open: string; close: string; enabled: boolean };
      wednesday: { open: string; close: string; enabled: boolean };
      thursday: { open: string; close: string; enabled: boolean };
      friday: { open: string; close: string; enabled: boolean };
      saturday: { open: string; close: string; enabled: boolean };
      sunday: { open: string; close: string; enabled: boolean };
    };
    afterHoursMessage: string;
  };
  safetySettings?: {
    crisisGuidanceEnabled?: boolean;
    crisisHotline?: string;
    emergencyMessage?: string;
  };
  externalBooking?: {
    mode: 'internal' | 'external';
    url?: string;
    providerName?: string;
  };
  theme: {
    primaryColor: string;
    welcomeMessage: string;
  };
}

const DEFAULT_OPERATING_HOURS: DemoTemplateConfig['operatingHours'] = {
  enabled: true,
  timezone: 'America/New_York',
  schedule: {
    monday: { open: '09:00', close: '17:00', enabled: true },
    tuesday: { open: '09:00', close: '17:00', enabled: true },
    wednesday: { open: '09:00', close: '17:00', enabled: true },
    thursday: { open: '09:00', close: '17:00', enabled: true },
    friday: { open: '09:00', close: '17:00', enabled: true },
    saturday: { open: '10:00', close: '14:00', enabled: true },
    sunday: { open: '00:00', close: '00:00', enabled: false },
  },
  afterHoursMessage: 'We are currently closed. Leave a message and we will get back to you.',
};

export const DEMO_TEMPLATE_CONFIGS: Record<string, DemoTemplateConfig> = {
  'faith-house': {
    slug: 'faith-house',
    businessName: 'Faith House',
    businessType: 'sober_living',
    location: 'Port St. Lucie, FL',
    phone: '(772) 555-1234',
    email: 'info@faithhouse.demo',
    services: ["Men's Sober Living", "Peer Support", "12-Step Meetings", "Job Placement Assistance", "Case Management", "Life Skills Training"],
    about: "Faith House is a trusted sober living facility in Port St. Lucie, FL, dedicated to providing a safe, supportive environment for men in recovery. We offer structured living with peer support, 12-step meetings, and job placement assistance.",
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    safetySettings: {
      crisisGuidanceEnabled: true,
      crisisHotline: '988',
      emergencyMessage: 'If you are experiencing a mental health crisis or thoughts of self-harm, please call 988 (Suicide & Crisis Lifeline) or 911 immediately.',
    },
    theme: { primaryColor: '#00E5CC', welcomeMessage: "Welcome to Faith House! I'm here to help answer your questions about our sober living program." },
  },
  'paws-suds': {
    slug: 'paws-suds',
    businessName: 'Paws & Suds',
    businessType: 'grooming',
    location: 'Stuart, FL',
    phone: '(772) 555-PAWS',
    email: 'woof@pawsandsuds.demo',
    services: ['Full Grooming', 'Bath & Brush', 'Nail Trimming', 'De-shedding', 'Puppy Intro', 'Teeth Cleaning'],
    about: 'Professional pet grooming services for dogs and cats in Stuart, FL. Our experienced groomers provide gentle care for your furry family members.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#06B6D4', welcomeMessage: "Welcome to Paws & Suds! How can I help with your pet's grooming needs?" },
  },
  'harper-law': {
    slug: 'harper-law',
    businessName: 'Harper Law Firm',
    businessType: 'law_firm',
    location: 'Fort Pierce, FL',
    phone: '(772) 555-5678',
    email: 'contact@harperlaw.demo',
    services: ['Personal Injury', 'Family Law', 'Criminal Defense', 'Estate Planning', 'Business Law', 'Free Consultation'],
    about: 'Harper Law Firm provides dedicated legal representation with a focus on personal injury and family law matters. We offer free initial consultations to discuss your case.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#6366F1', welcomeMessage: 'Welcome to Harper Law Firm. How can we help you today?' },
  },
  'coastal-smiles': {
    slug: 'coastal-smiles',
    businessName: 'Coastal Smiles Dental',
    businessType: 'dental',
    location: 'Jensen Beach, FL',
    phone: '(772) 555-DENT',
    email: 'smile@coastalsmiles.demo',
    services: ['General Dentistry', 'Teeth Cleaning', 'Cosmetic Dentistry', 'Dental Implants', 'Orthodontics', 'Emergency Care'],
    about: 'Coastal Smiles Dental offers comprehensive dental care for the whole family. From routine cleanings to advanced cosmetic procedures, we are committed to your oral health.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#10B981', welcomeMessage: 'Welcome to Coastal Smiles Dental! How can we help you today?' },
  },
  'palm-resort': {
    slug: 'palm-resort',
    businessName: 'Palm Resort',
    businessType: 'boutique_hotel',
    location: 'Vero Beach, FL',
    phone: '(772) 555-PALM',
    email: 'reservations@palmresort.demo',
    services: ['Luxury Rooms', 'Pool & Spa', 'Fine Dining', 'Event Spaces', 'Concierge Services', 'Beach Access'],
    about: 'Palm Resort is a boutique beachfront hotel offering luxury accommodations with stunning ocean views and world-class amenities.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS, schedule: { ...DEFAULT_OPERATING_HOURS.schedule, sunday: { open: '09:00', close: '17:00', enabled: true } } },
    theme: { primaryColor: '#F59E0B', welcomeMessage: 'Welcome to Palm Resort! May I help you with a reservation?' },
  },
  'tc-roofing': {
    slug: 'tc-roofing',
    businessName: 'TC Roofing',
    businessType: 'roofing',
    location: 'Port St. Lucie, FL',
    phone: '(772) 555-ROOF',
    email: 'quotes@tcroofing.demo',
    services: ['Roof Inspection', 'Roof Repair', 'New Roof Installation', 'Storm Damage', 'Roof Maintenance', 'Free Estimates'],
    about: 'TC Roofing provides expert roofing services for residential and commercial properties on the Treasure Coast.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#3B82F6', welcomeMessage: 'Welcome to TC Roofing! Need a roof inspection or repair?' },
  },
  'oceanview-gardens': {
    slug: 'oceanview-gardens',
    businessName: 'Oceanview Gardens',
    businessType: 'wedding_venue',
    location: 'Stuart, FL',
    phone: '(772) 555-WEDS',
    email: 'events@oceanviewgardens.demo',
    services: ['Wedding Ceremonies', 'Receptions', 'Rehearsal Dinners', 'Corporate Events', 'Catering', 'Photography'],
    about: 'Oceanview Gardens is an elegant waterfront wedding venue offering stunning ceremony and reception spaces with breathtaking views.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#EC4899', welcomeMessage: 'Welcome to Oceanview Gardens! Planning a special event?' },
  },
  'sunrise-auto': {
    slug: 'sunrise-auto',
    businessName: 'Sunrise Auto',
    businessType: 'auto',
    location: 'Fort Pierce, FL',
    phone: '(772) 555-AUTO',
    email: 'service@sunriseauto.demo',
    services: ['Oil Changes', 'Brake Service', 'Tire Service', 'AC Repair', 'Diagnostics', 'State Inspections'],
    about: 'Sunrise Auto provides honest and reliable auto repair services. Our certified technicians handle everything from routine maintenance to complex repairs.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#3B82F6', welcomeMessage: 'Welcome to Sunrise Auto! How can we help with your vehicle today?' },
  },
  'classic-cuts': {
    slug: 'classic-cuts',
    businessName: 'Classic Cuts Barbershop',
    businessType: 'barber',
    location: 'Stuart, FL',
    phone: '(772) 555-CUTS',
    email: 'book@classiccuts.demo',
    services: ['Haircuts', 'Beard Trims', 'Hot Towel Shaves', 'Kids Cuts', 'Fades', 'Hair Coloring'],
    about: 'Classic Cuts is a premium barbershop delivering expert haircuts and grooming services in a relaxed atmosphere.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    externalBooking: { mode: 'external', url: 'https://square.site/book/example-classic-cuts', providerName: 'Square' },
    theme: { primaryColor: '#F59E0B', welcomeMessage: 'Welcome to Classic Cuts! Ready to look sharp?' },
  },
  'neon-harbor-fitness': {
    slug: 'neon-harbor-fitness',
    businessName: 'Neon Harbor Fitness',
    businessType: 'fitness',
    location: 'Vero Beach, FL',
    phone: '(772) 555-GYMS',
    email: 'join@neonharbor.demo',
    services: ['24/7 Gym Access', 'Personal Training', 'Group Classes', 'Nutrition Coaching', 'Sauna & Recovery', 'Free Trial'],
    about: 'Neon Harbor Fitness is a state-of-the-art gym offering 24/7 access, expert personal training, and a variety of group fitness classes.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#EF4444', welcomeMessage: 'Welcome to Neon Harbor Fitness! Ready to crush your fitness goals?' },
  },
  'blue-harbor-medspa': {
    slug: 'blue-harbor-medspa',
    businessName: 'Blue Harbor MedSpa',
    businessType: 'medspa',
    location: 'Jensen Beach, FL',
    phone: '(772) 555-GLOW',
    email: 'book@blueharbor.demo',
    services: ['Botox', 'Dermal Fillers', 'Facials', 'Laser Treatments', 'Body Contouring', 'Skin Rejuvenation'],
    about: 'Blue Harbor MedSpa offers advanced aesthetic treatments in a luxurious, relaxing environment. Our experienced team is dedicated to helping you look and feel your best.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#8B5CF6', welcomeMessage: 'Welcome to Blue Harbor MedSpa! How can we help you glow today?' },
  },
  'coastal-realty': {
    slug: 'coastal-realty',
    businessName: 'Coastal Realty',
    businessType: 'real_estate',
    location: 'Port St. Lucie, FL',
    phone: '(772) 555-HOME',
    email: 'info@coastalrealty.demo',
    services: ['Buying Assistance', 'Selling Assistance', 'Property Valuation', 'Investment Properties', 'Relocation Services', 'First-Time Buyers'],
    about: 'Coastal Realty helps buyers and sellers navigate the Treasure Coast real estate market with personalized service and local expertise.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#0EA5E9', welcomeMessage: 'Welcome to Coastal Realty! Looking to buy or sell?' },
  },
  'sunset-bistro': {
    slug: 'sunset-bistro',
    businessName: 'Sunset Bistro',
    businessType: 'restaurant',
    location: 'Jensen Beach, FL',
    phone: '(772) 555-DINE',
    email: 'reservations@sunsetbistro.demo',
    services: ['Fine Dining', 'Private Events', 'Catering', 'Wine Selection', 'Outdoor Patio', 'Live Music'],
    about: 'Sunset Bistro offers farm-to-table cuisine with stunning waterfront views. Perfect for romantic dinners, celebrations, and private events.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS, schedule: { ...DEFAULT_OPERATING_HOURS.schedule, sunday: { open: '11:00', close: '21:00', enabled: true } } },
    theme: { primaryColor: '#F59E0B', welcomeMessage: 'Welcome to Sunset Bistro! May I help you with a reservation?' },
  },
  'inkwell-tattoo': {
    slug: 'inkwell-tattoo',
    businessName: 'Inkwell Tattoo',
    businessType: 'tattoo',
    location: 'Fort Pierce, FL',
    phone: '(772) 555-TATS',
    email: 'book@inkwelltattoo.demo',
    services: ['Custom Tattoos', 'Cover-ups', 'Touch-ups', 'Piercings', 'Consultations', 'Flash Art'],
    about: 'Inkwell Tattoo is a professional tattoo studio specializing in custom artwork. Our talented artists work closely with clients to create unique, meaningful pieces.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#1F2937', welcomeMessage: 'Welcome to Inkwell Tattoo! Ready to get inked?' },
  },
  'handy-helpers': {
    slug: 'handy-helpers',
    businessName: 'Handy Helpers',
    businessType: 'handyman',
    location: 'Stuart, FL',
    phone: '(772) 555-HELP',
    email: 'jobs@handyhelpers.demo',
    services: ['Home Repairs', 'Plumbing', 'Electrical', 'Painting', 'Drywall', 'Furniture Assembly'],
    about: 'Handy Helpers provides reliable handyman services for homeowners and businesses. No job is too small!',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    theme: { primaryColor: '#22C55E', welcomeMessage: 'Welcome to Handy Helpers! What can we fix for you today?' },
  },
  'new-horizons': {
    slug: 'new-horizons',
    businessName: 'New Horizons Recovery House',
    businessType: 'sober_living',
    location: 'Vero Beach, FL',
    phone: '(772) 555-HOPE',
    email: 'info@newhorizons.demo',
    services: ['Sober Living', 'Peer Support', '12-Step Meetings', 'Counseling', 'Life Skills', 'Job Assistance'],
    about: 'New Horizons Recovery House provides a supportive and structured environment for individuals in recovery, helping them build a foundation for lasting sobriety.',
    operatingHours: { ...DEFAULT_OPERATING_HOURS },
    safetySettings: {
      crisisGuidanceEnabled: true,
      crisisHotline: '988',
      emergencyMessage: 'If you are experiencing a mental health crisis or thoughts of self-harm, please call 988 (Suicide & Crisis Lifeline) or 911 immediately.',
    },
    theme: { primaryColor: '#14B8A6', welcomeMessage: 'Welcome to New Horizons! We are here to support your recovery journey.' },
  },
};

export function getDemoTemplateConfig(slug: string): DemoTemplateConfig | undefined {
  return DEMO_TEMPLATE_CONFIGS[slug];
}

export function getDemoTemplateSlugs(): string[] {
  return Object.keys(DEMO_TEMPLATE_CONFIGS);
}
