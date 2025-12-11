/**
 * Demo Seed Script
 * Resets demo workspaces to a clean state for presentations
 * 
 * Usage:
 *   npx tsx server/demo-seed.ts
 *   npx tsx server/demo-seed.ts --workspace=faith_house_demo
 *   npx tsx server/demo-seed.ts --workspace=demo_paws_suds_grooming_demo
 */

import { db } from "./storage";
import { leads, appointments, chatSessions, clients, bots } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const DEMO_WORKSPACES = [
  "faith_house_demo",
  "demo_paws_suds_grooming_demo"
];

async function resetDemoWorkspace(workspaceSlug: string) {
  console.log(`\n🧹 Resetting demo workspace: ${workspaceSlug}`);
  
  // Get the client ID for this workspace
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.slug, workspaceSlug))
    .limit(1);
  
  if (!client) {
    console.log(`  ⚠️  Workspace not found: ${workspaceSlug}`);
    return;
  }
  
  const clientId = client.id;
  console.log(`  📍 Found client ID: ${clientId}`);
  
  // Delete chat sessions
  const sessions = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.clientId, clientId));
  
  if (sessions.length > 0) {
    await db.delete(chatSessions).where(eq(chatSessions.clientId, clientId));
    console.log(`  🗑️  Deleted ${sessions.length} chat sessions`);
  } else {
    console.log(`  ℹ️  No chat sessions to delete`);
  }
  
  // Delete leads for this workspace
  const deletedLeads = await db
    .delete(leads)
    .where(eq(leads.clientId, clientId))
    .returning({ id: leads.id });
  console.log(`  🗑️  Deleted ${deletedLeads.length} leads`);
  
  // Delete appointments for this workspace
  const deletedAppointments = await db
    .delete(appointments)
    .where(eq(appointments.clientId, clientId))
    .returning({ id: appointments.id });
  console.log(`  🗑️  Deleted ${deletedAppointments.length} appointments`);
  
  console.log(`  ✅ Workspace reset complete: ${workspaceSlug}`);
}

async function seedDemoLeads(workspaceSlug: string) {
  console.log(`\n🌱 Seeding demo data for: ${workspaceSlug}`);
  
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.slug, workspaceSlug))
    .limit(1);
  
  if (!client) {
    console.log(`  ⚠️  Workspace not found: ${workspaceSlug}`);
    return;
  }
  
  const clientId = client.id;
  
  // Get the primary bot for this workspace
  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.workspaceId, clientId))
    .limit(1);
  
  if (!bot) {
    console.log(`  ⚠️  No bot found for workspace: ${workspaceSlug}`);
    return;
  }
  
  const botId = bot.botId;
  console.log(`  📍 Using bot ID: ${botId}`);
  
  if (workspaceSlug === "faith_house_demo") {
    // Seed Faith House demo leads
    const sampleLeads = [
      {
        clientId,
        botId,
        name: "Michael T.",
        email: "michael.t@example.com",
        phone: "(772) 555-1234",
        source: "chat",
        status: "new",
        notes: "Interested in touring the facility. Coming from detox program.",
        capturedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        clientId,
        botId,
        name: "James R.",
        email: "james.r@example.com",
        phone: "(561) 555-5678",
        source: "chat",
        status: "contacted",
        notes: "Family member inquiring on behalf of son. Asked about costs and insurance.",
        capturedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        clientId,
        botId,
        name: "David M.",
        email: "david.m@example.com",
        phone: "(772) 555-9012",
        source: "chat",
        status: "qualified",
        notes: "Currently in outpatient treatment, looking for structured living. Ready to move in next week.",
        capturedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];
    
    for (const lead of sampleLeads) {
      await db.insert(leads).values(lead);
    }
    console.log(`  📋 Added ${sampleLeads.length} sample leads`);
    
    // Seed Faith House demo appointments
    const sampleAppointments = [
      {
        clientId,
        botId,
        name: "Michael T.",
        contact: "(772) 555-1234",
        email: "michael.t@example.com",
        appointmentType: "tour",
        preferredTime: "Tomorrow at 2:00 PM",
        status: "new",
        notes: "First-time visitor from detox program",
      },
      {
        clientId,
        botId,
        name: "Robert K.",
        contact: "(561) 555-3456",
        email: "robert.k@example.com",
        appointmentType: "phone_call",
        preferredTime: "Monday at 10:00 AM",
        status: "new",
        notes: "Questions about phase system and requirements",
      },
    ];
    
    for (const apt of sampleAppointments) {
      await db.insert(appointments).values(apt);
    }
    console.log(`  📅 Added ${sampleAppointments.length} sample appointments`);
    
  } else if (workspaceSlug === "demo_paws_suds_grooming_demo") {
    // Seed Paws & Suds demo leads
    const sampleLeads = [
      {
        clientId,
        botId,
        name: "Sarah W.",
        email: "sarah.w@example.com",
        phone: "(772) 555-2345",
        source: "chat",
        status: "new",
        notes: "Has a Golden Retriever needing de-shedding treatment",
        capturedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        clientId,
        botId,
        name: "Jennifer L.",
        email: "jennifer.l@example.com",
        phone: "(561) 555-6789",
        source: "chat",
        status: "contacted",
        notes: "New puppy owner, interested in puppy introduction grooming",
        capturedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        clientId,
        botId,
        name: "Amanda C.",
        email: "amanda.c@example.com",
        phone: "(772) 555-0123",
        source: "chat",
        status: "qualified",
        notes: "Regular customer inquiry about cat grooming services",
        capturedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ];
    
    for (const lead of sampleLeads) {
      await db.insert(leads).values(lead);
    }
    console.log(`  📋 Added ${sampleLeads.length} sample leads`);
    
    // Seed Paws & Suds demo appointments
    const sampleAppointments = [
      {
        clientId,
        botId,
        name: "Sarah W.",
        contact: "(772) 555-2345",
        email: "sarah.w@example.com",
        appointmentType: "deshedding",
        preferredTime: "Saturday at 11:00 AM",
        status: "new",
        notes: "Golden Retriever - heavy shedder",
      },
      {
        clientId,
        botId,
        name: "Mike B.",
        contact: "(772) 555-7890",
        email: "mike.b@example.com",
        appointmentType: "full-grooming",
        preferredTime: "Friday at 9:00 AM",
        status: "new",
        notes: "Standard Poodle - regular client",
      },
      {
        clientId,
        botId,
        name: "Jennifer L.",
        contact: "(561) 555-6789",
        email: "jennifer.l@example.com",
        appointmentType: "puppy-intro",
        preferredTime: "Next Tuesday at 2:00 PM",
        status: "new",
        notes: "12-week-old Goldendoodle - first grooming ever",
      },
    ];
    
    for (const apt of sampleAppointments) {
      await db.insert(appointments).values(apt);
    }
    console.log(`  📅 Added ${sampleAppointments.length} sample appointments`);
  }
  
  console.log(`  ✅ Demo data seeded: ${workspaceSlug}`);
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceArg = args.find(a => a.startsWith("--workspace="));
  const targetWorkspace = workspaceArg ? workspaceArg.split("=")[1] : null;
  const seedOnly = args.includes("--seed-only");
  
  console.log("🚀 Demo Seed Script");
  console.log("=".repeat(50));
  
  const workspacesToProcess = targetWorkspace 
    ? [targetWorkspace] 
    : DEMO_WORKSPACES;
  
  for (const workspace of workspacesToProcess) {
    if (!seedOnly) {
      await resetDemoWorkspace(workspace);
    }
    await seedDemoLeads(workspace);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Demo seed complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
