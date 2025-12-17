/**
 * Industry Templates Configuration
 * 
 * Each industry template contains:
 * - bookingProfile: How bookings work (internal/external, CTAs)
 * - ctaButtons: Quick action buttons for the widget
 * - disclaimer: Industry-specific safety text
 * - defaultConfig: Pre-filled configuration for new bots
 */

export interface BookingProfile {
  mode: 'internal' | 'external';
  primaryCTA: 'tour' | 'consult' | 'book' | 'reserve' | 'estimate' | 'call';
  secondaryCTA?: string;
  externalProviders?: string[]; // Common booking providers for this industry
  failsafeEnabled: boolean; // If external URL missing/invalid, fallback to internal
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
  category?: string;
  bookingUrl?: string;
  active: boolean;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  botType: string;
  icon: string; // Lucide icon name
  description: string;
  bookingProfile: BookingProfile;
  ctaButtons: Array<{
    id: string;
    label: string;
    prompt: string;
    isPrimary?: boolean;
  }>;
  disclaimer: string;
  servicesCatalog?: ServiceCatalogItem[]; // Default services for Quick Book
  defaultConfig: {
    businessProfile: {
      type: string;
      services: string[];
    };
    systemPromptIntro: string;
    faqs: Array<{ question: string; answer: string }>;
    personality: {
      tone: 'professional' | 'friendly' | 'casual' | 'compassionate' | 'informative';
      formality: number;
    };
    theme: {
      primaryColor: string;
      welcomeMessage: string;
    };
  };
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  sober_living: {
    id: 'sober_living',
    name: 'Sober Living / Recovery',
    botType: 'sober_living',
    icon: 'Heart',
    description: 'AI assistant for sober living facilities and recovery homes',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'tour',
      secondaryCTA: 'call',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'tour', label: 'Schedule Tour', prompt: 'I would like to schedule a tour of your facility.', isPrimary: true },
      { id: 'call', label: 'Request Call', prompt: 'I would like someone to call me to discuss your program.' },
      { id: 'availability', label: 'Check Availability', prompt: 'Do you have any beds available right now?' },
      { id: 'cost', label: 'Pricing Info', prompt: 'What are your rates and payment options?' },
    ],
    disclaimer: `HEALTHCARE/RECOVERY DISCLAIMER:
- This AI cannot provide medical advice or treatment recommendations
- For emergencies or crisis situations, call 911 or a crisis hotline
- All admissions require in-person assessment by qualified staff
- Information provided is general and not a substitute for professional evaluation`,
    defaultConfig: {
      businessProfile: {
        type: 'Sober Living Facility',
        services: ['Sober Living', 'Peer Support', '12-Step Meetings', 'Case Management', 'Life Skills Training'],
      },
      systemPromptIntro: 'You are a compassionate AI assistant for a sober living facility. You help individuals and families learn about recovery housing options with warmth and understanding.',
      faqs: [
        { question: 'What is sober living?', answer: 'Sober living is a supportive, substance-free living environment for individuals in recovery. We provide structure, accountability, and community support.' },
        { question: 'Do you accept insurance?', answer: 'We work with various payment options. Please contact us directly to discuss your specific situation and available options.' },
        { question: 'What are the house rules?', answer: 'Our house rules include maintaining sobriety, participating in house meetings, completing chores, and respecting quiet hours. Full details are provided during your tour.' },
      ],
      personality: { tone: 'compassionate', formality: 40 },
      theme: { primaryColor: '#00E5CC', welcomeMessage: 'Welcome! I\'m here to help answer your questions about our recovery program.' },
    },
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant / Food Service',
    botType: 'restaurant',
    icon: 'UtensilsCrossed',
    description: 'AI assistant for restaurants, cafes, and food service businesses',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'reserve',
      externalProviders: ['OpenTable', 'Resy', 'Yelp Reservations', 'SevenRooms'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'reserve', label: 'Make Reservation', prompt: 'I would like to make a reservation.', isPrimary: true },
      { id: 'menu', label: 'View Menu', prompt: 'Can I see your menu?' },
      { id: 'hours', label: 'Hours & Location', prompt: 'What are your hours and where are you located?' },
      { id: 'catering', label: 'Catering Inquiry', prompt: 'I\'m interested in catering for an event.' },
    ],
    disclaimer: `FOOD SERVICE DISCLAIMER:
- Menu items and prices subject to change
- Allergy information should be verified with staff before ordering
- We cannot guarantee allergen-free preparation environments
- Reservations are subject to availability`,
    defaultConfig: {
      businessProfile: {
        type: 'Restaurant',
        services: ['Dine-In', 'Takeout', 'Catering', 'Private Events'],
      },
      systemPromptIntro: 'You are a friendly AI assistant for a restaurant. You help guests with reservations, menu questions, and provide information about the dining experience.',
      faqs: [
        { question: 'Do you take reservations?', answer: 'Yes! We recommend reservations, especially for weekend evenings. You can book through our reservation system.' },
        { question: 'Do you accommodate dietary restrictions?', answer: 'We do our best to accommodate dietary needs. Please let your server know about any allergies or restrictions when you arrive.' },
        { question: 'Is parking available?', answer: 'Please contact us directly for parking information at our location.' },
      ],
      personality: { tone: 'friendly', formality: 30 },
      theme: { primaryColor: '#F59E0B', welcomeMessage: 'Welcome! How can I help you today?' },
    },
  },

  barber: {
    id: 'barber',
    name: 'Barber / Salon',
    botType: 'barber',
    icon: 'Scissors',
    description: 'AI assistant for barbershops, hair salons, and beauty services',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'book',
      externalProviders: ['Square Appointments', 'Booksy', 'Vagaro', 'StyleSeat', 'Schedulicity'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'book', label: 'Book Appointment', prompt: 'I\'d like to book an appointment.', isPrimary: true },
      { id: 'services', label: 'Services & Prices', prompt: 'What services do you offer and what are your prices?' },
      { id: 'walkins', label: 'Walk-Ins?', prompt: 'Do you accept walk-ins?' },
      { id: 'hours', label: 'Hours', prompt: 'What are your hours?' },
      { id: 'addons', label: 'Add-ons', prompt: 'Do you offer add-ons like hot towel, eyebrow trim, or designs?' },
      { id: 'human', label: 'Talk to a Human', prompt: 'Can someone from the shop contact me directly?' },
    ],
    disclaimer: `PERSONAL SERVICES DISCLAIMER:
- Appointment times are estimates and may vary
- Cancellation policies apply - please review before booking
- Prices shown are typical and may vary for specialty styles or add-ons
- Please arrive on time to avoid rescheduling`,
    servicesCatalog: [
      { 
        id: 'classic_fade', 
        name: 'Classic Fade', 
        description: 'Clean fade with precise blend', 
        price: '$30', 
        duration: '30 min',
        category: 'haircuts',
        active: true 
      },
      { 
        id: 'signature_haircut', 
        name: 'Signature Haircut', 
        description: 'Precision cut with hot towel finish', 
        price: '$35', 
        duration: '45 min',
        category: 'haircuts',
        active: true 
      },
      { 
        id: 'beard_trim', 
        name: 'Beard Trim & Shape', 
        description: 'Expert beard shaping and lineup', 
        price: '$20', 
        duration: '20 min',
        category: 'beard',
        active: true 
      },
      { 
        id: 'hot_towel_shave', 
        name: 'Hot Towel Shave', 
        description: 'Traditional straight razor shave with hot towels', 
        price: '$40', 
        duration: '45 min',
        category: 'shaves',
        active: true 
      },
      { 
        id: 'haircut_beard_combo', 
        name: 'Haircut + Beard Combo', 
        description: 'Full haircut plus beard trim - the complete package', 
        price: '$50', 
        duration: '1 hour',
        category: 'combos',
        active: true 
      },
      { 
        id: 'kids_cut', 
        name: 'Kids Cut (12 & Under)', 
        description: 'Patient, kid-friendly haircuts', 
        price: '$22', 
        duration: '30 min',
        category: 'haircuts',
        active: true 
      },
    ],
    defaultConfig: {
      businessProfile: {
        type: 'Barbershop',
        services: ['Haircuts', 'Fades', 'Beard Trims', 'Hot Towel Shave', 'Kids Cuts'],
      },
      systemPromptIntro: 'You are a friendly AI assistant for a barbershop. You help clients book appointments and answer questions about services.',
      faqs: [
        { question: 'How long does a haircut take?', answer: 'Most cuts run 30-45 minutes. Fades and combo services usually take 45-60 minutes depending on the style.' },
        { question: 'Do I need an appointment?', answer: 'Walk-ins are welcome when available, but booking an appointment is the best way to lock in your preferred time.' },
        { question: 'What forms of payment do you accept?', answer: 'We accept cash, credit/debit cards, and most mobile payment options.' },
        { question: 'What is your cancellation / no-show policy?', answer: 'We ask for notice if you need to cancel or reschedule. No-shows may be subject to a fee depending on the service.' },
        { question: 'What if I am running late?', answer: 'If you are running late, message us ASAP. We will do our best to fit you in, but we may need to adjust the service or reschedule.' },
        { question: 'Can I request a specific barber or stylist?', answer: 'Yes — you can request a specific barber/stylist, or choose Any available to get the soonest opening.' },
      ],
      personality: { tone: 'casual', formality: 20 },
      theme: { primaryColor: '#8B5CF6', welcomeMessage: 'Hey! Ready for a fresh cut? Let me help you out.' },
    },
  },

  auto: {
    id: 'auto',
    name: 'Auto Repair / Service',
    botType: 'auto',
    icon: 'Car',
    description: 'AI assistant for auto repair shops and service centers',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'estimate',
      secondaryCTA: 'book',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'estimate', label: 'Get Estimate', prompt: 'I need an estimate for auto repair.', isPrimary: true },
      { id: 'book', label: 'Schedule Service', prompt: 'I\'d like to schedule a service appointment.' },
      { id: 'status', label: 'Check Status', prompt: 'I\'d like to check on the status of my vehicle.' },
      { id: 'hours', label: 'Hours & Location', prompt: 'What are your hours and where are you located?' },
    ],
    disclaimer: `AUTO SERVICE DISCLAIMER:
- Estimates are preliminary and may change upon inspection
- Actual repair costs depend on parts availability and condition
- All repairs require customer authorization
- We recommend professional inspection for all safety-related concerns`,
    defaultConfig: {
      businessProfile: {
        type: 'Auto Repair Shop',
        services: ['Oil Changes', 'Brake Service', 'Engine Repair', 'Diagnostics', 'Tire Service', 'A/C Service'],
      },
      systemPromptIntro: 'You are a helpful AI assistant for an auto repair shop. You help customers schedule service appointments and answer questions about automotive repairs.',
      faqs: [
        { question: 'How long does an oil change take?', answer: 'A standard oil change typically takes 20-30 minutes. We can also perform a multi-point inspection while we\'re at it.' },
        { question: 'Do you offer free estimates?', answer: 'Yes, we offer free estimates for most services. Some diagnostic work may require a fee that goes toward the repair if you proceed.' },
        { question: 'Do you work on all makes and models?', answer: 'We service most domestic and foreign vehicles. Please let us know your make and model for confirmation.' },
      ],
      personality: { tone: 'professional', formality: 50 },
      theme: { primaryColor: '#EF4444', welcomeMessage: 'Welcome! How can we help with your vehicle today?' },
    },
  },

  home_services: {
    id: 'home_services',
    name: 'Home Services / Handyman',
    botType: 'home_services',
    icon: 'Wrench',
    description: 'AI assistant for home repair, handyman, and contractor services',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'estimate',
      secondaryCTA: 'call',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'estimate', label: 'Free Estimate', prompt: 'I\'d like to get a free estimate.', isPrimary: true },
      { id: 'call', label: 'Request Callback', prompt: 'Please have someone call me about a project.' },
      { id: 'services', label: 'Services', prompt: 'What services do you offer?' },
      { id: 'emergency', label: 'Emergency?', prompt: 'I have an emergency repair situation.' },
    ],
    disclaimer: `HOME SERVICES DISCLAIMER:
- Estimates are subject to on-site inspection
- Prices may vary based on materials and scope of work
- Permits may be required for certain projects
- Licensed, bonded, and insured - ask for credentials`,
    defaultConfig: {
      businessProfile: {
        type: 'Home Services',
        services: ['Plumbing', 'Electrical', 'Drywall', 'Painting', 'General Repairs', 'Assembly'],
      },
      systemPromptIntro: 'You are a helpful AI assistant for a home services company. You help homeowners schedule estimates and answer questions about repairs and maintenance.',
      faqs: [
        { question: 'Do you offer free estimates?', answer: 'Yes, we offer free estimates for most projects. We\'ll schedule a convenient time to assess your needs.' },
        { question: 'Are you licensed and insured?', answer: 'Absolutely. We are fully licensed, bonded, and insured for your protection.' },
        { question: 'What areas do you serve?', answer: 'We serve the local area and surrounding communities. Let us know your location and we\'ll confirm availability.' },
      ],
      personality: { tone: 'professional', formality: 50 },
      theme: { primaryColor: '#22C55E', welcomeMessage: 'Hi there! What can we help you fix today?' },
    },
  },

  gym: {
    id: 'gym',
    name: 'Gym / Fitness',
    botType: 'gym',
    icon: 'Dumbbell',
    description: 'AI assistant for gyms, fitness centers, and personal trainers',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'tour',
      externalProviders: ['Mindbody', 'WellnessLiving', 'Club OS', 'Zen Planner'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'tour', label: 'Schedule Tour', prompt: 'I\'d like to schedule a tour of your facility.', isPrimary: true },
      { id: 'trial', label: 'Free Trial', prompt: 'Do you offer a free trial?' },
      { id: 'classes', label: 'Class Schedule', prompt: 'What classes do you offer?' },
      { id: 'pricing', label: 'Membership Pricing', prompt: 'What are your membership options and prices?' },
    ],
    disclaimer: `FITNESS DISCLAIMER:
- Consult a physician before starting any exercise program
- Personal training sessions require scheduling
- Membership terms and conditions apply
- Please review cancellation policy before signing`,
    defaultConfig: {
      businessProfile: {
        type: 'Fitness Center',
        services: ['Gym Access', 'Personal Training', 'Group Classes', 'Sauna', 'Nutrition Coaching'],
      },
      systemPromptIntro: 'You are an energetic AI assistant for a fitness center. You help potential members learn about the gym and schedule tours.',
      faqs: [
        { question: 'What are your hours?', answer: 'Please contact us for our current hours of operation, including holiday schedules.' },
        { question: 'Do you offer personal training?', answer: 'Yes! We have certified personal trainers available. Book a complimentary consultation to discuss your goals.' },
        { question: 'Is there a joining fee?', answer: 'We often have promotions with waived or reduced joining fees. Ask about our current specials!' },
      ],
      personality: { tone: 'friendly', formality: 30 },
      theme: { primaryColor: '#F97316', welcomeMessage: 'Hey! Ready to start your fitness journey? Let me help!' },
    },
  },

  real_estate: {
    id: 'real_estate',
    name: 'Real Estate',
    botType: 'real_estate',
    icon: 'Home',
    description: 'AI assistant for real estate agents and property management',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'tour',
      secondaryCTA: 'consult',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'tour', label: 'Schedule Showing', prompt: 'I\'d like to schedule a property showing.', isPrimary: true },
      { id: 'consult', label: 'Free Consultation', prompt: 'I\'d like a free consultation about buying/selling.' },
      { id: 'listings', label: 'View Listings', prompt: 'What properties do you have available?' },
      { id: 'valuation', label: 'Home Valuation', prompt: 'What is my home worth?' },
    ],
    disclaimer: `REAL ESTATE DISCLAIMER:
- Property details and prices subject to change without notice
- All listings should be verified independently
- This is not a binding offer or contract
- Consult with a licensed real estate professional for transactions`,
    defaultConfig: {
      businessProfile: {
        type: 'Real Estate',
        services: ['Buyer Representation', 'Seller Representation', 'Property Management', 'Market Analysis'],
      },
      systemPromptIntro: 'You are a professional AI assistant for a real estate agent. You help clients learn about available properties and schedule showings.',
      faqs: [
        { question: 'What areas do you cover?', answer: 'We specialize in the local market and surrounding areas. Let us know what neighborhoods you\'re interested in!' },
        { question: 'Do you work with first-time buyers?', answer: 'Absolutely! We love helping first-time buyers navigate the process and find their perfect home.' },
        { question: 'How do I get started selling my home?', answer: 'Start with a free home valuation and consultation. We\'ll walk you through the entire process.' },
      ],
      personality: { tone: 'professional', formality: 60 },
      theme: { primaryColor: '#0EA5E9', welcomeMessage: 'Welcome! Looking to buy or sell? I\'m here to help.' },
    },
  },

  med_spa: {
    id: 'med_spa',
    name: 'Med Spa / Aesthetics',
    botType: 'med_spa',
    icon: 'Sparkles',
    description: 'AI assistant for medical spas and aesthetic clinics',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'consult',
      externalProviders: ['PatientPop', 'Acuity', 'Jane App', 'Boulevard'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'consult', label: 'Book Consultation', prompt: 'I\'d like to book a consultation.', isPrimary: true },
      { id: 'treatments', label: 'Treatments', prompt: 'What treatments do you offer?' },
      { id: 'pricing', label: 'Pricing', prompt: 'What are your prices?' },
      { id: 'specials', label: 'Current Specials', prompt: 'Do you have any current specials or promotions?' },
    ],
    disclaimer: `MEDICAL SPA DISCLAIMER:
- This AI cannot provide medical advice
- All treatments require consultation with licensed professionals
- Results vary by individual
- Consult your physician before any medical aesthetic procedure`,
    defaultConfig: {
      businessProfile: {
        type: 'Medical Spa',
        services: ['Botox', 'Fillers', 'Laser Treatments', 'Chemical Peels', 'Microneedling', 'Body Contouring'],
      },
      systemPromptIntro: 'You are an elegant AI assistant for a medical spa. You help clients learn about aesthetic treatments and book consultations.',
      faqs: [
        { question: 'Is Botox painful?', answer: 'Most clients describe minimal discomfort, similar to a small pinch. We offer numbing cream if desired.' },
        { question: 'How long do results last?', answer: 'Results vary by treatment. Botox typically lasts 3-4 months, while dermal fillers can last 6-18 months.' },
        { question: 'What should I expect at my consultation?', answer: 'During your consultation, our provider will assess your concerns, discuss options, and create a personalized treatment plan.' },
      ],
      personality: { tone: 'professional', formality: 60 },
      theme: { primaryColor: '#EC4899', welcomeMessage: 'Welcome! How can I help you look and feel your best?' },
    },
  },

  tattoo: {
    id: 'tattoo',
    name: 'Tattoo / Piercing',
    botType: 'tattoo',
    icon: 'Palette',
    description: 'AI assistant for tattoo studios and piercing shops',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'consult',
      secondaryCTA: 'book',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'consult', label: 'Request Consultation', prompt: 'I\'d like to schedule a consultation for a tattoo.', isPrimary: true },
      { id: 'book', label: 'Book Appointment', prompt: 'I\'d like to book a tattoo appointment.' },
      { id: 'portfolio', label: 'View Portfolio', prompt: 'Can I see your artists\' portfolios?' },
      { id: 'pricing', label: 'Pricing', prompt: 'What are your prices?' },
    ],
    disclaimer: `TATTOO/PIERCING DISCLAIMER:
- Must be 18+ with valid ID (or 16+ with parent/guardian)
- Deposits are non-refundable but can be applied to rescheduled appointments
- Follow all aftercare instructions provided
- Results may vary based on skin type and aftercare`,
    defaultConfig: {
      businessProfile: {
        type: 'Tattoo Studio',
        services: ['Custom Tattoos', 'Cover-ups', 'Piercings', 'Touch-ups', 'Consultations'],
      },
      systemPromptIntro: 'You are a creative AI assistant for a tattoo studio. You help clients learn about services and schedule consultations.',
      faqs: [
        { question: 'How much does a tattoo cost?', answer: 'Pricing depends on size, detail, and placement. Our shop minimum is typically around $80-100. We provide quotes during consultations.' },
        { question: 'Do I need a consultation first?', answer: 'For custom work, yes. Consultations help us understand your vision and ensure the best result. Walk-ins welcome for smaller pieces!' },
        { question: 'What should I do to prepare?', answer: 'Get good sleep, eat beforehand, stay hydrated, and avoid alcohol 24 hours before. Wear comfortable clothing that allows access to the area.' },
      ],
      personality: { tone: 'casual', formality: 20 },
      theme: { primaryColor: '#6366F1', welcomeMessage: 'Hey! Ready to get some ink? Let\'s chat about your ideas.' },
    },
  },

  law_firm: {
    id: 'law_firm',
    name: 'Law Firm / Legal',
    botType: 'law_firm',
    icon: 'Scale',
    description: 'AI assistant for law firms and legal practices',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'consult',
      secondaryCTA: 'call',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'consult', label: 'Free Consultation', prompt: 'I\'d like to schedule a free consultation.', isPrimary: true },
      { id: 'call', label: 'Request Callback', prompt: 'Please have an attorney call me.' },
      { id: 'areas', label: 'Practice Areas', prompt: 'What areas of law do you practice?' },
      { id: 'fees', label: 'Fees & Payment', prompt: 'What are your fees and payment options?' },
    ],
    disclaimer: `LEGAL DISCLAIMER - CRITICAL:
- This AI is NOT a lawyer and cannot provide legal advice
- Information is for general educational purposes only
- Always consult with a licensed attorney for legal matters
- No attorney-client relationship is formed through this chat
- Confidential information should not be shared in this chat`,
    defaultConfig: {
      businessProfile: {
        type: 'Law Firm',
        services: ['Personal Injury', 'Family Law', 'Criminal Defense', 'Estate Planning', 'Business Law'],
      },
      systemPromptIntro: 'You are a professional AI assistant for a law firm. You help potential clients learn about legal services and schedule consultations. You NEVER provide legal advice.',
      faqs: [
        { question: 'Do you offer free consultations?', answer: 'Yes, we offer free initial consultations for most practice areas. Schedule yours to discuss your case.' },
        { question: 'What areas of law do you practice?', answer: 'We handle various practice areas. Let us know about your situation and we\'ll connect you with the right attorney.' },
        { question: 'How much do you charge?', answer: 'Fees vary by case type. Some cases are handled on contingency (no fee unless we win), others are hourly or flat fee. We\'ll discuss this in your consultation.' },
      ],
      personality: { tone: 'professional', formality: 80 },
      theme: { primaryColor: '#1E293B', welcomeMessage: 'Welcome. How can we assist you with your legal matter today?' },
    },
  },

  dental: {
    id: 'dental',
    name: 'Dental / Orthodontics',
    botType: 'dental',
    icon: 'SmilePlus',
    description: 'AI assistant for dental offices and orthodontic practices',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'book',
      externalProviders: ['Dentrix', 'Open Dental', 'Weave', 'NexHealth'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'book', label: 'Book Appointment', prompt: 'I\'d like to schedule a dental appointment.', isPrimary: true },
      { id: 'emergency', label: 'Emergency?', prompt: 'I have a dental emergency.' },
      { id: 'services', label: 'Services', prompt: 'What dental services do you offer?' },
      { id: 'insurance', label: 'Insurance', prompt: 'What insurance do you accept?' },
    ],
    disclaimer: `DENTAL/MEDICAL DISCLAIMER:
- This AI cannot diagnose conditions or provide medical/dental advice
- For dental emergencies, call our office or visit an emergency room
- Treatment recommendations require in-person examination
- Insurance coverage should be verified with your provider`,
    defaultConfig: {
      businessProfile: {
        type: 'Dental Office',
        services: ['Cleanings', 'Fillings', 'Crowns', 'Root Canals', 'Extractions', 'Teeth Whitening', 'Invisalign'],
      },
      systemPromptIntro: 'You are a friendly AI assistant for a dental office. You help patients schedule appointments and answer general questions about dental services.',
      faqs: [
        { question: 'Do you accept my insurance?', answer: 'We accept most major dental insurance plans. Please provide your insurance information and we\'ll verify your coverage.' },
        { question: 'What should I expect at my first visit?', answer: 'Your first visit includes a comprehensive exam, X-rays, and cleaning. We\'ll discuss any treatment needs and answer your questions.' },
        { question: 'Do you offer payment plans?', answer: 'Yes! We offer flexible payment options and financing through CareCredit. Ask us about affordable payment plans.' },
      ],
      personality: { tone: 'friendly', formality: 50 },
      theme: { primaryColor: '#14B8A6', welcomeMessage: 'Hi there! How can we help you with your dental care today?' },
    },
  },

  hotel: {
    id: 'hotel',
    name: 'Hotel / Hospitality',
    botType: 'hotel',
    icon: 'Building2',
    description: 'AI assistant for hotels, resorts, and vacation rentals',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'reserve',
      externalProviders: ['Booking.com', 'Cloudbeds', 'Little Hotelier', 'Direct Booking'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'reserve', label: 'Book Room', prompt: 'I\'d like to book a room.', isPrimary: true },
      { id: 'availability', label: 'Check Availability', prompt: 'What rooms are available?' },
      { id: 'amenities', label: 'Amenities', prompt: 'What amenities do you offer?' },
      { id: 'location', label: 'Location & Directions', prompt: 'Where are you located and how do I get there?' },
    ],
    disclaimer: `HOSPITALITY DISCLAIMER:
- Rates subject to availability and change
- Cancellation policies apply - review before booking
- Check-in/check-out times must be followed
- Additional fees may apply for certain amenities`,
    defaultConfig: {
      businessProfile: {
        type: 'Hotel',
        services: ['Guest Rooms', 'Pool', 'Restaurant', 'Fitness Center', 'Meeting Rooms', 'Concierge'],
      },
      systemPromptIntro: 'You are a hospitable AI assistant for a hotel. You help guests learn about accommodations and amenities, and assist with booking inquiries.',
      faqs: [
        { question: 'What time is check-in/check-out?', answer: 'Standard check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in or late check-out may be available upon request.' },
        { question: 'Is breakfast included?', answer: 'Breakfast inclusion depends on your rate and package. We offer complimentary breakfast with select rates.' },
        { question: 'Do you allow pets?', answer: 'Please contact us directly regarding our pet policy and any applicable fees.' },
      ],
      personality: { tone: 'professional', formality: 60 },
      theme: { primaryColor: '#7C3AED', welcomeMessage: 'Welcome! How may I assist you with your stay?' },
    },
  },

  roofing: {
    id: 'roofing',
    name: 'Roofing / Contractors',
    botType: 'roofing',
    icon: 'HardHat',
    description: 'AI assistant for roofing companies and general contractors',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'estimate',
      secondaryCTA: 'call',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'estimate', label: 'Free Estimate', prompt: 'I\'d like a free roofing estimate.', isPrimary: true },
      { id: 'call', label: 'Request Callback', prompt: 'Please have someone call me about my roof.' },
      { id: 'emergency', label: 'Emergency Repair', prompt: 'I have a roofing emergency!' },
      { id: 'services', label: 'Services', prompt: 'What roofing services do you offer?' },
    ],
    disclaimer: `CONTRACTOR DISCLAIMER:
- Estimates require on-site inspection
- Final pricing depends on materials and scope
- Permits may be required for certain work
- We are licensed, bonded, and insured`,
    defaultConfig: {
      businessProfile: {
        type: 'Roofing Company',
        services: ['Roof Repair', 'Roof Replacement', 'Inspections', 'Storm Damage', 'Gutters', 'Insurance Claims'],
      },
      systemPromptIntro: 'You are a helpful AI assistant for a roofing company. You help homeowners schedule free estimates and learn about roofing services.',
      faqs: [
        { question: 'Do you offer free estimates?', answer: 'Absolutely! We provide free, no-obligation estimates. We\'ll inspect your roof and provide a detailed quote.' },
        { question: 'Do you work with insurance?', answer: 'Yes, we work with all major insurance companies and can help guide you through the claims process.' },
        { question: 'How long does a roof replacement take?', answer: 'Most roof replacements take 1-3 days depending on size and complexity. We\'ll give you a timeline with your estimate.' },
      ],
      personality: { tone: 'professional', formality: 50 },
      theme: { primaryColor: '#DC2626', welcomeMessage: 'Hi! Need help with your roof? Let\'s get you a free estimate.' },
    },
  },

  wedding: {
    id: 'wedding',
    name: 'Wedding / Events',
    botType: 'wedding',
    icon: 'Heart',
    description: 'AI assistant for wedding venues, planners, and event spaces',
    bookingProfile: {
      mode: 'internal',
      primaryCTA: 'tour',
      secondaryCTA: 'consult',
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'tour', label: 'Schedule Tour', prompt: 'I\'d like to schedule a venue tour.', isPrimary: true },
      { id: 'consult', label: 'Planning Consultation', prompt: 'I\'d like a wedding planning consultation.' },
      { id: 'availability', label: 'Check Date', prompt: 'Is my date available?' },
      { id: 'packages', label: 'Packages & Pricing', prompt: 'What packages do you offer?' },
    ],
    disclaimer: `EVENTS DISCLAIMER:
- Dates are subject to availability
- Deposits are required to secure dates
- Review contract terms carefully before signing
- Prices may vary based on guest count and selections`,
    defaultConfig: {
      businessProfile: {
        type: 'Wedding Venue',
        services: ['Venue Rental', 'Catering', 'Event Planning', 'Decor', 'Photography Coordination'],
      },
      systemPromptIntro: 'You are an elegant AI assistant for a wedding venue. You help couples learn about the venue and schedule tours for their special day.',
      faqs: [
        { question: 'What is your capacity?', answer: 'Our venue can accommodate various party sizes. Let us know your estimated guest count and we\'ll discuss options.' },
        { question: 'Do you have a preferred vendor list?', answer: 'Yes, we work with trusted vendors but you\'re welcome to bring your own. We\'ll share our vendor list during your tour.' },
        { question: 'What is included in the rental?', answer: 'Our packages include venue rental, tables, chairs, and basic setup. Additional services and upgrades are available.' },
      ],
      personality: { tone: 'friendly', formality: 50 },
      theme: { primaryColor: '#F472B6', welcomeMessage: 'Congratulations on your engagement! How can I help plan your special day?' },
    },
  },

  pet_grooming: {
    id: 'pet_grooming',
    name: 'Pet Grooming / Veterinary',
    botType: 'pet_grooming',
    icon: 'PawPrint',
    description: 'AI assistant for pet groomers, veterinarians, and pet services',
    bookingProfile: {
      mode: 'external',
      primaryCTA: 'book',
      externalProviders: ['Gingr', 'DaySmart', 'PetExec', 'Groomer.io'],
      failsafeEnabled: true,
    },
    ctaButtons: [
      { id: 'book', label: 'Book Grooming', prompt: 'I\'d like to book a grooming appointment.', isPrimary: true },
      { id: 'services', label: 'Services & Prices', prompt: 'What grooming services do you offer?' },
      { id: 'new', label: 'New Pet Visit', prompt: 'This is my pet\'s first visit.' },
      { id: 'hours', label: 'Hours', prompt: 'What are your hours?' },
    ],
    disclaimer: `PET SERVICES DISCLAIMER:
- Pets must be up-to-date on vaccinations
- Additional charges may apply for matted coats or behavioral issues
- We reserve the right to refuse service for aggressive pets
- Appointment times are estimates`,
    defaultConfig: {
      businessProfile: {
        type: 'Pet Grooming',
        services: ['Full Groom', 'Bath & Brush', 'Nail Trim', 'Ear Cleaning', 'De-shedding', 'Puppy Cuts'],
      },
      systemPromptIntro: 'You are a friendly AI assistant for a pet grooming salon. You help pet parents book appointments and learn about grooming services.',
      faqs: [
        { question: 'How often should I bring my dog in?', answer: 'Most dogs benefit from grooming every 4-8 weeks, depending on breed and coat type.' },
        { question: 'Do I need to stay during the appointment?', answer: 'You can drop off your pet and we\'ll call when they\'re ready! Appointments typically take 1.5-3 hours depending on services.' },
        { question: 'What if my dog is nervous?', answer: 'Our groomers are experienced with anxious pets. Let us know about any concerns and we\'ll take extra care to keep your pet comfortable.' },
      ],
      personality: { tone: 'friendly', formality: 30 },
      theme: { primaryColor: '#06B6D4', welcomeMessage: 'Woof! Ready to pamper your furry friend? Let\'s book an appointment!' },
    },
  },
};

