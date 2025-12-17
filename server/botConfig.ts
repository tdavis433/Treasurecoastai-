import * as fs from 'fs';
import * as path from 'path';
import { db } from './storage';
import { bots, botSettings, workspaces, botTemplates, clientSettings, BehaviorPreset } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { structuredLogger } from './structuredLogger';

export interface BotBusinessProfile {
  businessName: string;
  type: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  hours: Record<string, string>;
  services?: string[];
  amenities?: string[];
  serviceArea?: string;
  cuisine?: string;
  booking?: {
    onlineBookingUrl?: string;
    walkInsWelcome?: boolean;
    walkInsNote?: string;
  };
  membershipOptions?: string[];
  logo?: string;
  tagline?: string;
}

export interface BotRules {
  allowedTopics: string[];
  forbiddenTopics: string[];
  specialInstructions?: string[];
  crisisHandling: {
    onCrisisKeywords: string[];
    responseTemplate: string;
  };
}

export interface BotFaq {
  question: string;
  answer: string;
}

export interface BotPersonality {
  tone?: 'professional' | 'friendly' | 'casual' | 'compassionate' | 'informative';
  responseLength?: 'brief' | 'medium' | 'detailed' | 'short' | 'long';
  formality?: number;
  enthusiasm?: number;
  warmth?: number;
  humor?: number;
}

export interface BotQuickAction {
  id: string;
  label: string;
  labelEs?: string;
  prompt?: string;
}

