import { db } from "./storage";
import { 
  workspaces, 
  bots, 
  leads, 
  appointments, 
  chatSessions, 
  chatAnalyticsEvents,
  dailyAnalytics,
  adminUsers,
  workspaceMemberships 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

interface DemoWorkspaceConfig {
  slug: string;
  name: string;
  botType: string;
  botName: string;
  botDescription: string;
  businessProfile: {
    businessName: string;
    type: string;
    location?: string;
    phone?: string;
    email?: string;
    services?: string[];
    [key: string]: any;
  };
  systemPrompt: string;
  theme: {
    primaryColor: string;
    welcomeMessage: string;
  };
  sampleLeads: Array<{
    name: string;
    phone: string;
    email?: string;
    status: string;
    daysAgo: number;
  }>;
  sampleBookings: Array<{
    name: string;
    contact: string;
    email?: string;
    appointmentType: string;
    preferredTime: string;
    status: string;
    daysAgo: number;
  }>;
  sampleConversations: Array<{
    messages: Array<{ role: 'user' | 'bot'; content: string }>;
    daysAgo: number;
    appointmentRequested?: boolean;
  }>;
}

/**
 * DEMO WORKSPACE CONFIGURATIONS
 * 
 * IMPORTANT: Faith House Workspace Architecture
 * ==============================================
 * There are multiple Faith House workspaces in the system:
 * 
 * 1. "faith_house" (CANONICAL) - The primary Faith House workspace
 *    - Used by client login: demo_faith_house (password: demo123)
 *    - Used by admin when viewing "Faith House" in super-admin panel
 *    - Contains real/production-like data for demos
 * 
 * 2. "faith_house_demo" (DEMO RESET TARGET) - Separate demo workspace
 *    - Used by /demo/faith-house public demo page
 *    - Can be reset via /api/admin/demo/faith-house/reset
 *    - Isolated from canonical workspace to allow safe demo resets
 * 
 * The demo_faith_house user's client_id is set to "faith_house" (canonical)
 * so the client dashboard shows the same data as the admin workspace view.
 */
const DEMO_CONFIGS: Record<string, DemoWorkspaceConfig> = {
  faith_house_demo: {
    slug: "faith_house_demo",
    name: "Faith House Sober Living (Demo)",
    botType: "sober_living",
    botName: "Faith House Assistant",
    botDescription: "AI assistant for Faith House sober living facility",
    businessProfile: {
      businessName: "Faith House Sober Living",
      type: "Sober Living Facility",
      location: "Port St. Lucie, FL",
      phone: "(772) 555-1234",
      email: "info@faithhouse.demo",
      services: ["Men's Sober Living", "Peer Support", "12-Step Meetings", "Job Placement Assistance"],
    },
    systemPrompt: "You are Faith House Assistant, a warm and supportive AI helping people find information about sober living accommodations.",
    theme: {
      primaryColor: "#00E5CC",
      welcomeMessage: "Welcome to Faith House! I'm here to help answer your questions about our sober living program.",
    },
    sampleLeads: [
      { name: "Michael Johnson", phone: "(772) 555-0101", email: "michael.j@email.com", status: "new", daysAgo: 1 },
      { name: "David Martinez", phone: "(772) 555-0102", status: "contacted", daysAgo: 3 },
      { name: "James Wilson", phone: "(772) 555-0103", email: "james.w@email.com", status: "qualified", daysAgo: 5 },
      { name: "Robert Brown", phone: "(772) 555-0104", status: "converted", daysAgo: 8 },
      { name: "Thomas Anderson", phone: "(772) 555-0105", email: "t.anderson@email.com", status: "new", daysAgo: 2 },
      { name: "Christopher Lee", phone: "(772) 555-0106", status: "contacted", daysAgo: 12 },
      { name: "Daniel Harris", phone: "(772) 555-0107", email: "d.harris@email.com", status: "qualified", daysAgo: 18 },
      { name: "Matthew Clark", phone: "(772) 555-0108", status: "lost", daysAgo: 25 },
    ],
    sampleBookings: [
      { name: "Michael Johnson", contact: "(772) 555-0101", appointmentType: "tour", preferredTime: "Tomorrow 2pm", status: "new", daysAgo: 1 },
      { name: "James Wilson", contact: "(772) 555-0103", email: "james.w@email.com", appointmentType: "phone_call", preferredTime: "This week", status: "confirmed", daysAgo: 3 },
      { name: "Robert Brown", contact: "(772) 555-0104", appointmentType: "tour", preferredTime: "Monday 10am", status: "completed", daysAgo: 8 },
      { name: "Thomas Anderson", contact: "(772) 555-0105", appointmentType: "tour", preferredTime: "Friday afternoon", status: "new", daysAgo: 2 },
      { name: "Daniel Harris", contact: "(772) 555-0107", appointmentType: "phone_call", preferredTime: "ASAP", status: "confirmed", daysAgo: 15 },
    ],
    sampleConversations: [
      {
        daysAgo: 1,
        appointmentRequested: true,
        messages: [
          { role: 'user', content: "Hi, I'm looking for information about your sober living program." },
          { role: 'bot', content: "Welcome to Faith House! I'm glad you reached out. We offer structured sober living in Port St. Lucie, FL. Are you looking for yourself or a loved one?" },
          { role: 'user', content: "For myself. I just completed a 30-day program and need a safe place to continue recovery." },
          { role: 'bot', content: "That's wonderful that you've completed treatment! Faith House is designed exactly for people in your situation. We provide peer support, 12-step meetings, and job placement assistance. Would you like to schedule a tour?" },
          { role: 'user', content: "Yes, I'd like to see the place. My name is Michael and my number is 772-555-0101" },
          { role: 'bot', content: "Thank you, Michael! I've noted your information. When would be a good time for you to visit?" },
        ],
      },
      {
        daysAgo: 3,
        messages: [
          { role: 'user', content: "How much does it cost to stay at Faith House?" },
          { role: 'bot', content: "Great question! Our weekly rates vary based on room type and amenities. We offer both shared and private rooms. Do you have specific needs or a budget in mind?" },
          { role: 'user', content: "I'm on a tight budget. What's the most affordable option?" },
          { role: 'bot', content: "We understand budget concerns are common during recovery. Our shared rooms are the most affordable option. We also work with some insurance providers and can discuss payment plans. Would you like more details?" },
        ],
      },
      {
        daysAgo: 6,
        appointmentRequested: true,
        messages: [
          { role: 'user', content: "Do you allow visitors?" },
          { role: 'bot', content: "Yes, we have designated visiting hours. Family and approved visitors can come during weekends. We believe support from loved ones is important in recovery." },
          { role: 'user', content: "That's good to know. Can I call to speak with someone?" },
          { role: 'bot', content: "Absolutely! You can call us at (772) 555-1234 or I can arrange for someone to call you. What's your preference?" },
          { role: 'user', content: "Have someone call me please. I'm James, 772-555-0103" },
        ],
      },
      {
        daysAgo: 15,
        messages: [
          { role: 'user', content: "What's the minimum stay requirement?" },
          { role: 'bot', content: "We recommend a minimum of 90 days for the best recovery outcomes. However, we understand everyone's situation is different and can discuss flexible options." },
        ],
      },
      {
        daysAgo: 22,
        messages: [
          { role: 'user', content: "Do you offer job placement help?" },
          { role: 'bot', content: "Yes! Job placement assistance is one of our key services. We partner with local employers who understand recovery and provide resume help, interview coaching, and job leads." },
        ],
      },
    ],
  },

  barber_demo: {
    slug: "barber_demo",
    name: "Elite Cuts Barbershop (Demo)",
    botType: "barber",
    botName: "Elite Cuts Assistant",
    botDescription: "AI assistant for Elite Cuts barbershop",
    businessProfile: {
      businessName: "Elite Cuts Barbershop",
      type: "Barbershop",
      location: "Stuart, FL",
      phone: "(772) 555-2345",
      email: "book@elitecuts.demo",
      services: ["Haircuts", "Beard Trims", "Hot Towel Shaves", "Kids Cuts", "Fades"],
    },
    systemPrompt: "You are the Elite Cuts Assistant, helping customers book appointments and learn about our premium barbershop services.",
    theme: {
      primaryColor: "#F59E0B",
      welcomeMessage: "Welcome to Elite Cuts! Ready to look sharp? Let me help you book your next appointment.",
    },
    sampleLeads: [
      { name: "Jason Miller", phone: "(772) 555-2001", status: "new", daysAgo: 0 },
      { name: "Kevin Wright", phone: "(772) 555-2002", email: "kevin.w@email.com", status: "contacted", daysAgo: 2 },
      { name: "Brandon Taylor", phone: "(772) 555-2003", status: "converted", daysAgo: 4 },
      { name: "Marcus Green", phone: "(772) 555-2004", status: "new", daysAgo: 6 },
      { name: "Derek Johnson", phone: "(772) 555-2005", email: "derek.j@email.com", status: "qualified", daysAgo: 10 },
      { name: "Anthony Davis", phone: "(772) 555-2006", status: "lost", daysAgo: 20 },
    ],
    sampleBookings: [
      { name: "Jason Miller", contact: "(772) 555-2001", appointmentType: "haircut", preferredTime: "Today 3pm", status: "new", daysAgo: 0 },
      { name: "Brandon Taylor", contact: "(772) 555-2003", appointmentType: "haircut", preferredTime: "Saturday 11am", status: "confirmed", daysAgo: 4 },
      { name: "Marcus Green", contact: "(772) 555-2004", appointmentType: "beard_trim", preferredTime: "This week", status: "new", daysAgo: 5 },
      { name: "Derek Johnson", contact: "(772) 555-2005", appointmentType: "haircut", preferredTime: "Wednesday 2pm", status: "completed", daysAgo: 10 },
    ],
    sampleConversations: [
      {
        daysAgo: 0,
        appointmentRequested: true,
        messages: [
          { role: 'user', content: "Hey, can I get a fade today?" },
          { role: 'bot', content: "Hey! We'd love to get you in for a fresh fade. Let me check our availability. What time works best for you today?" },
          { role: 'user', content: "Around 3pm if possible" },
          { role: 'bot', content: "3pm looks open! Can I get your name and phone number to book you in?" },
          { role: 'user', content: "Jason Miller, 772-555-2001" },
          { role: 'bot', content: "Perfect Jason! You're booked for a fade at 3pm today. See you soon!" },
        ],
      },
      {
        daysAgo: 3,
        messages: [
          { role: 'user', content: "How much for a haircut and beard trim?" },
          { role: 'bot', content: "Great combo! Our haircut is $25 and beard trim is $15 - so $40 total for both. We also have a loyalty program where your 10th visit is 50% off!" },
          { role: 'user', content: "Nice, that's reasonable. What are your hours on Saturday?" },
          { role: 'bot', content: "We're open 9am to 6pm on Saturdays. That's our busiest day, so I'd recommend booking ahead. Want me to reserve a spot for you?" },
        ],
      },
      {
        daysAgo: 8,
        messages: [
          { role: 'user', content: "Do you do kids haircuts?" },
          { role: 'bot', content: "Absolutely! Kids cuts are $18 for ages 12 and under. Our barbers are great with kids and we have tablets to keep them entertained!" },
        ],
      },
      {
        daysAgo: 18,
        messages: [
          { role: 'user', content: "Which barber is best for fades?" },
          { role: 'bot', content: "All our barbers are skilled, but Marcus specializes in fades and has 10+ years experience. He's usually booked out a few days so plan ahead if you want him specifically!" },
        ],
      },
    ],
  },

  gym_demo: {
    slug: "gym_demo",
    name: "Iron Peak Fitness (Demo)",
    botType: "gym",
    botName: "Iron Peak Assistant",
    botDescription: "AI assistant for Iron Peak Fitness gym",
    businessProfile: {
      businessName: "Iron Peak Fitness",
      type: "Fitness Center",
      location: "Vero Beach, FL",
      phone: "(772) 555-3456",
      email: "join@ironpeak.demo",
      services: ["24/7 Gym Access", "Personal Training", "Group Classes", "Nutrition Coaching", "Sauna & Recovery"],
    },
    systemPrompt: "You are the Iron Peak Assistant, helping people learn about memberships, classes, and personal training at our premium fitness center.",
    theme: {
      primaryColor: "#EF4444",
      welcomeMessage: "Welcome to Iron Peak Fitness! Ready to crush your fitness goals? Let me help you get started.",
    },
    sampleLeads: [
      { name: "Sarah Thompson", phone: "(772) 555-3001", email: "sarah.t@email.com", status: "new", daysAgo: 1 },
      { name: "Emily Rodriguez", phone: "(772) 555-3002", status: "contacted", daysAgo: 2 },
      { name: "Jessica Chen", phone: "(772) 555-3003", email: "jess.chen@email.com", status: "qualified", daysAgo: 4 },
      { name: "Amanda White", phone: "(772) 555-3004", status: "converted", daysAgo: 7 },
      { name: "Nicole Brown", phone: "(772) 555-3005", status: "new", daysAgo: 9 },
      { name: "Michelle Garcia", phone: "(772) 555-3006", email: "m.garcia@email.com", status: "contacted", daysAgo: 14 },
      { name: "Stephanie Lee", phone: "(772) 555-3007", status: "lost", daysAgo: 28 },
    ],
    sampleBookings: [
      { name: "Sarah Thompson", contact: "(772) 555-3001", email: "sarah.t@email.com", appointmentType: "tour", preferredTime: "Tomorrow 5pm", status: "new", daysAgo: 1 },
      { name: "Jessica Chen", contact: "(772) 555-3003", appointmentType: "consultation", preferredTime: "This Saturday", status: "confirmed", daysAgo: 4 },
      { name: "Amanda White", contact: "(772) 555-3004", appointmentType: "tour", preferredTime: "Monday evening", status: "completed", daysAgo: 7 },
      { name: "Nicole Brown", contact: "(772) 555-3005", appointmentType: "consultation", preferredTime: "Weekday morning", status: "new", daysAgo: 8 },
    ],
    sampleConversations: [
      {
        daysAgo: 1,
        appointmentRequested: true,
        messages: [
          { role: 'user', content: "Hi! What are your membership prices?" },
          { role: 'bot', content: "Hey there! Great question. We have three membership tiers: Basic ($29/mo), Premium ($49/mo with classes), and Elite ($79/mo all-inclusive with PT sessions). Which sounds most interesting to you?" },
          { role: 'user', content: "The Premium one sounds good. What classes do you offer?" },
          { role: 'bot', content: "Premium is our most popular! You get unlimited access to 30+ weekly classes including HIIT, Spin, Yoga, Strength Training, and Boxing. Plus sauna access! Want to come see our facility?" },
          { role: 'user', content: "Yes! I'm Sarah, can I come tomorrow evening?" },
          { role: 'bot', content: "Perfect Sarah! How about 5pm tomorrow? Can I get your phone number to confirm?" },
          { role: 'user', content: "772-555-3001, my email is sarah.t@email.com" },
        ],
      },
      {
        daysAgo: 4,
        messages: [
          { role: 'user', content: "Do you have personal trainers?" },
          { role: 'bot', content: "Absolutely! We have 8 certified personal trainers with specialties ranging from weight loss to bodybuilding to sports performance. First session is complimentary with any membership!" },
          { role: 'user', content: "How much for PT sessions?" },
          { role: 'bot', content: "Individual sessions are $60 each, or you can get packages: 4 sessions for $200 or 10 sessions for $450. Elite members get 2 free sessions per month included!" },
        ],
      },
      {
        daysAgo: 10,
        messages: [
          { role: 'user', content: "What are your hours?" },
          { role: 'bot', content: "We're open 24/7 with keycard access! Staffed hours are 5am-10pm weekdays and 7am-8pm weekends. Classes run during staffed hours." },
        ],
      },
      {
        daysAgo: 20,
        messages: [
          { role: 'user', content: "Is there a pool?" },
          { role: 'bot', content: "We don't have a pool, but we do have a full recovery suite with sauna, steam room, and cold plunge! These are included with Premium and Elite memberships." },
        ],
      },
    ],
  },

  // Paws & Suds Pet Grooming Demo
  demo_paws_suds_grooming_demo: {
    slug: "demo_paws_suds_grooming_demo",
    name: "Paws & Suds Pet Grooming (Demo)",
    botType: "pet_grooming",
    botName: "Paws & Suds Assistant",
    botDescription: "AI assistant for Paws & Suds pet grooming salon",
    businessProfile: {
      businessName: "Paws & Suds Pet Grooming",
      type: "Pet Grooming Salon",
      location: "Stuart, FL",
      phone: "(772) 555-PAWS",
      email: "woof@pawsandsuds.demo",
      services: ["Full Grooming", "Bath & Brush", "Nail Trimming", "De-shedding", "Puppy Intro"],
    },
    systemPrompt: "You are the Paws & Suds Assistant, helping pet owners book grooming appointments.",
    theme: { primaryColor: "#06B6D4", welcomeMessage: "Welcome to Paws & Suds! How can I help with your pet's grooming needs?" },
    sampleLeads: [
      { name: "Sarah Williams", phone: "(772) 555-4001", email: "sarah.w@email.com", status: "new", daysAgo: 1 },
      { name: "Jennifer Lopez", phone: "(772) 555-4002", status: "contacted", daysAgo: 3 },
      { name: "Amanda Chen", phone: "(772) 555-4003", email: "amanda.c@email.com", status: "qualified", daysAgo: 5 },
      { name: "Mike Brown", phone: "(772) 555-4004", status: "converted", daysAgo: 8 },
      { name: "Lisa Martinez", phone: "(772) 555-4005", email: "lisa.m@email.com", status: "new", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "Sarah Williams", contact: "(772) 555-4001", appointmentType: "deshedding", preferredTime: "Saturday 11am", status: "new", daysAgo: 1 },
      { name: "Mike Brown", contact: "(772) 555-4004", appointmentType: "full-grooming", preferredTime: "Friday 9am", status: "confirmed", daysAgo: 3 },
      { name: "Jennifer Lopez", contact: "(772) 555-4002", appointmentType: "puppy-intro", preferredTime: "Tuesday 2pm", status: "new", daysAgo: 2 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "Hi! My Golden Retriever needs a deshedding treatment." },
        { role: 'bot', content: "Hello! We'd love to help with your Golden's shedding. Our deshedding treatment includes a thorough brushout, special shampoo, and blow-dry. When would you like to come in?" },
        { role: 'user', content: "Saturday morning would be great. I'm Sarah, 772-555-4001" },
      ]},
      { daysAgo: 4, messages: [
        { role: 'user', content: "Do you groom cats too?" },
        { role: 'bot', content: "Yes! We have experienced cat groomers. We offer bath and brush, nail trims, and lion cuts for long-haired cats. Would you like to schedule an appointment?" },
      ]},
    ],
  },

  // Coastal Breeze Restaurant Demo
  demo_coastal_breeze: {
    slug: "demo_coastal_breeze",
    name: "Coastal Breeze Restaurant (Demo)",
    botType: "restaurant",
    botName: "Coastal Breeze Host",
    botDescription: "AI host for Coastal Breeze Restaurant",
    businessProfile: {
      businessName: "Coastal Breeze Restaurant",
      type: "Fine Dining Restaurant",
      location: "Jensen Beach, FL",
      phone: "(772) 555-DINE",
      email: "reservations@coastalbreeze.demo",
      services: ["Fine Dining", "Private Events", "Catering", "Wine Selection"],
    },
    systemPrompt: "You are the Coastal Breeze Host, helping guests with reservations and event inquiries.",
    theme: { primaryColor: "#F59E0B", welcomeMessage: "Welcome to Coastal Breeze! May I help you with a reservation?" },
    sampleLeads: [
      { name: "Robert Smith", phone: "(772) 555-5001", email: "robert.s@email.com", status: "new", daysAgo: 1 },
      { name: "Emily Davis", phone: "(772) 555-5002", status: "contacted", daysAgo: 2 },
      { name: "Mark Johnson", phone: "(772) 555-5003", email: "mark.j@email.com", status: "qualified", daysAgo: 4 },
    ],
    sampleBookings: [
      { name: "Robert Smith", contact: "(772) 555-5001", appointmentType: "reservation", preferredTime: "Saturday 7pm", status: "confirmed", daysAgo: 1 },
      { name: "Emily Davis", contact: "(772) 555-5002", appointmentType: "private_event", preferredTime: "Next month", status: "new", daysAgo: 2 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I'd like to make a reservation for our anniversary dinner." },
        { role: 'bot', content: "How wonderful! Congratulations on your anniversary. What date and time works best, and for how many guests?" },
        { role: 'user', content: "Saturday at 7pm, table for 2. I'm Robert, 772-555-5001" },
      ]},
    ],
  },

  // Coastline Auto Care Demo
  demo_coastline_auto: {
    slug: "demo_coastline_auto",
    name: "Coastline Auto Care (Demo)",
    botType: "auto_shop",
    botName: "Coastline Auto Assistant",
    botDescription: "AI assistant for Coastline Auto Care",
    businessProfile: {
      businessName: "Coastline Auto Care",
      type: "Auto Repair Shop",
      location: "Fort Pierce, FL",
      phone: "(772) 555-AUTO",
      email: "service@coastlineauto.demo",
      services: ["Oil Changes", "Brake Service", "Tire Service", "AC Repair", "Diagnostics"],
    },
    systemPrompt: "You are the Coastline Auto Assistant, helping customers schedule auto service appointments.",
    theme: { primaryColor: "#3B82F6", welcomeMessage: "Welcome to Coastline Auto Care! How can we help with your vehicle today?" },
    sampleLeads: [
      { name: "Tom Harris", phone: "(772) 555-6001", email: "tom.h@email.com", status: "new", daysAgo: 1 },
      { name: "Kevin Lee", phone: "(772) 555-6002", status: "contacted", daysAgo: 3 },
      { name: "Chris Martin", phone: "(772) 555-6003", email: "chris.m@email.com", status: "qualified", daysAgo: 5 },
    ],
    sampleBookings: [
      { name: "Tom Harris", contact: "(772) 555-6001", appointmentType: "brake_inspection", preferredTime: "Tomorrow 10am", status: "new", daysAgo: 1 },
      { name: "Kevin Lee", contact: "(772) 555-6002", appointmentType: "oil_change", preferredTime: "This week", status: "confirmed", daysAgo: 2 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "My car is making a grinding noise when I brake." },
        { role: 'bot', content: "That could indicate worn brake pads. We should inspect them right away. When can you bring your vehicle in?" },
        { role: 'user', content: "Tomorrow morning? I'm Tom, 772-555-6001" },
      ]},
    ],
  },

  // Fade Factory Barbershop Demo
  demo_fade_factory: {
    slug: "demo_fade_factory",
    name: "Fade Factory Barbershop (Demo)",
    botType: "barber",
    botName: "Fade Factory Assistant",
    botDescription: "AI assistant for Fade Factory Barbershop",
    businessProfile: {
      businessName: "Fade Factory Barbershop",
      type: "Barbershop",
      location: "Port St. Lucie, FL",
      phone: "(772) 555-FADE",
      email: "cuts@fadefactory.demo",
      services: ["Haircuts", "Fades", "Beard Trims", "Hot Towel Shave", "Kids Cuts"],
    },
    systemPrompt: "You are the Fade Factory Assistant, booking appointments for our barbershop.",
    theme: { primaryColor: "#8B5CF6", welcomeMessage: "Welcome to Fade Factory! Ready for a fresh cut?" },
    sampleLeads: [
      { name: "Jason Miller", phone: "(772) 555-7001", status: "new", daysAgo: 1 },
      { name: "Derek Williams", phone: "(772) 555-7002", email: "derek.w@email.com", status: "contacted", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "Jason Miller", contact: "(772) 555-7001", appointmentType: "haircut", preferredTime: "Today 3pm", status: "confirmed", daysAgo: 0 },
      { name: "Derek Williams", contact: "(772) 555-7002", appointmentType: "beard_trim", preferredTime: "Saturday", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 0, appointmentRequested: true, messages: [
        { role: 'user', content: "Hey, can I get a fade today?" },
        { role: 'bot', content: "Hey! We'd love to get you in for a fresh fade. What time works best?" },
        { role: 'user', content: "3pm? I'm Jason, 772-555-7001" },
      ]},
    ],
  },

  // Ink & Soul Tattoo Demo
  demo_ink_soul: {
    slug: "demo_ink_soul",
    name: "Ink & Soul Tattoo (Demo)",
    botType: "tattoo_studio",
    botName: "Ink & Soul Guide",
    botDescription: "AI guide for Ink & Soul Tattoo Studio",
    businessProfile: {
      businessName: "Ink & Soul Tattoo",
      type: "Tattoo Studio",
      location: "Vero Beach, FL",
      phone: "(772) 555-TATT",
      email: "ink@inkandsoul.demo",
      services: ["Custom Tattoos", "Cover-ups", "Touch-ups", "Consultations"],
    },
    systemPrompt: "You are the Ink & Soul Guide, helping clients book consultations and tattoo appointments.",
    theme: { primaryColor: "#EC4899", welcomeMessage: "Welcome to Ink & Soul! Ready to create something beautiful?" },
    sampleLeads: [
      { name: "Alex Rivera", phone: "(772) 555-8001", email: "alex.r@email.com", status: "new", daysAgo: 1 },
      { name: "Sam Taylor", phone: "(772) 555-8002", status: "contacted", daysAgo: 3 },
    ],
    sampleBookings: [
      { name: "Alex Rivera", contact: "(772) 555-8001", appointmentType: "consultation", preferredTime: "This week", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I want to get a custom sleeve design." },
        { role: 'bot', content: "Awesome! Custom sleeves are our specialty. Let's start with a consultation. When can you come in?" },
        { role: 'user', content: "This week sometime. I'm Alex, 772-555-8001" },
      ]},
    ],
  },

  // Iron Coast Fitness Demo
  demo_iron_coast_fitness: {
    slug: "demo_iron_coast_fitness",
    name: "Iron Coast Fitness (Demo)",
    botType: "gym",
    botName: "Iron Coast Fitness Assistant",
    botDescription: "AI assistant for Iron Coast Fitness",
    businessProfile: {
      businessName: "Iron Coast Fitness",
      type: "Fitness Center",
      location: "Stuart, FL",
      phone: "(772) 555-FIT1",
      email: "join@ironcoast.demo",
      services: ["24/7 Access", "Personal Training", "Group Classes", "Recovery Suite"],
    },
    systemPrompt: "You are the Iron Coast Fitness Assistant, helping people learn about memberships and classes.",
    theme: { primaryColor: "#EF4444", welcomeMessage: "Welcome to Iron Coast Fitness! Ready to get started?" },
    sampleLeads: [
      { name: "Michelle Brown", phone: "(772) 555-9001", email: "michelle.b@email.com", status: "new", daysAgo: 1 },
      { name: "David Garcia", phone: "(772) 555-9002", status: "contacted", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "Michelle Brown", contact: "(772) 555-9001", appointmentType: "tour", preferredTime: "Tomorrow 5pm", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "What are your membership options?" },
        { role: 'bot', content: "We have Basic ($29/mo), Premium ($49/mo with classes), and Elite ($79/mo all-inclusive). Want to tour our facility?" },
        { role: 'user', content: "Yes! I'm Michelle, 772-555-9001" },
      ]},
    ],
  },

  // New Horizons Recovery House Demo
  demo_new_horizons: {
    slug: "demo_new_horizons",
    name: "New Horizons Recovery House (Demo)",
    botType: "sober_living",
    botName: "New Horizons Guide",
    botDescription: "AI guide for New Horizons Women's Recovery House",
    businessProfile: {
      businessName: "New Horizons Recovery House",
      type: "Women's Sober Living",
      location: "Palm City, FL",
      phone: "(772) 555-HOPE",
      email: "info@newhorizons.demo",
      services: ["Women's Sober Living", "Peer Support", "Life Skills Training", "Job Assistance"],
    },
    systemPrompt: "You are the New Horizons Guide, helping women find structured sober living support.",
    theme: { primaryColor: "#10B981", welcomeMessage: "Welcome to New Horizons. We're here to support your recovery journey." },
    sampleLeads: [
      { name: "Jennifer Adams", phone: "(772) 555-1101", email: "jen.a@email.com", status: "new", daysAgo: 1 },
      { name: "Rachel Green", phone: "(772) 555-1102", status: "contacted", daysAgo: 3 },
    ],
    sampleBookings: [
      { name: "Jennifer Adams", contact: "(772) 555-1101", appointmentType: "tour", preferredTime: "This week", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I'm looking for a women's sober living facility." },
        { role: 'bot', content: "Welcome! New Horizons is a supportive women's recovery community. Would you like to schedule a tour?" },
        { role: 'user', content: "Yes please. I'm Jennifer, 772-555-1101" },
      ]},
    ],
  },

  // Premier Properties Real Estate Demo
  demo_premier_properties: {
    slug: "demo_premier_properties",
    name: "Premier Properties Real Estate (Demo)",
    botType: "real_estate",
    botName: "Premier Properties Concierge",
    botDescription: "AI concierge for Premier Properties Real Estate",
    businessProfile: {
      businessName: "Premier Properties",
      type: "Real Estate Agency",
      location: "Treasure Coast, FL",
      phone: "(772) 555-HOME",
      email: "info@premierproperties.demo",
      services: ["Buyer Representation", "Seller Services", "Property Showings", "Home Valuations"],
    },
    systemPrompt: "You are the Premier Properties Concierge, helping buyers and sellers with real estate needs.",
    theme: { primaryColor: "#0EA5E9", welcomeMessage: "Welcome to Premier Properties! How can I help with your real estate needs?" },
    sampleLeads: [
      { name: "John Thompson", phone: "(772) 555-1201", email: "john.t@email.com", status: "new", daysAgo: 1 },
      { name: "Linda Wilson", phone: "(772) 555-1202", status: "contacted", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "John Thompson", contact: "(772) 555-1201", appointmentType: "property_showing", preferredTime: "Saturday 10am", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I'm looking for a 3BR home around $450K." },
        { role: 'bot', content: "Great! We have several beautiful homes in that range. Would you like to schedule some showings?" },
        { role: 'user', content: "Yes, this Saturday. I'm John, 772-555-1201" },
      ]},
    ],
  },

  // Radiance Med Spa Demo
  demo_radiance_medspa: {
    slug: "demo_radiance_medspa",
    name: "Radiance Med Spa (Demo)",
    botType: "med_spa",
    botName: "Radiance Med Spa Concierge",
    botDescription: "AI concierge for Radiance Med Spa",
    businessProfile: {
      businessName: "Radiance Med Spa",
      type: "Medical Spa",
      location: "Jupiter, FL",
      phone: "(772) 555-GLOW",
      email: "beauty@radiancemedspa.demo",
      services: ["Botox", "Fillers", "Facials", "Laser Treatments", "Body Contouring"],
    },
    systemPrompt: "You are the Radiance Med Spa Concierge, helping clients with aesthetic treatment consultations.",
    theme: { primaryColor: "#A855F7", welcomeMessage: "Welcome to Radiance Med Spa! Ready to glow?" },
    sampleLeads: [
      { name: "Victoria Chen", phone: "(772) 555-1301", email: "vic.c@email.com", status: "new", daysAgo: 1 },
      { name: "Ashley Moore", phone: "(772) 555-1302", status: "contacted", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "Victoria Chen", contact: "(772) 555-1301", appointmentType: "consultation", preferredTime: "This week", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I'm interested in Botox for my forehead lines." },
        { role: 'bot', content: "Great choice! We'd love to schedule a consultation to discuss your goals. When works for you?" },
        { role: 'user', content: "This week. I'm Victoria, 772-555-1301" },
      ]},
    ],
  },

  // TC Pro Handyman Demo
  demo_tc_handyman: {
    slug: "demo_tc_handyman",
    name: "TC Pro Handyman (Demo)",
    botType: "home_services",
    botName: "TC Pro Handyman Assistant",
    botDescription: "AI assistant for TC Pro Handyman services",
    businessProfile: {
      businessName: "TC Pro Handyman",
      type: "Handyman Services",
      location: "Treasure Coast, FL",
      phone: "(772) 555-FIXX",
      email: "help@tcprohandyman.demo",
      services: ["Repairs", "Painting", "Plumbing", "Electrical", "General Maintenance"],
    },
    systemPrompt: "You are the TC Pro Handyman Assistant, helping homeowners schedule service appointments.",
    theme: { primaryColor: "#F97316", welcomeMessage: "Welcome to TC Pro Handyman! What can we help fix today?" },
    sampleLeads: [
      { name: "Frank Miller", phone: "(772) 555-1401", email: "frank.m@email.com", status: "new", daysAgo: 1 },
      { name: "Nancy Davis", phone: "(772) 555-1402", status: "contacted", daysAgo: 3 },
    ],
    sampleBookings: [
      { name: "Frank Miller", contact: "(772) 555-1401", appointmentType: "estimate", preferredTime: "Tomorrow", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I need an estimate for painting 3 rooms." },
        { role: 'bot', content: "We'd be happy to provide a free estimate! When can we come take a look?" },
        { role: 'user', content: "Tomorrow works. I'm Frank, 772-555-1401" },
      ]},
    ],
  },

  // Harper & Associates Law Firm Demo
  demo_harper_law: {
    slug: "demo_harper_law",
    name: "Harper & Associates Law Firm (Demo)",
    botType: "law_firm",
    botName: "Harper Law Assistant",
    botDescription: "AI assistant for Harper & Associates personal injury law firm",
    businessProfile: {
      businessName: "Harper & Associates",
      type: "Law Firm",
      location: "Stuart, FL",
      phone: "(772) 555-LAW1",
      email: "consult@harperlaw.demo",
      services: ["Personal Injury", "Auto Accidents", "Workers' Compensation", "Free Consultations"],
    },
    systemPrompt: "You are the Harper Law Assistant, helping potential clients schedule consultations for personal injury cases.",
    theme: { primaryColor: "#1E40AF", welcomeMessage: "Welcome to Harper & Associates. How can we help with your legal matter today?" },
    sampleLeads: [
      { name: "James Patterson", phone: "(772) 555-2001", email: "james.p@email.com", status: "new", daysAgo: 1 },
      { name: "Maria Gonzalez", phone: "(772) 555-2002", status: "contacted", daysAgo: 3 },
      { name: "Robert Chen", phone: "(772) 555-2003", email: "robert.c@email.com", status: "qualified", daysAgo: 5 },
    ],
    sampleBookings: [
      { name: "James Patterson", contact: "(772) 555-2001", appointmentType: "free_consultation", preferredTime: "Tomorrow 10am", status: "new", daysAgo: 1 },
      { name: "Robert Chen", contact: "(772) 555-2003", appointmentType: "case_review", preferredTime: "This week", status: "confirmed", daysAgo: 3 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I was in a car accident last week. The other driver ran a red light." },
        { role: 'bot', content: "I'm sorry to hear about your accident. We handle auto accident cases on contingency - you pay nothing unless we win. Would you like to schedule a free consultation?" },
        { role: 'user', content: "Yes, I'd like to talk to someone. I'm James Patterson, 772-555-2001" },
      ]},
    ],
  },

  // Coastal Smiles Dental Demo
  demo_coastal_smiles: {
    slug: "demo_coastal_smiles",
    name: "Coastal Smiles Dental (Demo)",
    botType: "dental_clinic",
    botName: "Coastal Smiles Assistant",
    botDescription: "AI assistant for Coastal Smiles Dental clinic",
    businessProfile: {
      businessName: "Coastal Smiles Dental",
      type: "Dental Clinic",
      location: "Vero Beach, FL",
      phone: "(772) 555-SMILE",
      email: "smile@coastalsmiles.demo",
      services: ["General Dentistry", "Cosmetic Dentistry", "Invisalign", "Dental Implants", "Emergency Care"],
    },
    systemPrompt: "You are the Coastal Smiles Assistant, helping patients schedule dental appointments and answering insurance questions.",
    theme: { primaryColor: "#0D9488", welcomeMessage: "Welcome to Coastal Smiles! How can we help with your dental care today?" },
    sampleLeads: [
      { name: "Sarah Mitchell", phone: "(772) 555-3001", email: "sarah.m@email.com", status: "new", daysAgo: 1 },
      { name: "Michael Brown", phone: "(772) 555-3002", status: "contacted", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "Sarah Mitchell", contact: "(772) 555-3001", appointmentType: "new_patient_exam", preferredTime: "Next week", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I need to schedule a cleaning. Do you take Delta Dental?" },
        { role: 'bot', content: "Yes, we accept Delta Dental! We're currently accepting new patients. Would you like to schedule a new patient exam and cleaning?" },
        { role: 'user', content: "Yes please. I'm Sarah Mitchell, 772-555-3001" },
      ]},
    ],
  },

  // Palm Resort & Spa Demo
  demo_palm_resort: {
    slug: "demo_palm_resort",
    name: "Palm Resort & Spa (Demo)",
    botType: "boutique_hotel",
    botName: "Palm Resort Concierge",
    botDescription: "AI concierge for Palm Resort & Spa boutique hotel",
    businessProfile: {
      businessName: "Palm Resort & Spa",
      type: "Boutique Hotel",
      location: "Jupiter, FL",
      phone: "(772) 555-STAY",
      email: "reservations@palmresort.demo",
      services: ["Luxury Accommodations", "Full-Service Spa", "Fine Dining", "Private Beach", "Event Venues"],
    },
    systemPrompt: "You are the Palm Resort Concierge, helping guests with room reservations, spa bookings, and event inquiries.",
    theme: { primaryColor: "#854D0E", welcomeMessage: "Welcome to Palm Resort & Spa. How may I assist you with your stay?" },
    sampleLeads: [
      { name: "Elizabeth Taylor", phone: "(772) 555-4001", email: "liz.t@email.com", status: "new", daysAgo: 1 },
      { name: "David Williams", phone: "(772) 555-4002", status: "contacted", daysAgo: 2 },
    ],
    sampleBookings: [
      { name: "Elizabeth Taylor", contact: "(772) 555-4001", appointmentType: "reservation", preferredTime: "Next weekend", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "I'm planning a romantic getaway. Do you have ocean view suites?" },
        { role: 'bot', content: "We have beautiful oceanfront suites with private balconies! Our Romance Package includes champagne, couples spa treatment, and dinner. What dates were you considering?" },
        { role: 'user', content: "Next weekend. I'm Elizabeth Taylor, 772-555-4001" },
      ]},
    ],
  },

  // TC Roofing Pros Demo
  demo_tc_roofing: {
    slug: "demo_tc_roofing",
    name: "TC Roofing Pros (Demo)",
    botType: "roofing",
    botName: "TC Roofing Assistant",
    botDescription: "AI assistant for TC Roofing Pros roofing company",
    businessProfile: {
      businessName: "TC Roofing Pros",
      type: "Roofing Company",
      location: "Port St. Lucie, FL",
      phone: "(772) 555-ROOF",
      email: "estimate@tcroofing.demo",
      services: ["Roof Replacement", "Roof Repairs", "Storm Damage", "Insurance Claims", "Free Inspections"],
    },
    systemPrompt: "You are the TC Roofing Assistant, helping homeowners schedule roof inspections and estimates.",
    theme: { primaryColor: "#DC2626", welcomeMessage: "Welcome to TC Roofing Pros! Need a roof inspection or estimate?" },
    sampleLeads: [
      { name: "Richard Martinez", phone: "(772) 555-5001", email: "rick.m@email.com", status: "new", daysAgo: 1 },
      { name: "Patricia Johnson", phone: "(772) 555-5002", status: "contacted", daysAgo: 2 },
      { name: "Thomas Anderson", phone: "(772) 555-5003", email: "tom.a@email.com", status: "qualified", daysAgo: 4 },
    ],
    sampleBookings: [
      { name: "Richard Martinez", contact: "(772) 555-5001", appointmentType: "free_inspection", preferredTime: "Tomorrow", status: "new", daysAgo: 1 },
      { name: "Thomas Anderson", contact: "(772) 555-5003", appointmentType: "estimate", preferredTime: "This week", status: "confirmed", daysAgo: 3 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "We had a storm last night and I think my roof was damaged." },
        { role: 'bot', content: "I'm sorry to hear that. We offer free storm damage inspections and work directly with insurance companies. Can we schedule someone to come out?" },
        { role: 'user', content: "Yes, as soon as possible. I'm Richard Martinez, 772-555-5001" },
      ]},
    ],
  },

  // Oceanview Gardens Wedding Venue Demo
  demo_oceanview_gardens: {
    slug: "demo_oceanview_gardens",
    name: "Oceanview Gardens Wedding Venue (Demo)",
    botType: "wedding_venue",
    botName: "Oceanview Gardens Coordinator",
    botDescription: "AI coordinator for Oceanview Gardens wedding and event venue",
    businessProfile: {
      businessName: "Oceanview Gardens",
      type: "Wedding Venue",
      location: "Jensen Beach, FL",
      phone: "(772) 555-LOVE",
      email: "events@oceanviewgardens.demo",
      services: ["Wedding Ceremonies", "Receptions", "Bridal Suites", "Catering Packages", "Event Planning"],
    },
    systemPrompt: "You are the Oceanview Gardens Coordinator, helping couples plan their dream wedding and schedule venue tours.",
    theme: { primaryColor: "#BE185D", welcomeMessage: "Welcome to Oceanview Gardens! Planning your special day? Let us help make it magical." },
    sampleLeads: [
      { name: "Amanda & Kevin Smith", phone: "(772) 555-6001", email: "amanda.k@email.com", status: "new", daysAgo: 1 },
      { name: "Jennifer & Michael Davis", phone: "(772) 555-6002", status: "contacted", daysAgo: 3 },
    ],
    sampleBookings: [
      { name: "Amanda & Kevin Smith", contact: "(772) 555-6001", appointmentType: "venue_tour", preferredTime: "Saturday afternoon", status: "new", daysAgo: 1 },
    ],
    sampleConversations: [
      { daysAgo: 1, appointmentRequested: true, messages: [
        { role: 'user', content: "We just got engaged! We're looking for a venue for about 150 guests next spring." },
        { role: 'bot', content: "Congratulations on your engagement! We'd love to host your special day. Our gardens can accommodate up to 200 guests. Would you like to schedule a tour to see our ceremony and reception spaces?" },
        { role: 'user', content: "Yes! We're free Saturday afternoon. I'm Amanda, 772-555-6001" },
      ]},
    ],
  },
};

function getDateDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function getOrCreateDemoUser(): Promise<string> {
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, "demo_admin"))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const hashedPassword = await bcrypt.hash("demo123", 10);
  const [newUser] = await db
    .insert(adminUsers)
    .values({
      username: "demo_admin",
      passwordHash: hashedPassword,
      role: "client_admin",
      mustChangePassword: false,
    })
    .returning();

  return newUser.id;
}

// Demo client login configurations - each demo has unique credentials
export const DEMO_CLIENT_LOGINS: Record<string, { username: string; password: string; businessName: string }> = {
  faith_house_demo: { username: "faithhouse", password: "demo123", businessName: "Faith House Recovery" },
  demo_paws_suds_grooming_demo: { username: "pawssuds", password: "demo123", businessName: "Paws & Suds Grooming" },
  demo_coastal_breeze: { username: "coastalbreeze", password: "demo123", businessName: "Coastal Breeze Grill" },
  demo_coastline_auto: { username: "coastlineauto", password: "demo123", businessName: "Coastline Auto Care" },
  demo_fade_factory: { username: "fadefactory", password: "demo123", businessName: "Fade Factory Barbershop" },
  demo_ink_soul: { username: "inksoul", password: "demo123", businessName: "Ink & Soul Tattoo" },
  demo_iron_coast_fitness: { username: "ironcoast", password: "demo123", businessName: "Iron Coast Fitness" },
  demo_new_horizons: { username: "newhorizons", password: "demo123", businessName: "New Horizons Recovery" },
  demo_premier_properties: { username: "premier", password: "demo123", businessName: "Premier Properties" },
  demo_radiance_medspa: { username: "radiance", password: "demo123", businessName: "Radiance Med Spa" },
  demo_tc_handyman: { username: "tchandyman", password: "demo123", businessName: "TC Pro Handyman" },
  demo_harper_law: { username: "harperlaw", password: "demo123", businessName: "Harper & Associates" },
  demo_coastal_smiles: { username: "coastalsmiles", password: "demo123", businessName: "Coastal Smiles Dental" },
  demo_palm_resort: { username: "palmresort", password: "demo123", businessName: "Palm Resort & Spa" },
  demo_tc_roofing: { username: "tcroofing", password: "demo123", businessName: "TC Roofing Pros" },
  demo_oceanview_gardens: { username: "oceanviewgardens", password: "demo123", businessName: "Oceanview Gardens" },
};

