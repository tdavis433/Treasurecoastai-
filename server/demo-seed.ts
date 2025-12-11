/**
 * Demo Seed Script
 * Resets demo workspaces to a clean state and seeds realistic data for presentations
 * 
 * Usage:
 *   npx tsx server/demo-seed.ts
 *   npx tsx server/demo-seed.ts --workspace=faith_house_demo
 *   npx tsx server/demo-seed.ts --seed-only
 */

import { db } from "./storage";
import { leads, appointments, chatSessions, dailyAnalytics, clients, bots, workspaces } from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

// All demo workspace slugs
const DEMO_WORKSPACES = [
  "faith_house_demo",
  "demo_paws_suds_grooming_demo",
  "demo_coastal_breeze",
  "demo_coastline_auto",
  "demo_fade_factory",
  "demo_ink_soul",
  "demo_iron_coast_fitness",
  "demo_new_horizons",
  "demo_premier_properties",
  "demo_radiance_medspa",
  "demo_tc_handyman"
];

// Business-specific first names for realistic leads
const FIRST_NAMES = ["Michael", "Sarah", "James", "Jennifer", "David", "Amanda", "Robert", "Emily", "Christopher", "Jessica", "Daniel", "Ashley", "Matthew", "Stephanie", "Andrew", "Nicole", "Joshua", "Samantha", "Brandon", "Brittany", "William", "Lauren", "Kevin", "Megan", "Brian", "Rachel", "Jason", "Michelle"];
const LAST_INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "W"];

function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
  return `${first} ${last}.`;
}