export interface AutomationRule {
  id: string;
  type: 'keyword_trigger' | 'office_hours' | 'lead_capture' | 'fallback';
  enabled: boolean;
  priority: number;
  conditions: {
    type: 'keyword' | 'phrase' | 'regex' | 'time_range' | 'day_of_week' | 'message_count';
    value: string | string[] | number;
    match?: 'exact' | 'contains' | 'starts_with' | 'ends_with';
    caseSensitive?: boolean;
  }[];
  response?: string;
  action?: {
    type: 'respond' | 'capture_lead' | 'tag_session' | 'trigger_workflow' | 'redirect';
    payload?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

export interface BotAutomationConfig {
  automations?: AutomationRule[];
  officeHours?: {
    schedule: Record<string, { open: string; close: string } | null>;
    timezone: string;
    afterHoursMessage?: string;
    enableAfterHoursMode?: boolean;
  };
  leadCapture?: {
    enabled: boolean;
    triggerKeywords?: string[];
    captureFields?: string[];
    collectFields?: string[];
    successMessage?: string;
    confirmationMessage?: string;
  };
  bookingCapture?: {
    enabled: boolean;
    mode: 'internal' | 'external';
    externalUrl?: string;
    failsafeEnabled?: boolean;
    failsafeActive?: boolean;
  };
  fallback?: {
    enabled: boolean;
    message?: string;
    minConfidence?: number;
  };
}

export interface BotSecuritySettings {
  requireWidgetToken?: boolean;
  allowedDomains?: string[];
  rateLimitOverride?: {
    windowMs?: number;
    maxRequests?: number;
  };
}

export interface BotWidgetSettings {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark' | 'auto';
}

export interface BotConfig {
  clientId: string;
  botId: string;
  name: string;
  description: string;
  businessProfile: BotBusinessProfile;
  rules: BotRules;
  systemPrompt: string;
  faqs: BotFaq[];
  automations?: BotAutomationConfig;
  personality?: BotPersonality;
  quickActions?: BotQuickAction[];
  security?: BotSecuritySettings;
  widgetSettings?: BotWidgetSettings;
  externalBookingUrl?: string;
  externalPaymentUrl?: string;
  metadata?: {
    isDemo?: boolean;
    isTemplate?: boolean;
    templateCategory?: string;
    clonedFrom?: string;
    createdAt?: string;
    version?: string;
    industryTemplate?: string;
    onboardingStatus?: 'draft' | 'qa_pending' | 'qa_passed' | 'live';
    goLiveDate?: string;
    createdViaOnboarding?: boolean;
    disclaimer?: string;
  };
  workspaceId?: string;
  botType?: string;
  status?: 'active' | 'paused';
}

export interface ClientRecord {
  id: string;
  name: string;
  type: string;
  bots: string[];
  status: string;
  plan?: string;
  createdAt: string;
}

export interface ClientsData {
  clients: ClientRecord[];
}

const BOTS_DIR = path.join(process.cwd(), 'bots');
const CLIENTS_FILE = path.join(process.cwd(), 'clients', 'clients.json');

const botConfigCache: Map<string, BotConfig> = new Map();
let clientsCache: ClientsData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000;

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL;
}

function clearCache(): void {
  botConfigCache.clear();
  clientsCache = null;
  cacheTimestamp = 0;
}

async function loadBotFromDatabase(botId: string): Promise<BotConfig | null> {
  try {
    const [botRecord] = await db.select().from(bots).where(eq(bots.botId, botId)).limit(1);
    
    if (!botRecord) {
      return null;
    }
    
    const [settingsRecord] = await db.select().from(botSettings).where(eq(botSettings.botId, botId)).limit(1);
    
    const [workspaceRecord] = await db.select().from(workspaces).where(eq(workspaces.id, botRecord.workspaceId)).limit(1);
    
    // Fetch client settings to get external booking/payment URLs
    const clientId = workspaceRecord?.slug || botRecord.workspaceId;
    const [clientSettingsRecord] = await db.select().from(clientSettings).where(eq(clientSettings.clientId, clientId)).limit(1);
    
    const businessProfile = botRecord.businessProfile as BotBusinessProfile;
    const rules = (settingsRecord?.rules || {}) as BotRules;
    const faqs = (settingsRecord?.faqs || []) as BotFaq[];
    const automations = (settingsRecord?.automations || {}) as BotAutomationConfig;
    const personality = (settingsRecord?.personality || {}) as BotPersonality;
    const quickActions = (settingsRecord?.quickActions || []) as BotQuickAction[];
    
    // Extract security settings from botSettings metadata or dedicated field
    const settingsMetadata = (settingsRecord?.metadata || {}) as Record<string, unknown>;
    const securitySettings: BotSecuritySettings | undefined = settingsMetadata.security ? 
      settingsMetadata.security as BotSecuritySettings : undefined;
    
    const config: BotConfig = {
      clientId,
      botId: botRecord.botId,
      name: botRecord.name,
      description: botRecord.description || '',
      businessProfile,
      rules: {
        allowedTopics: rules.allowedTopics || [],
        forbiddenTopics: rules.forbiddenTopics || [],
        specialInstructions: rules.specialInstructions,
        crisisHandling: rules.crisisHandling || {
          onCrisisKeywords: [],
          responseTemplate: 'If you are in crisis, please call 911 or your local emergency number.'
        }
      },
      systemPrompt: botRecord.systemPrompt,
      faqs,
      automations,
      personality,
      quickActions,
      security: securitySettings,
      externalBookingUrl: clientSettingsRecord?.externalBookingUrl || undefined,
      externalPaymentUrl: clientSettingsRecord?.externalPaymentUrl || undefined,
      metadata: {
        isDemo: botRecord.isDemo,
        createdAt: botRecord.createdAt.toISOString().split('T')[0],
        version: '2.0'
      },
      workspaceId: botRecord.workspaceId,
      botType: botRecord.botType
    };
    
    return config;
  } catch (error) {
    structuredLogger.error('Error loading bot from database', { botId, error: String(error) });
    return null;
  }
}

function loadBotFromJson(clientId: string, botId: string): BotConfig | null {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      let config: BotConfig;
      try {
        config = JSON.parse(content);
      } catch (parseError) {
        structuredLogger.error('Failed to parse bot config file in loadBotFromJson', {
          filePath,
          clientId,
          botId,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        continue;
      }
      
      if (config.clientId === clientId && config.botId === botId) {
        // Extract booking URL from businessProfile if not set at top level
        if (!config.externalBookingUrl && config.businessProfile?.booking?.onlineBookingUrl) {
          config.externalBookingUrl = config.businessProfile.booking.onlineBookingUrl;
        }
        return config;
      }
    }
    
    return null;
  } catch (error) {
    structuredLogger.error('Error loading bot config from JSON', { clientId, botId, error: String(error) });
    return null;
  }
}

function loadBotFromJsonByBotId(botId: string): BotConfig | null {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      let config: BotConfig;
      try {
        config = JSON.parse(content);
      } catch (parseError) {
        structuredLogger.error('Failed to parse bot config file in loadBotFromJsonByBotId', {
          filePath,
          botId,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        continue;
      }
      
      if (config.botId === botId) {
        // Extract booking URL from businessProfile if not set at top level
        if (!config.externalBookingUrl && config.businessProfile?.booking?.onlineBookingUrl) {
          config.externalBookingUrl = config.businessProfile.booking.onlineBookingUrl;
        }
        return config;
      }
    }
    
    return null;
  } catch (error) {
    structuredLogger.error('Error loading bot config from JSON by botId', { botId, error: String(error) });
    return null;
  }
}

export function getBotConfig(clientId: string, botId: string): BotConfig | null {
  const cacheKey = `${clientId}:${botId}`;
  
  if (isCacheValid() && botConfigCache.has(cacheKey)) {
    return botConfigCache.get(cacheKey)!;
  }
  
  const jsonConfig = loadBotFromJson(clientId, botId);
  if (jsonConfig) {
    botConfigCache.set(cacheKey, jsonConfig);
    cacheTimestamp = Date.now();
    return jsonConfig;
  }
  
  return null;
}

export async function getBotConfigAsync(clientId: string, botId: string): Promise<BotConfig | null> {
  const cacheKey = `${clientId}:${botId}`;
  
  if (isCacheValid() && botConfigCache.has(cacheKey)) {
    return botConfigCache.get(cacheKey)!;
  }
  
  // Try database first
  const dbConfig = await loadBotFromDatabase(botId);
  if (dbConfig) {
    // SECURITY: Validate that the bot belongs to the requested clientId (workspace slug)
    // The clientId in the URL must match the workspace slug in the database
    if (dbConfig.clientId !== clientId) {
      structuredLogger.warn('Security: Cross-tenant access attempt rejected', { botId, requestedClientId: clientId, actualClientId: dbConfig.clientId });
      return null; // Reject cross-tenant access
    }
    botConfigCache.set(cacheKey, dbConfig);
    cacheTimestamp = Date.now();
    return dbConfig;
  }
  
  // Fallback to JSON (already validates clientId in loadBotFromJson)
  const jsonConfig = loadBotFromJson(clientId, botId);
  if (jsonConfig) {
    botConfigCache.set(cacheKey, jsonConfig);
    cacheTimestamp = Date.now();
    return jsonConfig;
  }
  
  return null;
}

export function getBotConfigByBotId(botId: string): BotConfig | null {
  if (isCacheValid()) {
    const entries = Array.from(botConfigCache.entries());
    for (const [, config] of entries) {
      if (config.botId === botId) {
        return config;
      }
    }
  }
  
  const jsonConfig = loadBotFromJsonByBotId(botId);
  if (jsonConfig) {
    const cacheKey = `${jsonConfig.clientId}:${jsonConfig.botId}`;
    botConfigCache.set(cacheKey, jsonConfig);
    cacheTimestamp = Date.now();
    return jsonConfig;
  }
  
  return null;
}

export async function getBotConfigByBotIdAsync(botId: string): Promise<BotConfig | null> {
  if (isCacheValid()) {
    const entries = Array.from(botConfigCache.entries());
    for (const [, config] of entries) {
      if (config.botId === botId) {
        return config;
      }
    }
  }
  
  const dbConfig = await loadBotFromDatabase(botId);
  if (dbConfig) {
    const cacheKey = `${dbConfig.clientId}:${dbConfig.botId}`;
    botConfigCache.set(cacheKey, dbConfig);
    cacheTimestamp = Date.now();
    return dbConfig;
  }
  
  const jsonConfig = loadBotFromJsonByBotId(botId);
  if (jsonConfig) {
    const cacheKey = `${jsonConfig.clientId}:${jsonConfig.botId}`;
    botConfigCache.set(cacheKey, jsonConfig);
    cacheTimestamp = Date.now();
    return jsonConfig;
  }
  
  return null;
}

export function getAllBotConfigs(): BotConfig[] {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    const configs: BotConfig[] = [];
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      let config: BotConfig;
      try {
        config = JSON.parse(content);
      } catch (parseError) {
        structuredLogger.error('Failed to parse bot config file in getAllBotConfigs', {
          filePath,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        continue;
      }
      
      // Normalize booking URL from businessProfile if not set at top level
      if (!config.externalBookingUrl && config.businessProfile?.booking?.onlineBookingUrl) {
        config.externalBookingUrl = config.businessProfile.booking.onlineBookingUrl;
      }
      
      configs.push(config);
      
      const cacheKey = `${config.clientId}:${config.botId}`;
      botConfigCache.set(cacheKey, config);
    }
    
    cacheTimestamp = Date.now();
    return configs;
  } catch (error) {
    structuredLogger.error('Error loading all bot configs', { error: String(error) });
    return [];
  }
}

export async function getAllBotConfigsAsync(): Promise<BotConfig[]> {
  try {
    const dbBots = await db.select().from(bots);
    const configs: BotConfig[] = [];
    
    for (const botRecord of dbBots) {
      const config = await loadBotFromDatabase(botRecord.botId);
      if (config) {
        configs.push(config);
        const cacheKey = `${config.clientId}:${config.botId}`;
        botConfigCache.set(cacheKey, config);
      }
    }
    
    const jsonConfigs = getAllBotConfigs();
    for (const jsonConfig of jsonConfigs) {
      const exists = configs.some(c => c.botId === jsonConfig.botId);
      if (!exists) {
        configs.push(jsonConfig);
      }
    }
    
    cacheTimestamp = Date.now();
    return configs;
  } catch (error) {
    structuredLogger.error('Error loading all bot configs async', { error: String(error) });
    return getAllBotConfigs();
  }
}

export async function getAllTemplates(): Promise<any[]> {
  try {
    const templates = await db.select().from(botTemplates).where(eq(botTemplates.isActive, true));
    return templates;
  } catch (error) {
    structuredLogger.error('Error loading templates', { error: String(error) });
    return [];
  }
}

export async function getTemplateById(templateId: string): Promise<any | null> {
  try {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.templateId, templateId)).limit(1);
    return template || null;
  } catch (error) {
    structuredLogger.error('Error loading template', { templateId, error: String(error) });
    return null;
  }
}