/**
 * Get template by industry ID
 */
export function getIndustryTemplate(industryId: string): IndustryTemplate | null {
  return INDUSTRY_TEMPLATES[industryId] || null;
}

/**
 * Get all industry templates as array
 */
export function getAllIndustryTemplates(): IndustryTemplate[] {
  return Object.values(INDUSTRY_TEMPLATES);
}

/**
 * Suggest industry based on business name or description
 */
export function suggestIndustry(businessName: string, description?: string): string[] {
  const text = `${businessName} ${description || ''}`.toLowerCase();
  const suggestions: string[] = [];
  
  const keywords: Record<string, string[]> = {
    sober_living: ['sober', 'recovery', 'rehab', 'addiction', 'treatment', 'halfway'],
    restaurant: ['restaurant', 'cafe', 'diner', 'bistro', 'eatery', 'grill', 'kitchen', 'food'],
    barber: ['barber', 'salon', 'hair', 'beauty', 'cuts', 'fade', 'stylist'],
    auto: ['auto', 'car', 'mechanic', 'repair', 'garage', 'tire', 'brake', 'oil change'],
    home_services: ['handyman', 'plumber', 'plumbing', 'electric', 'hvac', 'repair', 'contractor', 'home'],
    gym: ['gym', 'fitness', 'workout', 'training', 'crossfit', 'yoga', 'pilates', 'athletic'],
    real_estate: ['real estate', 'realty', 'property', 'homes', 'realtor', 'agent', 'broker'],
    med_spa: ['med spa', 'medspa', 'botox', 'aesthet', 'laser', 'skin', 'facial', 'beauty clinic'],
    tattoo: ['tattoo', 'ink', 'piercing', 'body art'],
    law_firm: ['law', 'legal', 'attorney', 'lawyer', 'firm', 'counsel'],
    dental: ['dental', 'dentist', 'orthodont', 'teeth', 'oral', 'smile'],
    hotel: ['hotel', 'resort', 'inn', 'lodging', 'motel', 'bed and breakfast', 'vacation rental'],
    roofing: ['roof', 'roofing', 'contractor', 'shingle', 'gutter'],
    wedding: ['wedding', 'event', 'venue', 'reception', 'banquet', 'catering'],
    pet_grooming: ['pet', 'groom', 'dog', 'cat', 'vet', 'animal', 'paw'],
  };
  
  for (const [industry, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      suggestions.push(industry);
    }
  }
  
  return suggestions;
}

/**
 * Get CTA label based on primary CTA type
 */
export function getCTALabel(cta: BookingProfile['primaryCTA']): string {
  const labels: Record<BookingProfile['primaryCTA'], string> = {
    tour: 'Schedule Tour',
    consult: 'Book Consultation',
    book: 'Book Appointment',
    reserve: 'Make Reservation',
    estimate: 'Get Free Estimate',
    call: 'Request Callback',
  };
  return labels[cta];
}