async function getOrCreateDemoClientUser(slug: string): Promise<string> {
  const loginConfig = DEMO_CLIENT_LOGINS[slug];
  if (!loginConfig) {
    // Fall back to the shared demo_admin user
    return getOrCreateDemoUser();
  }

  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, loginConfig.username))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const hashedPassword = await bcrypt.hash(loginConfig.password, 10);
  const [newUser] = await db
    .insert(adminUsers)
    .values({
      username: loginConfig.username,
      passwordHash: hashedPassword,
      role: "client_admin",
      mustChangePassword: false,
    })
    .returning();

  return newUser.id;
}

async function clearDemoWorkspaceData(clientId: string): Promise<void> {
  await db.delete(appointments).where(eq(appointments.clientId, clientId));
  await db.delete(leads).where(eq(leads.clientId, clientId));
  await db.delete(chatAnalyticsEvents).where(eq(chatAnalyticsEvents.clientId, clientId));
  await db.delete(chatSessions).where(eq(chatSessions.clientId, clientId));
  await db.delete(dailyAnalytics).where(eq(dailyAnalytics.clientId, clientId));
}

async function seedDemoWorkspaceData(config: DemoWorkspaceConfig, botId: string): Promise<{
  leads: number;
  bookings: number;
  sessions: number;
}> {
  const clientId = config.slug;
  let leadsCount = 0;
  let bookingsCount = 0;
  let sessionsCount = 0;

  for (const leadData of config.sampleLeads) {
    await db.insert(leads).values({
      clientId,
      botId,
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      status: leadData.status,
      source: "chat",
      priority: leadData.status === "qualified" ? "high" : "medium",
      createdAt: getDateDaysAgo(leadData.daysAgo),
      updatedAt: getDateDaysAgo(leadData.daysAgo),
    });
    leadsCount++;
  }

  for (const bookingData of config.sampleBookings) {
    await db.insert(appointments).values({
      clientId,
      botId,
      name: bookingData.name,
      contact: bookingData.contact,
      email: bookingData.email,
      appointmentType: bookingData.appointmentType,
      preferredTime: bookingData.preferredTime,
      status: bookingData.status,
      createdAt: getDateDaysAgo(bookingData.daysAgo),
    });
    bookingsCount++;
  }

  for (const convData of config.sampleConversations) {
    const sessionId = `demo_session_${nanoid(8)}`;
    
    await db.insert(chatSessions).values({
      sessionId,
      clientId,
      botId,
      startedAt: getDateDaysAgo(convData.daysAgo),
      userMessageCount: convData.messages.filter(m => m.role === 'user').length,
      botMessageCount: convData.messages.filter(m => m.role === 'bot').length,
      totalResponseTimeMs: Math.floor(Math.random() * 2000) + 500,
      appointmentRequested: convData.appointmentRequested || false,
      topics: ["demo"],
    });
    sessionsCount++;

    for (let i = 0; i < convData.messages.length; i++) {
      const msg = convData.messages[i];
      await db.insert(chatAnalyticsEvents).values({
        clientId,
        botId,
        sessionId,
        eventType: "message",
        actor: msg.role === 'user' ? 'user' : 'bot',
        messageContent: msg.content,
        responseTimeMs: msg.role === 'bot' ? Math.floor(Math.random() * 1500) + 300 : null,
        createdAt: getDateDaysAgo(convData.daysAgo),
      });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = getDateDaysAgo(7).toISOString().split('T')[0];
  
  await db.insert(dailyAnalytics).values({
    date: today,
    clientId,
    botId,
    totalConversations: Math.floor(sessionsCount / 2),
    totalMessages: config.sampleConversations.reduce((sum, c) => sum + c.messages.length, 0) / 2,
    userMessages: Math.floor(config.sampleConversations.reduce((sum, c) => sum + c.messages.filter(m => m.role === 'user').length, 0) / 2),
    botMessages: Math.floor(config.sampleConversations.reduce((sum, c) => sum + c.messages.filter(m => m.role === 'bot').length, 0) / 2),
    avgResponseTimeMs: 850,
    appointmentRequests: Math.floor(bookingsCount / 2),
    uniqueUsers: Math.floor(sessionsCount / 2),
  });

  await db.insert(dailyAnalytics).values({
    date: sevenDaysAgo,
    clientId,
    botId,
    totalConversations: Math.ceil(sessionsCount / 2),
    totalMessages: Math.ceil(config.sampleConversations.reduce((sum, c) => sum + c.messages.length, 0) / 2),
    userMessages: Math.ceil(config.sampleConversations.reduce((sum, c) => sum + c.messages.filter(m => m.role === 'user').length, 0) / 2),
    botMessages: Math.ceil(config.sampleConversations.reduce((sum, c) => sum + c.messages.filter(m => m.role === 'bot').length, 0) / 2),
    avgResponseTimeMs: 920,
    appointmentRequests: Math.ceil(bookingsCount / 2),
    uniqueUsers: Math.ceil(sessionsCount / 2),
  });

  return { leads: leadsCount, bookings: bookingsCount, sessions: sessionsCount };
}

export async function seedDemoWorkspace(slug: string): Promise<{
  workspace: any;
  bot: any;
  stats: { leads: number; bookings: number; sessions: number };
}> {
  const config = DEMO_CONFIGS[slug];
  if (!config) {
    throw new Error(`No demo configuration found for slug: ${slug}`);
  }

  // Create individual client user for this demo workspace
  const demoUserId = await getOrCreateDemoClientUser(slug);

  let [existingWorkspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, config.slug))
    .limit(1);

  if (!existingWorkspace) {
    [existingWorkspace] = await db
      .insert(workspaces)
      .values({
        name: config.name,
        slug: config.slug,
        ownerId: demoUserId,
        plan: "pro",
        status: "active",
        isDemo: true,
        settings: {
          timezone: "America/New_York",
          brandColor: config.theme.primaryColor,
        },
      })
      .returning();

    await db.insert(workspaceMemberships).values({
      workspaceId: existingWorkspace.id,
      userId: demoUserId,
      role: "owner",
      status: "active",
    });
  } else if (!existingWorkspace.isDemo) {
    await db
      .update(workspaces)
      .set({ isDemo: true })
      .where(eq(workspaces.id, existingWorkspace.id));
    existingWorkspace.isDemo = true;
  }

  const botId = `${config.slug}_main`;
  let [existingBot] = await db
    .select()
    .from(bots)
    .where(eq(bots.botId, botId))
    .limit(1);

  if (!existingBot) {
    [existingBot] = await db
      .insert(bots)
      .values({
        workspaceId: existingWorkspace.id,
        botId,
        name: config.botName,
        description: config.botDescription,
        botType: config.botType,
        businessProfile: config.businessProfile,
        systemPrompt: config.systemPrompt,
        theme: config.theme,
        status: "active",
        isDemo: true,
      })
      .returning();
  }

  await clearDemoWorkspaceData(config.slug);

  const stats = await seedDemoWorkspaceData(config, botId);

  return {
    workspace: existingWorkspace,
    bot: existingBot,
    stats,
  };
}

export async function resetDemoWorkspace(slug: string): Promise<{
  success: boolean;
  stats: { leads: number; bookings: number; sessions: number };
}> {
  const config = DEMO_CONFIGS[slug];
  if (!config) {
    throw new Error(`No demo configuration found for slug: ${slug}`);
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.slug, slug), eq(workspaces.isDemo, true)))
    .limit(1);

  if (!workspace) {
    throw new Error(`Demo workspace not found: ${slug}`);
  }

  const botId = `${slug}_main`;
  
  await clearDemoWorkspaceData(slug);

  const stats = await seedDemoWorkspaceData(config, botId);

  return { success: true, stats };
}

export async function seedAllDemoWorkspaces(): Promise<{
  seeded: string[];
  errors: string[];
}> {
  const seeded: string[] = [];
  const errors: string[] = [];

  for (const slug of Object.keys(DEMO_CONFIGS)) {
    try {
      await seedDemoWorkspace(slug);
      seeded.push(slug);
      console.log(`Seeded demo workspace: ${slug}`);
    } catch (error) {
      console.error(`Failed to seed ${slug}:`, error);
      errors.push(`${slug}: ${(error as Error).message}`);
    }
  }

  return { seeded, errors };
}

export function getDemoSlugs(): string[] {
  return Object.keys(DEMO_CONFIGS);
}

export function getDemoConfig(slug: string): DemoWorkspaceConfig | undefined {
  return DEMO_CONFIGS[slug];
}