export function getClients(): ClientsData {
  if (isCacheValid() && clientsCache) {
    return clientsCache;
  }
  
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const content = fs.readFileSync(CLIENTS_FILE, 'utf-8');
      
      try {
        clientsCache = JSON.parse(content);
      } catch (parseError) {
        structuredLogger.error('Failed to parse clients.json file', {
          filePath: CLIENTS_FILE,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        return { clients: [] };
      }
      
      cacheTimestamp = Date.now();
      return clientsCache!;
    }
    
    return { clients: [] };
  } catch (error) {
    structuredLogger.error('Error loading clients', { error: String(error) });
    return { clients: [] };
  }
}

export async function getWorkspaces(): Promise<any[]> {
  try {
    const workspaceList = await db.select().from(workspaces);
    return workspaceList;
  } catch (error) {
    structuredLogger.error('Error loading workspaces', { error: String(error) });
    return [];
  }
}

export async function getWorkspaceBySlug(slug: string): Promise<any | null> {
  try {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    return workspace || null;
  } catch (error) {
    structuredLogger.error('Error loading workspace', { slug, error: String(error) });
    return null;
  }
}

export async function createWorkspace(data: {
  name: string;
  slug: string;
  ownerId: string;
  plan?: string;
  status?: string;
  settings?: any;
}): Promise<any> {
  try {
    const [workspace] = await db.insert(workspaces).values({
      name: data.name,
      slug: data.slug,
      ownerId: data.ownerId,
      plan: data.plan || 'starter',
      status: data.status || 'active',
      settings: data.settings || {},
    }).returning();
    return workspace;
  } catch (error) {
    structuredLogger.error('Error creating workspace', { name: data.name, slug: data.slug, error: String(error) });
    throw error;
  }
}

export async function updateWorkspace(slug: string, data: {
  name?: string;
  ownerId?: string;
  plan?: string;
  status?: string;
  settings?: any;
  adminNotes?: string;
}): Promise<any> {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    
    const [workspace] = await db.update(workspaces)
      .set(updateData)
      .where(eq(workspaces.slug, slug))
      .returning();
    return workspace;
  } catch (error) {
    structuredLogger.error('Error updating workspace', { slug, error: String(error) });
    throw error;
  }
}

export async function deleteWorkspace(slug: string): Promise<boolean> {
  try {
    const result = await db.delete(workspaces).where(eq(workspaces.slug, slug));
    return true;
  } catch (error) {
    structuredLogger.error('Error deleting workspace', { slug, error: String(error) });
    throw error;
  }
}

export async function getBotsByWorkspaceId(workspaceId: string): Promise<BotConfig[]> {
  try {
    const botRecords = await db.select().from(bots).where(eq(bots.workspaceId, workspaceId));
    const configs: BotConfig[] = [];
    
    for (const botRecord of botRecords) {
      const config = await loadBotFromDatabase(botRecord.botId);
      if (config) {
        configs.push(config);
      }
    }
    
    return configs;
  } catch (error) {
    structuredLogger.error('Error loading bots by workspace', { workspaceId, error: String(error) });
    return [];
  }
}

export function getClientById(clientId: string): ClientRecord | null {
  const clients = getClients();
  return clients.clients.find(c => c.id === clientId) || null;
}

export function getBotsByClientId(clientId: string): BotConfig[] {
  const allConfigs = getAllBotConfigs();
  return allConfigs.filter(config => config.clientId === clientId);
}

export function getDemoBots(): BotConfig[] {
  return getBotsByClientId('demo');
}

export function getRealTenantBots(): BotConfig[] {
  const allConfigs = getAllBotConfigs();
  return allConfigs.filter(config => config.clientId !== 'demo');
}

