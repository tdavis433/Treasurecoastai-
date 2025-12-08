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

  const demoUserId = await getOrCreateDemoUser();

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
