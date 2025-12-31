export interface Client {
  id: string;
  name: string;
  type?: string;
  status: string;
  bots?: string[];
  slug?: string;
  plan?: string;
  botsCount?: number;
  totalConversations?: number;
  lastActive?: string | null;
}

export interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  status?: 'active' | 'paused' | 'demo';
  metadata?: {
    isDemo?: boolean;
    isTemplate?: boolean;
    templateCategory?: string;
    clonedFrom?: string;
    createdAt?: string;
    version?: string;
  };
  businessProfile: {
    businessName: string;
    type: string;
    phone?: string;
    email?: string;
    website?: string;
    location?: string;
    hours?: Record<string, string>;
    services?: string[];
    amenities?: string[];
    serviceArea?: string;
    cuisine?: string;
    membershipOptions?: string[];
    booking?: {
      onlineBookingUrl?: string;
      walkInsWelcome?: boolean;
      walkInsNote?: string;
    };
  };
  rules?: {
    allowedTopics?: string[];
    forbiddenTopics?: string[];
    specialInstructions?: string[];
    crisisHandling?: {
      onCrisisKeywords?: string[];
      responseTemplate?: string;
    };
  };
  systemPrompt?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

export interface Template extends BotConfig {
  metadata: NonNullable<BotConfig['metadata']> & {
    isTemplate: true;
    templateCategory: string;
  };
}

export interface Workspace {
  id: string | number;
  name: string;
  slug: string;
  plan?: string;
  status?: string;
  billingEmail?: string;
  createdAt?: string;
}

export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'barber', label: 'Barber / Salon' },
  { value: 'auto', label: 'Auto Shop' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'sober_living', label: 'Sober Living' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'tattoo', label: 'Tattoo Studio' },
];

export function formatHoursForDisplay(hours?: Record<string, string>): string {
  if (!hours) return '';
  return Object.entries(hours)
    .map(([day, time]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`)
    .join('\n');
}

export function parseHoursFromString(hoursStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!hoursStr) return result;
  const lines = hoursStr.split('\n').map(s => s.trim()).filter(Boolean);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const day = line.substring(0, colonIdx).trim().toLowerCase();
      const time = line.substring(colonIdx + 1).trim();
      if (day && time) result[day] = time;
    }
  }
  return result;
}