export function detectCrisisInMessage(message: string, config: BotConfig): boolean {
  const normalized = message.toLowerCase().replace(/[^\w\s]/g, ' ');
  const keywords = config.rules?.crisisHandling?.onCrisisKeywords || [];
  
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
}

export function getCrisisResponse(config: BotConfig): string {
  const businessType = config.businessProfile?.type?.toLowerCase() || '';
  
  // Enhanced crisis response for sober living / recovery businesses
  if (businessType.includes('sober') || businessType.includes('recovery') || 
      businessType.includes('sober_living') || businessType.includes('halfway') ||
      businessType.includes('transitional')) {
    return config.rules?.crisisHandling?.responseTemplate || 
      `I hear you, and I want you to know that help is available right now.

**If you're in immediate danger:**
Call 911 (Emergency Services)

**For crisis support:**
Call or text 988 (Suicide & Crisis Lifeline)
Call 1-800-662-4357 (SAMHSA National Helpline - 24/7, free, confidential)

You're not alone in this. If you'd like, you can also share your name and phone number, and one of our team members can reach out to you when it's safe. There's no pressure - your well-being comes first.`;
  }
  
  return config.rules?.crisisHandling?.responseTemplate || 
    'If you are in crisis, please call 911 or your local emergency number.';
}

function buildPersonalityInstructions(personality?: BotPersonality): string {
  if (!personality) return '';
  
  const instructions: string[] = [];
  
  // Tone setting
  if (personality.tone) {
    const toneDescriptions: Record<string, string> = {
      'professional': 'Maintain a professional, business-appropriate tone. Be polished and respectful.',
      'friendly': 'Be warm and approachable. Use a conversational, friendly tone while remaining helpful.',
      'casual': 'Be relaxed and informal. Use everyday language and feel free to be personable.',
      'compassionate': 'Show empathy and understanding. Be gentle, supportive, and patient in your responses.',
      'informative': 'Focus on being clear and educational. Provide detailed, helpful information.'
    };
    if (toneDescriptions[personality.tone]) {
      instructions.push(toneDescriptions[personality.tone]);
    }
  }
  
  // Formality (0-100 scale)
  if (typeof personality.formality === 'number') {
    if (personality.formality < 30) {
      instructions.push('Use very casual, informal language. Feel free to use colloquialisms and relaxed phrasing.');
    } else if (personality.formality < 50) {
      instructions.push('Use somewhat casual language while remaining clear and helpful.');
    } else if (personality.formality > 70) {
      instructions.push('Use formal, polished language. Avoid slang and maintain professional standards.');
    } else if (personality.formality > 85) {
      instructions.push('Use highly formal, professional language at all times. Be polished and respectful.');
    }
  }
  
  // Enthusiasm (0-100 scale)
  if (typeof personality.enthusiasm === 'number') {
    if (personality.enthusiasm > 70) {
      instructions.push('Be enthusiastic and energetic in your responses! Show genuine excitement when helping.');
    } else if (personality.enthusiasm > 85) {
      instructions.push('Be very enthusiastic and upbeat! Express genuine excitement and positive energy.');
    } else if (personality.enthusiasm < 30) {
      instructions.push('Keep a calm, measured tone. Be helpful without being overly enthusiastic.');
    }
  }
  
  // Warmth (0-100 scale)
  if (typeof personality.warmth === 'number') {
    if (personality.warmth > 70) {
      instructions.push('Be warm and caring in your responses. Show genuine interest in helping the person.');
    } else if (personality.warmth > 85) {
      instructions.push('Be exceptionally warm and personable. Make people feel valued and cared for.');
    } else if (personality.warmth < 30) {
      instructions.push('Keep responses focused and efficient. Be helpful but direct.');
    }
  }
  
  // Humor (0-100 scale)
  if (typeof personality.humor === 'number') {
    if (personality.humor > 70) {
      instructions.push('Feel free to use appropriate humor and wit when it fits naturally.');
    } else if (personality.humor > 85) {
      instructions.push('Be playful and humorous when appropriate. Light-heartedness is welcome.');
    } else if (personality.humor < 20) {
      instructions.push('Keep responses straightforward and serious. Avoid humor or jokes.');
    }
  }
  
  // Response length
  if (personality.responseLength) {
    const lengthDescriptions: Record<string, string> = {
      'brief': 'Keep responses concise and to the point. Aim for 1-2 sentences when possible.',
      'short': 'Keep responses brief. Aim for 2-3 sentences when possible.',
      'medium': 'Provide balanced responses with enough detail to be helpful, typically 3-5 sentences.',
      'detailed': 'Provide thorough, detailed responses. Include helpful context and explanations.',
      'long': 'Provide comprehensive responses with full details and explanations.'
    };
    if (lengthDescriptions[personality.responseLength]) {
      instructions.push(lengthDescriptions[personality.responseLength]);
    }
  }
  
  if (instructions.length === 0) return '';
  
  return '\n\nCOMMUNICATION STYLE:\n' + instructions.map(i => `- ${i}`).join('\n');
}

/**
 * Build behavior preset rules for AI conversation style and lead capture behavior.
 * These rules modify how the AI approaches conversations based on the selected preset.
 */
