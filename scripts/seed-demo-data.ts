#!/usr/bin/env tsx
/**
 * Seed Script for Treasure Coast AI Demo Data
 * 
 * Creates demo workspaces, bots, and sample data for testing and showcasing
 * the multi-tenant chatbot platform.
 * 
 * Usage: npx tsx scripts/seed-demo-data.ts
 */

import { db } from '../server/storage';
import { 
  workspaces, 
  bots, 
  botSettings, 
  botTemplates,
  leads,
  adminUsers
} from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedDemoUser() {
  console.log('Creating demo admin user...');
  
  try {
    const existing = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.username, 'demo_admin'))
      .limit(1);
    
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash('DemoPass123!', 10);
      await db.insert(adminUsers).values({
        username: 'demo_admin',
        passwordHash: hashedPassword,
        role: 'client_admin'
      });
      console.log('  Demo admin user created');
    } else {
      console.log('  Demo admin user already exists');
    }
    
    return existing[0]?.id || 'demo_admin_id';
  } catch (error) {
    console.error('Error creating demo user:', error);
    return 'demo_admin_id';
  }
}

async function seedDemoWorkspace(ownerId: string) {
  console.log('Creating demo workspace...');
  
  try {
    const existing = await db.select()
      .from(workspaces)
      .where(eq(workspaces.slug, 'demo'))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(workspaces).values({
        name: 'Demo Workspace',
        slug: 'demo',
        ownerId: ownerId,
        plan: 'starter',
        status: 'active',
        settings: {}
      });
      console.log('  Demo workspace created');
    } else {
      console.log('  Demo workspace already exists');
    }
  } catch (error) {
    console.error('Error creating demo workspace:', error);
  }
}

async function seedBotTemplates() {
  console.log('Seeding bot templates...');
  
  const templates = [
    { templateId: 'restaurant_template', name: 'Restaurant', botType: 'restaurant', icon: 'utensils', order: 1 },
    { templateId: 'barber_template', name: 'Barber / Salon', botType: 'barber', icon: 'scissors', order: 2 },
    { templateId: 'gym_template', name: 'Gym / Fitness', botType: 'gym', icon: 'dumbbell', order: 3 },
    { templateId: 'auto_shop_template', name: 'Auto Shop', botType: 'auto_shop', icon: 'car', order: 4 },
    { templateId: 'home_services_template', name: 'Home Services', botType: 'home_services', icon: 'wrench', order: 5 },
    { templateId: 'tattoo_template', name: 'Tattoo Studio', botType: 'tattoo_studio', icon: 'paintbrush', order: 6 },
    { templateId: 'real_estate_template', name: 'Real Estate', botType: 'real_estate', icon: 'home', order: 7 },
    { templateId: 'med_spa_template', name: 'Med Spa', botType: 'med_spa', icon: 'sparkles', order: 8 },
    { templateId: 'sober_living_template', name: 'Sober Living', botType: 'sober_living', icon: 'heart', order: 9 },
    { templateId: 'generic_template', name: 'Generic Business', botType: 'generic', icon: 'building', order: 10 }
  ];
  
  for (const t of templates) {
    try {
      const existing = await db.select()
        .from(botTemplates)
        .where(eq(botTemplates.templateId, t.templateId))
        .limit(1);
      
      const defaultConfig = {
        businessProfile: { type: t.botType, services: [], hours: {} },
        systemPrompt: `You are a helpful assistant for a ${t.name.toLowerCase()} business.`,
        faqs: [],
        rules: {},
        automations: {},
        theme: {},
        personality: { tone: 'professional', formality: 50, enthusiasm: 50, warmth: 60 }
      };
      
      if (existing.length === 0) {
        await db.insert(botTemplates).values({
          templateId: t.templateId,
          name: t.name,
          description: `Template for ${t.name.toLowerCase()} businesses`,
          botType: t.botType,
          icon: t.icon,
          displayOrder: t.order,
          defaultConfig: defaultConfig,
          isActive: true
        });
        console.log(`  Template "${t.name}" created`);
      } else {
        await db.update(botTemplates)
          .set({
            name: t.name,
            description: `Template for ${t.name.toLowerCase()} businesses`,
            botType: t.botType,
            icon: t.icon,
            displayOrder: t.order,
            defaultConfig: defaultConfig,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(botTemplates.templateId, t.templateId));
        console.log(`  Template "${t.name}" updated`);
      }
    } catch (error) {
      console.error(`Error with template ${t.templateId}:`, error);
    }
  }
}

async function seedSampleLeads() {
  console.log('Seeding sample leads...');
  
  const sampleLeads = [
    { name: 'John Smith', email: 'john.smith@example.com', phone: '555-123-4567', status: 'new' },
    { name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '555-987-6543', status: 'contacted' },
    { name: 'Mike Wilson', email: 'mike.w@example.com', phone: '555-456-7890', status: 'qualified' }
  ];
  
  for (const lead of sampleLeads) {
    try {
      const existing = await db.select()
        .from(leads)
        .where(eq(leads.email, lead.email))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(leads).values({
          clientId: 'faith_house',
          botId: 'faith_house_main',
          sessionId: `demo-session-${Date.now()}`,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: 'chat',
          status: lead.status,
          notes: 'Sample lead for demo purposes',
          metadata: {}
        });
        console.log(`  Lead "${lead.name}" created`);
      } else {
        console.log(`  Lead "${lead.name}" already exists`);
      }
    } catch (error) {
      console.error(`Error creating lead ${lead.name}:`, error);
    }
  }
}

async function main() {
  console.log('Starting demo data seed...\n');
  
  const ownerId = await seedDemoUser();
  await seedDemoWorkspace(ownerId);
  await seedBotTemplates();
  await seedSampleLeads();
  
  console.log('\nSeed completed successfully!');
  console.log('\nDemo Data Summary:');
  console.log('- Demo admin user: demo_admin');
  console.log('- Demo workspace: demo');
  console.log('- Bot templates: 10 industry templates');
  console.log('- Sample leads: 3 demo leads');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