function randomPhone(): string {
  const areaCodes = ["772", "561", "954", "305", "407", "321"];
  const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const first = Math.floor(Math.random() * 900) + 100;
  const second = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${first}-${second}`;
}

function randomEmail(name: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, ".").replace(/\./g, "");
  return `${cleanName}@example.com`;
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 12) + 8); // 8am - 8pm
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function futureDate(daysAhead: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
  const day = days[Math.floor(Math.random() * days.length)];
  const time = times[Math.floor(Math.random() * times.length)];
  return `${day} at ${time}`;
}

// Business-specific lead configurations
interface BusinessConfig {
  appointmentTypes: string[];
  leadNotes: string[];
  appointmentNotes: string[];
  sources: string[];
}

const BUSINESS_CONFIGS: Record<string, BusinessConfig> = {
  faith_house_demo: {
    appointmentTypes: ["tour", "phone_call", "intake_consultation", "family_info_call"],
    leadNotes: [
      "Interested in touring the facility. Coming from detox program.",
      "Family member inquiring on behalf of son. Asked about costs and insurance.",
      "Currently in outpatient treatment, looking for structured living.",
      "Recently completed 30-day program, seeking transitional housing.",
      "Called about availability and move-in timeline.",
      "Referred by treatment center, ready to transition.",
      "Questions about phase system and house rules.",
      "Inquiring about sober living for brother.",
    ],
    appointmentNotes: [
      "First-time visitor from detox program",
      "Family consultation - discussing options for loved one",
      "Ready to move in, needs intake assessment",
      "Questions about phase system and requirements",
      "Referred by local treatment center",
    ],
    sources: ["chat", "phone", "referral"],
  },
  demo_new_horizons: {
    appointmentTypes: ["tour", "phone_call", "intake_consultation", "family_info_call"],
    leadNotes: [
      "Looking for women's sober living after completing treatment.",
      "Family member seeking information about program structure.",
      "Transitioning from inpatient rehab, needs housing.",
      "Interested in the recovery-focused community.",
      "Questions about employment assistance program.",
      "Referred by therapist, ready for next step.",
    ],
    appointmentNotes: [
      "Tour of women's facility",
      "Intake assessment scheduled",
      "Family information session",
      "Program overview discussion",
    ],
    sources: ["chat", "phone", "referral"],
  },
  demo_paws_suds_grooming_demo: {
    appointmentTypes: ["full_grooming", "bath_brush", "nail_trim", "deshedding", "puppy_intro"],
    leadNotes: [
      "Has a Golden Retriever needing de-shedding treatment.",
      "New puppy owner, interested in puppy introduction grooming.",
      "Regular customer inquiry about cat grooming services.",
      "Asked about special packages for multiple pets.",
      "Senior dog needs gentle grooming approach.",
      "Inquiring about breed-specific cuts for Poodle.",
      "Looking for monthly grooming subscription.",
    ],
    appointmentNotes: [
      "Golden Retriever - heavy shedder, needs full deshedding",
      "12-week-old Goldendoodle - first grooming ever",
      "Standard Poodle - regular client, teddy bear cut",
      "Senior Shih Tzu - gentle handling required",
      "Two cats - siblings, bath and brush",
      "Husky - full deshedding treatment",
    ],
    sources: ["chat", "website", "referral"],
  },
  demo_coastal_breeze: {
    appointmentTypes: ["reservation", "private_event", "catering_inquiry", "table_booking"],
    leadNotes: [
      "Looking to make reservation for anniversary dinner.",
      "Interested in private dining room for corporate event.",
      "Catering inquiry for wedding of 150 guests.",
      "Asked about weekend brunch availability.",
      "Questions about vegetarian and vegan menu options.",
      "Wants to book chef's table experience.",
      "Inquiring about holiday party packages.",
    ],
    appointmentNotes: [
      "Anniversary dinner for 2 - window table requested",
      "Corporate event - 25 guests, private room",
      "Birthday celebration - party of 12",
      "Wine tasting dinner inquiry",
      "Sunday brunch reservation - 6 guests",
    ],
    sources: ["chat", "website", "phone"],
  },
  demo_coastline_auto: {
    appointmentTypes: ["oil_change", "tire_service", "brake_inspection", "full_inspection", "ac_service"],
    leadNotes: [
      "Car making strange noise when braking, needs inspection.",
      "Due for oil change and tire rotation.",
      "AC not blowing cold, needs service.",
      "Check engine light on, requesting diagnostic.",
      "Looking for pre-purchase inspection for used car.",
      "Needs new tires, asking about brands and pricing.",
      "Transmission issues, wants quote for repair.",
    ],
    appointmentNotes: [
      "2019 Toyota Camry - brake inspection",
      "2021 Honda CR-V - oil change and tire rotation",
      "2018 Ford F-150 - AC service, not cooling",
      "2020 Chevrolet Malibu - check engine light",
      "2017 Nissan Altima - pre-purchase inspection",
    ],
    sources: ["chat", "website", "phone"],
  },
  demo_fade_factory: {
    appointmentTypes: ["haircut", "beard_trim", "hot_towel_shave", "hair_coloring", "kids_cut"],
    leadNotes: [
      "Looking for a classic fade haircut.",
      "Wants beard trim and styling.",
      "Interested in the signature hot towel shave experience.",
      "Asking about hair coloring options for men.",
      "Needs appointment for son's first haircut.",
      "Regular client looking to try new style.",
      "Group booking for wedding party.",
    ],
    appointmentNotes: [
      "Classic fade - new client",
      "Beard trim and line-up",
      "Hot towel shave - special occasion",
      "Hair coloring consultation",
      "Kids cut - 5 year old, first time",
      "Wedding party - 4 groomsmen",
    ],
    sources: ["chat", "instagram", "walk-in"],
  },
  demo_ink_soul: {
    appointmentTypes: ["consultation", "small_tattoo", "medium_tattoo", "large_tattoo", "cover_up", "touch_up"],
    leadNotes: [
      "Interested in custom sleeve design consultation.",
      "Wants small memorial tattoo on wrist.",
      "Looking for cover-up of old tattoo.",
      "Asking about pricing for back piece.",
      "First tattoo, wants something small and meaningful.",
      "Need touch-up on existing work.",
      "Inquiring about Japanese style specialist.",
    ],
    appointmentNotes: [
      "Custom sleeve consultation - nature theme",
      "Small wrist tattoo - memorial piece",
      "Cover-up consult - upper arm",
      "Back piece estimate - geometric design",
      "First tattoo - small anchor on forearm",
      "Touch-up - faded lettering",
    ],
    sources: ["chat", "instagram", "referral"],
  },
  demo_iron_coast_fitness: {
    appointmentTypes: ["gym_tour", "personal_training_consult", "fitness_assessment", "membership_info", "class_booking"],
    leadNotes: [
      "Interested in personal training packages.",
      "Asking about gym membership options.",
      "Wants to try group fitness classes.",
      "Looking for weight loss program.",
      "Inquiring about early morning access.",
      "New to town, looking for a good gym.",
      "Interested in strength training for beginners.",
    ],
    appointmentNotes: [
      "Gym tour - considering annual membership",
      "Personal training consultation - weight loss goal",
      "Fitness assessment - new member",
      "Class schedule info - interested in spinning",
      "Strength training intro session",
    ],
    sources: ["chat", "website", "referral"],
  },
  demo_premier_properties: {
    appointmentTypes: ["property_showing", "buyer_consultation", "seller_consultation", "home_valuation", "virtual_tour"],
    leadNotes: [
      "Looking for 3BR home in the $400K-$500K range.",
      "Interested in waterfront properties.",
      "Relocating from out of state, needs virtual tours.",
      "Considering selling current home, wants valuation.",
      "First-time homebuyer, needs guidance on process.",
      "Looking for investment properties.",
      "Interested in new construction communities.",
    ],
    appointmentNotes: [
      "3BR home showing - Jensen Beach area",
      "Buyer consultation - pre-approved, ready to move",
      "Home valuation - thinking of selling",
      "Virtual tour - relocating from NY",
      "First-time buyer consultation",
      "Investment property discussion",
    ],
    sources: ["chat", "zillow", "referral"],
  },
  demo_radiance_medspa: {
    appointmentTypes: ["consultation", "botox", "filler", "facial", "laser_treatment", "body_contouring"],
    leadNotes: [
      "Interested in Botox for forehead lines.",
      "Asking about lip filler options and pricing.",
      "Wants consultation for laser hair removal.",
      "Looking for anti-aging facial treatments.",
      "Inquiring about body contouring services.",
      "Interested in membership packages.",
      "Questions about recovery time for treatments.",
    ],
    appointmentNotes: [
      "Botox consultation - forehead and crow's feet",
      "Lip filler consultation - subtle enhancement",
      "Laser hair removal - full legs estimate",
      "HydraFacial - monthly treatment",
      "Body contouring consultation",
      "Membership info session",
    ],
    sources: ["chat", "instagram", "referral"],
  },
  demo_tc_handyman: {
    appointmentTypes: ["estimate", "small_repair", "painting", "plumbing", "electrical", "general_maintenance"],
    leadNotes: [
      "Needs estimate for interior painting project.",
      "Leaky faucet in kitchen, needs repair.",
      "Looking for general home maintenance help.",
      "Ceiling fan installation needed.",
      "Deck repair and staining project.",
      "Drywall repair after water damage.",
      "Wants quote for bathroom remodel.",
    ],
    appointmentNotes: [
      "Interior painting estimate - 3 rooms",
      "Kitchen faucet repair",
      "Ceiling fan installation - 2 fans",
      "Deck staining project",
      "Drywall repair - water damage",
      "General maintenance visit",
    ],
    sources: ["chat", "nextdoor", "referral"],
  },
};

// Status distribution for realistic data
const LEAD_STATUSES = ["new", "new", "new", "contacted", "contacted", "qualified", "converted"];
const APPOINTMENT_STATUSES = ["new", "new", "confirmed", "completed", "cancelled"];

async function getWorkspaceInfo(workspaceSlug: string) {
  // Get workspace from workspaces table
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug))
    .limit(1);
  
  if (!workspace) {
    // Try clients table (legacy)
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.slug, workspaceSlug))
      .limit(1);
    
    if (!client) {
      return null;
    }
    
    // Get bot for this client
    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.workspaceId, client.id))
      .limit(1);
    
    return { clientId: client.id, botId: bot?.botId || null, source: "clients" };
  }
  
  // Get bot for workspace
  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.workspaceId, workspace.id))
    .limit(1);
  
  return { clientId: workspace.id, botId: bot?.botId || null, source: "workspaces" };
}

async function resetDemoWorkspace(workspaceSlug: string) {
  console.log(`\n🧹 Resetting demo workspace: ${workspaceSlug}`);
  
  const info = await getWorkspaceInfo(workspaceSlug);
  
  if (!info) {
    console.log(`  ⚠️  Workspace not found: ${workspaceSlug}`);
    return;
  }
  
  const clientId = info.clientId;
  console.log(`  📍 Found client ID: ${clientId}`);
  
  // Delete chat sessions
  try {
    const sessions = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.clientId, clientId));
    
    if (sessions.length > 0) {
      await db.delete(chatSessions).where(eq(chatSessions.clientId, clientId));
      console.log(`  🗑️  Deleted ${sessions.length} chat sessions`);
    }
  } catch (e) {
    console.log(`  ℹ️  No chat sessions to delete`);
  }
  
  // Delete leads
  try {
    const deletedLeads = await db
      .delete(leads)
      .where(eq(leads.clientId, clientId))
      .returning({ id: leads.id });
    console.log(`  🗑️  Deleted ${deletedLeads.length} leads`);
  } catch (e) {
    console.log(`  ℹ️  No leads to delete`);
  }
  
  // Delete appointments
  try {
    const deletedAppointments = await db
      .delete(appointments)
      .where(eq(appointments.clientId, clientId))
      .returning({ id: appointments.id });
    console.log(`  🗑️  Deleted ${deletedAppointments.length} appointments`);
  } catch (e) {
    console.log(`  ℹ️  No appointments to delete`);
  }
  
  // Delete daily analytics
  try {
    const deletedAnalytics = await db
      .delete(dailyAnalytics)
      .where(eq(dailyAnalytics.clientId, clientId))
      .returning({ id: dailyAnalytics.id });
    console.log(`  🗑️  Deleted ${deletedAnalytics.length} daily analytics records`);
  } catch (e) {
    console.log(`  ℹ️  No analytics to delete`);
  }
  
  console.log(`  ✅ Workspace reset complete: ${workspaceSlug}`);
}

async function seedDemoData(workspaceSlug: string) {
  console.log(`\n🌱 Seeding demo data for: ${workspaceSlug}`);
  
  const info = await getWorkspaceInfo(workspaceSlug);
  
  if (!info) {
    console.log(`  ⚠️  Workspace not found: ${workspaceSlug}`);
    return;
  }
  
  const clientId = info.clientId;
  const botId = info.botId || "unknown_bot";
  console.log(`  📍 Using client ID: ${clientId}, bot ID: ${botId}`);
  
  // Get business config, defaulting to a generic one if not found
  const config = BUSINESS_CONFIGS[workspaceSlug] || BUSINESS_CONFIGS["faith_house_demo"];
  
  // Generate 15-25 leads
  const leadCount = 15 + Math.floor(Math.random() * 11);
  const generatedLeads: Array<{name: string, email: string, phone: string}> = [];
  
  for (let i = 0; i < leadCount; i++) {
    const name = randomName();
    const email = randomEmail(name);
    const phone = randomPhone();
    const status = LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)];
    const notes = config.leadNotes[Math.floor(Math.random() * config.leadNotes.length)];
    const source = config.sources[Math.floor(Math.random() * config.sources.length)];
    const capturedAt = randomDate(14); // Last 2 weeks
    
    generatedLeads.push({ name, email, phone });
    
    await db.insert(leads).values({
      clientId,
      botId,
      name,
      email,
      phone,
      source,
      status,
      notes,
      createdAt: capturedAt,
      updatedAt: capturedAt,
    });
  }
  console.log(`  📋 Added ${leadCount} leads`);
  
  // Generate 8-15 appointments
  const appointmentCount = 8 + Math.floor(Math.random() * 8);
  
  for (let i = 0; i < appointmentCount; i++) {
    // Use some leads for appointments, some new names
    const useLead = Math.random() > 0.4 && generatedLeads.length > 0;
    const leadInfo = useLead 
      ? generatedLeads[Math.floor(Math.random() * generatedLeads.length)]
      : { name: randomName(), email: randomEmail(randomName()), phone: randomPhone() };
    
    const appointmentType = config.appointmentTypes[Math.floor(Math.random() * config.appointmentTypes.length)];
    const status = APPOINTMENT_STATUSES[Math.floor(Math.random() * APPOINTMENT_STATUSES.length)];
    const notes = config.appointmentNotes[Math.floor(Math.random() * config.appointmentNotes.length)];
    const preferredTime = futureDate(7);
    
    await db.insert(appointments).values({
      clientId,
      botId,
      name: leadInfo.name,
      contact: leadInfo.phone,
      email: leadInfo.email,
      appointmentType,
      preferredTime,
      status,
      notes,
    });
  }
  console.log(`  📅 Added ${appointmentCount} appointments`);
  
  // Generate chat sessions (for conversation history)
  const sessionCount = 20 + Math.floor(Math.random() * 15);
  
  for (let i = 0; i < sessionCount; i++) {
    const sessionId = `demo_session_${workspaceSlug}_${i}_${Date.now()}`;
    const startedAt = randomDate(14);
    const hasEnded = Math.random() > 0.3;
    const messageCount = 4 + Math.floor(Math.random() * 12);
    
    await db.insert(chatSessions).values({
      sessionId,
      clientId,
      botId,
      startedAt,
      endedAt: hasEnded ? new Date(startedAt.getTime() + Math.random() * 1800000) : null,
      userMessageCount: Math.ceil(messageCount / 2),
      botMessageCount: Math.floor(messageCount / 2),
      totalResponseTimeMs: Math.floor(Math.random() * 5000) + 500,
      crisisDetected: false,
      appointmentRequested: Math.random() > 0.6,
      topics: [],
      metadata: {},
      needsReview: Math.random() > 0.85, // 15% flagged for review
      reviewReason: Math.random() > 0.85 ? "Potential high-value lead" : null,
    });
  }
  console.log(`  💬 Added ${sessionCount} chat sessions`);
  
  // Generate daily analytics for last 14 days
  for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split("T")[0];
    
    const conversations = 5 + Math.floor(Math.random() * 20);
    const messages = conversations * (4 + Math.floor(Math.random() * 8));
    
    await db.insert(dailyAnalytics).values({
      date: dateStr,
      clientId,
      botId,
      totalConversations: conversations,
      totalMessages: messages,
      userMessages: Math.ceil(messages * 0.45),
      botMessages: Math.floor(messages * 0.55),
      avgResponseTimeMs: 800 + Math.floor(Math.random() * 1500),
      avgConversationLength: Math.floor(messages / conversations),
      crisisEvents: 0,
      appointmentRequests: Math.floor(conversations * 0.3),
      topicBreakdown: {},
      peakHour: 10 + Math.floor(Math.random() * 8), // 10am - 6pm
      uniqueUsers: Math.ceil(conversations * 0.8),
    });
  }
  console.log(`  📊 Added 14 days of analytics`);
  
  console.log(`  ✅ Demo data seeded: ${workspaceSlug}`);
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceArg = args.find(a => a.startsWith("--workspace="));
  const targetWorkspace = workspaceArg ? workspaceArg.split("=")[1] : null;
  const seedOnly = args.includes("--seed-only");
  const resetOnly = args.includes("--reset-only");
  
  console.log("🚀 Demo Seed Script");
  console.log("=".repeat(50));
  
  const workspacesToProcess = targetWorkspace 
    ? [targetWorkspace] 
    : DEMO_WORKSPACES;
  
  console.log(`\n📁 Processing ${workspacesToProcess.length} workspace(s)...`);
  
  for (const workspace of workspacesToProcess) {
    if (!seedOnly) {
      await resetDemoWorkspace(workspace);
    }
    if (!resetOnly) {
      await seedDemoData(workspace);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Demo seed complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

// Export functions for API use
export { resetDemoWorkspace, seedDemoData, DEMO_WORKSPACES, getWorkspaceInfo };