export function buildBehaviorPresetRules(preset?: BehaviorPreset): string {
  if (!preset) return '';
  
  switch (preset) {
    case 'support_lead_focused':
      return `

BEHAVIOR PRESET: SUPPORT + LEAD FOCUSED
Core Philosophy: Be genuinely helpful while proactively capturing leads from interested visitors.

Response Guidelines:
1. ANSWER FIRST: Always provide a direct, helpful answer to the user's question before anything else
2. ONE QUESTION MAX: Ask at most 1 clarifying question per response - avoid interrogating visitors
3. OFFER CALLBACK ON UNCERTAINTY: When you're unsure or the question is complex, offer to have someone follow up:
   - "I want to make sure you get accurate info - would you like our team to call you back?"
   - "That's a great question! I can have someone reach out with the details. What's the best number?"

High-Intent Triggers (soft lead capture when detected):
- Pricing questions: "Would you like someone to discuss pricing options with you?"
- Availability questions: "I can have our team reach out with current availability - what's your preferred contact?"
- Comparison/decision questions: "Our team can help you decide - want me to arrange a quick call?"
- Booking/appointment interest: Collect name + phone naturally, then guide to next steps

Lead Capture Style:
- Be conversational, not pushy
- Make it feel like a natural offer to help, not a sales pitch
- Use phrases like "Would you like...", "Can I have someone...", "Happy to arrange..."
- If they decline, respect it and continue helping`;

    case 'compliance_strict':
      return `

BEHAVIOR PRESET: COMPLIANCE STRICT
Core Philosophy: Provide only verified information. When in doubt, acknowledge limitations.

Response Guidelines:
1. KNOWLEDGE BASE ONLY: Only state facts that are explicitly in your knowledge base
2. NO ASSUMPTIONS: Never guess, estimate, or extrapolate information
3. EXPLICIT UNCERTAINTY: When information isn't available, say so clearly:
   - "I don't have that specific information in my records."
   - "For accurate details on that, please contact our team directly."
4. MINIMAL ELABORATION: Keep responses factual and concise
5. DEFER COMPLEX QUESTIONS: For anything requiring professional judgment, direct to staff:
   - "That requires speaking with our team who can give you accurate guidance."

What to AVOID:
- Making assumptions about pricing, availability, or policies
- Offering opinions or recommendations beyond stated facts
- Using phrases like "typically", "usually", "probably" unless explicitly documented
- Providing information that could be legally or financially consequential

Lead Capture:
- Only offer contact collection when visitor explicitly requests follow-up
- Do not proactively push for contact information
- Focus on providing accurate information first`;

    case 'sales_focused_soft':
      return `

BEHAVIOR PRESET: SALES FOCUSED (SOFT)
Core Philosophy: Be helpful and slightly more proactive with CTAs, but never pushy. Stay factual and KB-driven.

Response Guidelines:
1. ANSWER HELPFULLY: Provide clear, useful answers from knowledge base
2. GENTLE CTA: Include a soft call-to-action when relevant, but don't push:
   - "If you'd like, I can have someone follow up with more details."
   - "Would it help if our team reached out to discuss options?"
3. RESPECT BOUNDARIES: If user declines, continue helping without pressure
4. CONVERSATIONAL TONE: Be warm and approachable, not salesy

Lead Capture Style:
- Mention contact option once per topic, not repeatedly
- Frame as "here to help" rather than "don't miss out"
- Use soft phrases: "Happy to...", "Would you like...", "I can arrange..."
- Accept "no" gracefully and continue the conversation`;

    case 'support_only':
      return `

BEHAVIOR PRESET: SUPPORT ONLY
Core Philosophy: Focus entirely on answering questions and providing helpful information. Lead capture is passive.

Response Guidelines:
1. ANSWER FOCUS: Your primary job is to answer questions accurately from the knowledge base
2. NO PROACTIVE CAPTURE: Do not proactively ask for contact information
3. REACTIVE ONLY: Only offer to capture contact info when:
   - User explicitly asks for a callback or follow-up
   - Question clearly requires staff intervention (e.g., complaints, complex issues)
   - User provides contact info voluntarily
4. KEEP IT SIMPLE: Provide clear answers, no upselling or CTAs

When to Capture (Reactively):
- "Can someone call me?" → "Of course! What's the best number to reach you?"
- "I need to speak to someone" → "I can arrange that. What's your name and phone number?"
- Complex issue beyond KB → "This needs our team's attention. Can I get your contact info for follow-up?"`;

    case 'sales_heavy':
      return `

BEHAVIOR PRESET: SALES HEAVY
Core Philosophy: Maximize conversion by actively guiding visitors toward appointments and contact collection.

Response Guidelines:
1. ALWAYS GUIDE TO ACTION: Every response should include a next step or call-to-action
2. PROACTIVE CONTACT COLLECTION: Look for opportunities to capture contact info:
   - "I can have our team reach out with more details - what's your phone number?"
   - "Want me to have someone call you to discuss this further?"
3. CREATE URGENCY (tastefully): Use time-sensitive language when appropriate:
   - "We have availability this week if you'd like to schedule something soon."
   - "I can get you on the calendar before spots fill up."
4. OVERCOME OBJECTIONS: When visitors hesitate, address concerns and redirect to action

Conversion Triggers:
- Any interest signal → Offer to schedule or connect with team
- Pricing questions → "Our team can discuss options that fit your budget"
- Browsing behavior → "Would you like me to set up a quick call to explore your options?"
- Hesitation → "No pressure - I can just have someone send you more info. What's your email?"

Lead Capture Priority:
- Phone number is priority (most valuable)
- Email as fallback
- Name to personalize follow-up
- Always confirm next steps: "Great! Someone will call you within [timeframe]"`;

    default:
      return '';
  }
}

