import { PLAN_TIERS, PlanTier, MonthlyUsage } from '@shared/schema';
import { storage } from './storage';

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  usage?: {
    messagesUsed: number;
    messagesLimit: number;
    leadsUsed: number;
    leadsLimit: number;
    percentUsed: number;
  };
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getClientPlan(clientId: string): Promise<PlanTier> {
  // Demo clients get enterprise (unlimited) - detect by clientId pattern
  // This ensures demo pages work without hitting message limits
  const isDemoClient = clientId.includes('demo') || 
                       clientId.startsWith('demo_') || 
                       clientId.endsWith('_demo');
  
  if (isDemoClient) {
    return 'enterprise'; // Unlimited messages for demos
  }
  
  // Check clients.json for plan, default to 'starter' for real clients
  try {
    const fs = await import('fs/promises');
    const clientsData = JSON.parse(await fs.readFile('./clients/clients.json', 'utf-8'));
    const client = clientsData.clients.find((c: any) => c.id === clientId);
    
    if (!client) {
      return 'free';
    }
    
    // Demo clients get enterprise plan (unlimited for showcasing)
    if (client.type === 'demo' || client.status === 'demo') {
      return 'enterprise';
    }
    
    // Real clients default to starter, can be overridden
    return (client.plan as PlanTier) || 'starter';
  } catch {
    return 'starter';
  }
}

export async function checkMessageLimit(clientId: string): Promise<UsageCheckResult> {
  const plan = await getClientPlan(clientId);
  const limits = PLAN_TIERS[plan];
  
  // Unlimited plan
  if (limits.messagesPerMonth === -1) {
    return { allowed: true };
  }
  
  const month = getCurrentMonth();
  const usage = await storage.getOrCreateMonthlyUsage(clientId, month);
  
  const percentUsed = Math.round((usage.messagesUsed / limits.messagesPerMonth) * 100);
  
  if (usage.messagesUsed >= limits.messagesPerMonth) {
    return {
      allowed: false,
      reason: `Monthly message limit (${limits.messagesPerMonth}) reached. Please try again next month.`,
      usage: {
        messagesUsed: usage.messagesUsed,
        messagesLimit: limits.messagesPerMonth,
        leadsUsed: usage.leadsCapture,
        leadsLimit: limits.leadsPerMonth,
        percentUsed: 100,
      },
    };
  }
  
  return {
    allowed: true,
    usage: {
      messagesUsed: usage.messagesUsed,
      messagesLimit: limits.messagesPerMonth,
      leadsUsed: usage.leadsCapture,
      leadsLimit: limits.leadsPerMonth,
      percentUsed,
    },
  };
}

export async function checkLeadLimit(clientId: string): Promise<UsageCheckResult> {
  const plan = await getClientPlan(clientId);
  const limits = PLAN_TIERS[plan];
  
  if (limits.leadsPerMonth === -1) {
    return { allowed: true };
  }
  
  const month = getCurrentMonth();
  const usage = await storage.getOrCreateMonthlyUsage(clientId, month);
  
  if (usage.leadsCapture >= limits.leadsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly lead capture limit (${limits.leadsPerMonth}) reached.`,
    };
  }
  
  return { allowed: true };
}

export async function checkAutomationEnabled(clientId: string): Promise<boolean> {
  const plan = await getClientPlan(clientId);
  return PLAN_TIERS[plan].automationsEnabled;
}

export async function incrementMessageCount(clientId: string): Promise<MonthlyUsage> {
  const month = getCurrentMonth();
  return storage.incrementMonthlyUsage(clientId, month, 'messages');
}

export async function incrementLeadCount(clientId: string): Promise<MonthlyUsage> {
  const month = getCurrentMonth();
  return storage.incrementMonthlyUsage(clientId, month, 'leads');
}

export async function incrementAutomationCount(clientId: string): Promise<MonthlyUsage> {
  const month = getCurrentMonth();
  return storage.incrementMonthlyUsage(clientId, month, 'automations');
}

export async function getUsageSummary(clientId: string): Promise<{
  plan: PlanTier;
  planName: string;
  limits: typeof PLAN_TIERS[PlanTier];
  usage: MonthlyUsage;
  percentages: {
    messages: number;
    leads: number;
  };
}> {
  const plan = await getClientPlan(clientId);
  const limits = PLAN_TIERS[plan];
  const month = getCurrentMonth();
  const usage = await storage.getOrCreateMonthlyUsage(clientId, month);
  
  return {
    plan,
    planName: limits.name,
    limits,
    usage,
    percentages: {
      messages: limits.messagesPerMonth === -1 ? 0 : Math.round((usage.messagesUsed / limits.messagesPerMonth) * 100),
      leads: limits.leadsPerMonth === -1 ? 0 : Math.round((usage.leadsCapture / limits.leadsPerMonth) * 100),
    },
  };
}