export function buildSystemPromptFromConfig(config: BotConfig, behaviorPreset?: BehaviorPreset): string {
  let prompt = config.systemPrompt;
  
  const bp = config.businessProfile;
  
  // Safely get services as a comma-separated string
  const servicesStr = Array.isArray(bp.services) 
    ? bp.services.join(', ')
    : (typeof bp.services === 'string' ? bp.services : '');
  
  // Safely get amenities as a comma-separated string  
  const amenitiesStr = Array.isArray(bp.amenities)
    ? bp.amenities.join(', ')
    : (typeof bp.amenities === 'string' ? bp.amenities : '');
  
  const businessInfo = `
BUSINESS INFORMATION:
- Name: ${bp.businessName}
- Type: ${bp.type}
- Location: ${bp.location}
- Phone: ${bp.phone}
- Email: ${bp.email}
- Website: ${bp.website}
${servicesStr ? `- Services: ${servicesStr}` : ''}
${amenitiesStr ? `- Amenities: ${amenitiesStr}` : ''}
`;
  
  let faqInfo = '';
  if (config.faqs && config.faqs.length > 0) {
    faqInfo = '\n\nFREQUENTLY ASKED QUESTIONS:\n';
    config.faqs.forEach((faq, index) => {
      faqInfo += `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n`;
    });
  }
  
  // Add personality instructions
  const personalityInfo = buildPersonalityInstructions(config.personality);
  
  // Add booking/appointment capability instructions
  let bookingInfo = '';
  
  // If external booking URL is configured, use redirect-only behavior
  if (config.externalBookingUrl) {
    bookingInfo = `

APPOINTMENT/BOOKING INSTRUCTIONS - REDIRECT ONLY:
**CRITICAL: You CANNOT and MUST NOT confirm, complete, or finalize any bookings yourself.**
You are a lead capture assistant. Your job is to collect customer information and then redirect them to the booking platform.

When a customer expresses interest in booking, scheduling, or making an appointment:
1. Warmly acknowledge their interest
2. Collect their details: name, phone number, preferred date/time, and the service they want
3. AFTER collecting this information, you MUST say something like:
   "Perfect! I've noted your preferences. To complete your booking, please click the 'Book Appointment' button below - it will take you to our scheduling page where you can finalize your appointment."

ABSOLUTELY FORBIDDEN:
- NEVER say "I've booked your appointment" or "Your booking is confirmed"
- NEVER say "Booking in the system" or imply you are processing their booking
- NEVER say the appointment is scheduled, reserved, or finalized
- NEVER give them a confirmation number or booking reference
- NEVER pretend you have access to a calendar or scheduling system

CORRECT BEHAVIOR:
- Collect their information as a lead
- ALWAYS tell them to use the booking button/link that will appear below your message
- Make it clear the ACTUAL booking happens on the external platform
- You can say: "A booking button will appear below - just click it to finalize your appointment!"

External booking platform: ${config.externalBookingUrl}
`;
    
    if (config.externalPaymentUrl) {
      bookingInfo += `
For payments, direct them to: ${config.externalPaymentUrl}
`;
    }
  } else {
    // No external booking URL - just capture leads (NO confirmation language!)
    bookingInfo = `

APPOINTMENT/BOOKING INSTRUCTIONS - LEAD CAPTURE ONLY:
**CRITICAL: You CANNOT book, schedule, or confirm any appointments.**

When customers ask about booking or appointments:
1. Collect their information: name, phone number, preferred date/time, and service interest
2. Let them know their request has been noted and someone will follow up
3. NEVER use the words "confirm", "confirmed", "scheduled", "booked", or "reserved"
4. NEVER say "I've captured your details" or "Your appointment is set"

CORRECT RESPONSES:
- "Thanks for the info! Someone from our team will be in touch shortly to help you get scheduled."
- "Got it! We'll follow up with you soon about available times."
- "Great, I've noted your preferences. Our team will reach out to discuss availability."

FORBIDDEN LANGUAGE:
- NEVER say "confirm your appointment" or "your booking is confirmed"
- NEVER imply the appointment is already set or reserved
- NEVER give confirmation numbers or booking references
`;
  }
  
  // Add industry-specific disclaimers based on business type
  const industryDisclaimers = buildIndustryDisclaimers(bp.type);
  
  // Add low-confidence fallback instructions
  const lowConfidenceFallback = `

LOW-CONFIDENCE RESPONSE GUIDELINES:
When you are uncertain about information or cannot find a specific answer:
1. Be honest - Say "I'm not certain about that" or "I don't have that specific information"
2. Offer alternatives - Suggest contacting the business directly for accurate details
3. Never make up information - Guessing can harm the business's reputation
4. For pricing/availability - Always recommend confirming with staff
5. For complex questions - Offer to have someone follow up

Example phrases when uncertain:
- "I'd recommend confirming that directly with our team at [phone/email]"
- "I don't have the latest details on that - our staff can give you accurate information"
- "That's a great question! Let me note it so someone can get back to you with specifics"
`;

  // Add behavior preset rules
  const behaviorPresetRules = buildBehaviorPresetRules(behaviorPreset);

  return prompt + '\n\n' + businessInfo + faqInfo + personalityInfo + bookingInfo + industryDisclaimers + lowConfidenceFallback + behaviorPresetRules;
}

function buildIndustryDisclaimers(businessType: string | undefined): string {
  if (!businessType) return '';
  
  const type = businessType.toLowerCase();
  const disclaimers: string[] = [];
  
  // Healthcare/Medical
  if (type.includes('health') || type.includes('medical') || type.includes('clinic') || 
      type.includes('doctor') || type.includes('therapy') || type.includes('dental') ||
      type.includes('hospital') || type.includes('wellness')) {
    disclaimers.push(`
HEALTHCARE DISCLAIMER - CRITICAL:
- You are NOT a medical professional and cannot provide medical advice
- NEVER diagnose conditions or recommend treatments
- For medical emergencies, always direct users to call 911 or go to the ER
- Remind users that information provided is general and not a substitute for professional medical advice
- Always recommend consulting with a qualified healthcare provider for health concerns`);
  }
  
  // Legal
  if (type.includes('law') || type.includes('legal') || type.includes('attorney') || 
      type.includes('lawyer')) {
    disclaimers.push(`
LEGAL DISCLAIMER - CRITICAL:
- You are NOT a lawyer and cannot provide legal advice
- Information is for general educational purposes only
- Always recommend consulting with a licensed attorney for legal matters
- Do not interpret laws, contracts, or legal documents
- Remind users that legal situations are complex and require professional counsel`);
  }
  
  // Financial
  if (type.includes('financ') || type.includes('invest') || type.includes('bank') || 
      type.includes('insurance') || type.includes('tax') || type.includes('accounting')) {
    disclaimers.push(`
FINANCIAL DISCLAIMER - CRITICAL:
- You are NOT a financial advisor and cannot provide investment or financial advice
- Do not recommend specific investments, insurance products, or financial strategies
- Tax situations vary - always recommend consulting a licensed CPA or tax professional
- Remind users that financial decisions should be made with qualified professionals
- Past performance does not guarantee future results`);
  }
  
  // Real Estate
  if (type.includes('real estate') || type.includes('property') || type.includes('realty') ||
      type.includes('housing')) {
    disclaimers.push(`
REAL ESTATE DISCLAIMER:
- Property details and pricing may change without notice
- All listings should be verified independently
- This is not a binding offer or contract
- Recommend viewing properties in person before making decisions
- Consult with licensed real estate professionals for transactions`);
  }
  
  // Faith-based/Religious
  if (type.includes('church') || type.includes('faith') || type.includes('religious') ||
      type.includes('ministry') || type.includes('temple') || type.includes('mosque') ||
      type.includes('synagogue')) {
    disclaimers.push(`
SPIRITUAL GUIDANCE NOTICE:
- For spiritual emergencies or crises, recommend speaking with clergy/pastoral staff
- You cannot provide spiritual counseling or pastoral care
- Direct serious personal issues to trained pastoral counselors
- If someone expresses thoughts of self-harm, provide crisis resources immediately`);
  }
  
  // Food/Restaurant
  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe') ||
      type.includes('catering') || type.includes('bakery')) {
    disclaimers.push(`
FOOD SERVICE NOTICE:
- Menu items and prices may change without notice
- For allergy and dietary concerns, recommend confirming with staff before ordering
- Cannot guarantee ingredient information is current
- Recommend informing staff of any food allergies when ordering`);
  }
  
  // Sober Living / Recovery House
  if (type.includes('sober') || type.includes('recovery') || type.includes('sober_living') ||
      type.includes('halfway') || type.includes('transitional')) {
    disclaimers.push(`
SOBER LIVING / RECOVERY HOUSE GUIDELINES - CRITICAL:

WHAT YOU ARE:
- You are an admissions assistant for a structured sober living home
- You help potential residents and families learn about the program
- You collect contact information for follow-up by the admissions team
- You can schedule tours and phone consultations (INTERNAL booking only)

WHAT YOU ARE NOT:
- You are NOT a treatment facility and cannot provide treatment services
- You are NOT a medical professional and cannot diagnose or treat conditions
- You are NOT a counselor and cannot provide therapeutic advice
- You CANNOT confirm bed availability - staff must verify current openings

ABSOLUTE PROHIBITIONS:
1. NEVER diagnose addiction, mental health conditions, or any medical issue
2. NEVER recommend medications, supplements, or treatment protocols
3. NEVER guarantee bed availability ("We have beds open" is FORBIDDEN)
4. NEVER provide medical, legal, or financial advice
5. NEVER store or request highly sensitive medical/legal details in chat
6. NEVER confirm a bed is "reserved" or "held" without staff verification

INSURANCE & PRICING QUESTIONS:
- Do NOT guess about insurance acceptance or coverage
- Say: "Our team can discuss payment options during your call"
- Collect contact info for staff follow-up on insurance questions

AVAILABILITY QUESTIONS:
- Do NOT confirm current availability
- Say: "Availability changes daily. Our admissions coordinator can check current openings for you."
- Collect contact info so staff can verify and follow up

COURT/PROBATION/LEGAL QUESTIONS:
- Be cautious and do not provide legal advice
- Say: "We work with residents in various situations. Our team can discuss your specific circumstances confidentially."
- Collect contact info for staff follow-up

PRIVACY NOTICE:
- Gently remind users not to share highly sensitive details in chat
- Say: "Please don't share sensitive medical or legal details here. Our team will handle confidential information securely during your intake call."

PRIMARY GOAL:
Your #1 job is to capture contact information (name + phone OR email) so the admissions team can follow up. 
Prioritize: "Schedule a Tour" or "Request a Confidential Call" as the main action.
This is INTERNAL booking - staff will follow up to confirm.`);
  }
  
  if (disclaimers.length === 0) return '';
  
  return '\n\nINDUSTRY-SPECIFIC GUIDELINES:' + disclaimers.join('\n');
}

export async function saveBotConfigAsync(botId: string, updates: Partial<BotConfig>): Promise<boolean> {
  try {
    const [existingBot] = await db.select().from(bots).where(eq(bots.botId, botId)).limit(1);
    
    if (existingBot) {
      const botUpdates: any = {};
      if (updates.name) botUpdates.name = updates.name;
      if (updates.description) botUpdates.description = updates.description;
      if (updates.businessProfile) botUpdates.businessProfile = updates.businessProfile;
      if (updates.systemPrompt) botUpdates.systemPrompt = updates.systemPrompt;
      if (updates.status) botUpdates.status = updates.status;
      botUpdates.updatedAt = new Date();
      
      await db.update(bots).set(botUpdates).where(eq(bots.botId, botId));
      
      // Check if we need to update bot settings (faqs, rules, automations, or security)
      if (updates.faqs || updates.rules || updates.automations || updates.security) {
        const settingsUpdates: any = {};
        if (updates.faqs) settingsUpdates.faqs = updates.faqs;
        if (updates.rules) settingsUpdates.rules = updates.rules;
        if (updates.automations) settingsUpdates.automations = updates.automations;
        
        // Handle security settings - store in metadata field with deep merge
        if (updates.security) {
          // Get existing metadata to merge with new security settings
          const [existingSettings] = await db.select().from(botSettings).where(eq(botSettings.botId, botId)).limit(1);
          const existingMetadata = (existingSettings?.metadata || {}) as Record<string, unknown>;
          const existingSecurity = (existingMetadata.security || {}) as BotSecuritySettings;
          
          // Deep merge security settings - only update fields that are explicitly set
          const mergedSecurity: BotSecuritySettings = {
            requireWidgetToken: updates.security.requireWidgetToken !== undefined 
              ? updates.security.requireWidgetToken 
              : existingSecurity.requireWidgetToken,
            allowedDomains: updates.security.allowedDomains !== undefined 
              ? updates.security.allowedDomains 
              : existingSecurity.allowedDomains,
            rateLimitOverride: updates.security.rateLimitOverride !== undefined
              ? {
                  windowMs: updates.security.rateLimitOverride.windowMs !== undefined
                    ? updates.security.rateLimitOverride.windowMs
                    : existingSecurity.rateLimitOverride?.windowMs,
                  maxRequests: updates.security.rateLimitOverride.maxRequests !== undefined
                    ? updates.security.rateLimitOverride.maxRequests
                    : existingSecurity.rateLimitOverride?.maxRequests,
                }
              : existingSecurity.rateLimitOverride,
          };
          
          settingsUpdates.metadata = {
            ...existingMetadata,
            security: mergedSecurity
          };
        }
        
        settingsUpdates.updatedAt = new Date();
        
        await db.update(botSettings).set(settingsUpdates).where(eq(botSettings.botId, botId));
      }
      
      clearCache();
      return true;
    }
    
    return saveBotConfig(botId, updates as BotConfig);
  } catch (error) {
    structuredLogger.error('Error saving bot config async', { botId, error: String(error) });
    return false;
  }
}

export function saveBotConfig(botId: string, config: BotConfig): boolean {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      let existingConfig: BotConfig;
      try {
        existingConfig = JSON.parse(content);
      } catch (parseError) {
        structuredLogger.error('Failed to parse bot config file in saveBotConfig', {
          filePath,
          botId,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        continue;
      }
      
      if (existingConfig.botId === botId) {
        const updatedConfig = {
          ...config,
          botId: existingConfig.botId,
          clientId: existingConfig.clientId,
        };
        
        fs.writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
        clearCache();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    structuredLogger.error('Error saving bot config', { botId, error: String(error) });
    return false;
  }
}

export function createBotConfig(config: BotConfig): boolean {
  try {
    if (!fs.existsSync(BOTS_DIR)) {
      fs.mkdirSync(BOTS_DIR, { recursive: true });
    }
    
    const sanitizedBotId = config.botId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(BOTS_DIR, `${sanitizedBotId}.json`);
    
    if (fs.existsSync(filePath)) {
      structuredLogger.error('Bot config file already exists', { filePath, botId: config.botId });
      return false;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    clearCache();
    structuredLogger.info('Created new bot config', { filePath, botId: config.botId });
    return true;
  } catch (error) {
    structuredLogger.error('Error creating bot config', { botId: config.botId, error: String(error) });
    return false;
  }
}

export function getBotFileName(botId: string): string | null {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      let config: BotConfig;
      try {
        config = JSON.parse(content);
      } catch (parseError) {
        structuredLogger.error('Failed to parse bot config file in getBotFileName', {
          filePath,
          botId,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        continue;
      }
      
      if (config.botId === botId) {
        return file;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export function saveClients(clientsData: ClientsData): boolean {
  try {
    const clientsDir = path.dirname(CLIENTS_FILE);
    if (!fs.existsSync(clientsDir)) {
      fs.mkdirSync(clientsDir, { recursive: true });
    }
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clientsData, null, 2), 'utf-8');
    clearCache();
    return true;
  } catch (error) {
    structuredLogger.error('Error saving clients', { error: String(error) });
    return false;
  }
}

export function registerClient(
  clientId: string, 
  name: string, 
  type: string, 
  botId: string,
  status: 'active' | 'paused' | 'demo' = 'active'
): { success: boolean; client?: ClientRecord; error?: string } {
  try {
    const clientsData = getClients();
    
    const existingClient = clientsData.clients.find(c => c.id === clientId);
    if (existingClient) {
      if (!existingClient.bots.includes(botId)) {
        existingClient.bots.push(botId);
        saveClients(clientsData);
      }
      return { success: true, client: existingClient };
    }
    
    const newClient: ClientRecord = {
      id: clientId,
      name,
      type,
      bots: [botId],
      status,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    clientsData.clients.push(newClient);
    const saved = saveClients(clientsData);
    
    if (saved) {
      return { success: true, client: newClient };
    }
    return { success: false, error: 'Failed to save clients file' };
  } catch (error) {
    structuredLogger.error('Error registering client', { clientId, error: String(error) });
    return { success: false, error: String(error) };
  }
}

export function updateClientStatus(
  clientId: string, 
  status: 'active' | 'paused' | 'demo'
): { success: boolean; client?: ClientRecord; error?: string } {
  try {
    const clientsData = getClients();
    const client = clientsData.clients.find(c => c.id === clientId);
    
    if (!client) {
      return { success: false, error: `Client not found: ${clientId}` };
    }
    
    client.status = status;
    const saved = saveClients(clientsData);
    
    if (saved) {
      return { success: true, client };
    }
    return { success: false, error: 'Failed to save clients file' };
  } catch (error) {
    structuredLogger.error('Error updating client status', { clientId, error: String(error) });
    return { success: false, error: String(error) };
  }
}

export function updateClientPlan(
  clientId: string, 
  plan: string
): { success: boolean; client?: ClientRecord; error?: string } {
  try {
    const clientsData = getClients();
    const client = clientsData.clients.find(c => c.id === clientId);
    
    if (!client) {
      return { success: false, error: `Client not found: ${clientId}` };
    }
    
    client.plan = plan;
    const saved = saveClients(clientsData);
    
    if (saved) {
      return { success: true, client };
    }
    return { success: false, error: 'Failed to save clients file' };
  } catch (error) {
    structuredLogger.error('Error updating client plan', { clientId, error: String(error) });
    return { success: false, error: String(error) };
  }
}

export async function updateWorkspacePlan(
  slug: string,
  plan: string
): Promise<{ success: boolean; workspace?: any; error?: string }> {
  try {
    const [workspace] = await db
      .update(workspaces)
      .set({ plan })
      .where(eq(workspaces.slug, slug))
      .returning();
    
    if (!workspace) {
      return { success: false, error: `Workspace not found: ${slug}` };
    }
    
    // Also update clients.json for consistency
    const clientsData = getClients();
    const client = clientsData.clients.find(c => c.id === slug);
    if (client) {
      client.plan = plan;
      saveClients(clientsData);
    }
    
    return { success: true, workspace };
  } catch (error) {
    structuredLogger.error('Error updating workspace plan', { slug, plan, error: String(error) });
    return { success: false, error: String(error) };
  }
}

export function addBotToClient(clientId: string, botId: string): boolean {
  try {
    const clientsData = getClients();
    const client = clientsData.clients.find(c => c.id === clientId);
    
    if (!client) {
      return false;
    }
    
    if (!client.bots.includes(botId)) {
      client.bots.push(botId);
      return saveClients(clientsData);
    }
    
    return true;
  } catch (error) {
    structuredLogger.error('Error adding bot to client', { clientId, botId, error: String(error) });
    return false;
  }
}

export function getClientStatus(clientId: string): string | null {
  const client = getClientById(clientId);
  return client?.status || null;
}

export { clearCache };
