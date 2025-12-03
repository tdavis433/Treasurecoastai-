import * as fs from 'fs';
import * as path from 'path';
import { db } from './storage';
import { bots, botSettings, workspaces, botTemplates, clientSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
    successMessage?: string;
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
  externalBookingUrl?: string;
  externalPaymentUrl?: string;
  metadata?: {
    isDemo: boolean;
    isTemplate?: boolean;
    templateCategory?: string;
    clonedFrom?: string;
    createdAt: string;
    version: string;
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
    console.error(`Error loading bot from database for botId ${botId}:`, error);
    return null;
  }
}

function loadBotFromJson(clientId: string, botId: string): BotConfig | null {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const config: BotConfig = JSON.parse(content);
      
      if (config.clientId === clientId && config.botId === botId) {
        return config;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading bot config from JSON for ${clientId}/${botId}:`, error);
    return null;
  }
}

function loadBotFromJsonByBotId(botId: string): BotConfig | null {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const config: BotConfig = JSON.parse(content);
      
      if (config.botId === botId) {
        return config;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading bot config from JSON for botId ${botId}:`, error);
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
      console.warn(`Security: Bot ${botId} requested with clientId ${clientId} but belongs to ${dbConfig.clientId}`);
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
      const config: BotConfig = JSON.parse(content);
      configs.push(config);
      
      const cacheKey = `${config.clientId}:${config.botId}`;
      botConfigCache.set(cacheKey, config);
    }
    
    cacheTimestamp = Date.now();
    return configs;
  } catch (error) {
    console.error('Error loading all bot configs:', error);
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
    console.error('Error loading all bot configs async:', error);
    return getAllBotConfigs();
  }
}

export async function getAllTemplates(): Promise<any[]> {
  try {
    const templates = await db.select().from(botTemplates).where(eq(botTemplates.isActive, true));
    return templates;
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export async function getTemplateById(templateId: string): Promise<any | null> {
  try {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.templateId, templateId)).limit(1);
    return template || null;
  } catch (error) {
    console.error('Error loading template:', error);
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
      clientsCache = JSON.parse(content);
      cacheTimestamp = Date.now();
      return clientsCache!;
    }
    
    return { clients: [] };
  } catch (error) {
    console.error('Error loading clients:', error);
    return { clients: [] };
  }
}

export async function getWorkspaces(): Promise<any[]> {
  try {
    const workspaceList = await db.select().from(workspaces);
    return workspaceList;
  } catch (error) {
    console.error('Error loading workspaces:', error);
    return [];
  }
}

export async function getWorkspaceBySlug(slug: string): Promise<any | null> {
  try {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    return workspace || null;
  } catch (error) {
    console.error('Error loading workspace:', error);
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
    console.error('Error creating workspace:', error);
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
    console.error('Error updating workspace:', error);
    throw error;
  }
}

export async function deleteWorkspace(slug: string): Promise<boolean> {
  try {
    const result = await db.delete(workspaces).where(eq(workspaces.slug, slug));
    return true;
  } catch (error) {
    console.error('Error deleting workspace:', error);
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
    console.error('Error loading bots by workspace:', error);
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

export function buildSystemPromptFromConfig(config: BotConfig): string {
  let prompt = config.systemPrompt;
  
  const bp = config.businessProfile;
  const businessInfo = `
BUSINESS INFORMATION:
- Name: ${bp.businessName}
- Type: ${bp.type}
- Location: ${bp.location}
- Phone: ${bp.phone}
- Email: ${bp.email}
- Website: ${bp.website}
${bp.services ? `- Services: ${bp.services.join(', ')}` : ''}
${bp.amenities ? `- Amenities: ${bp.amenities.join(', ')}` : ''}
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
  let bookingInfo = `

APPOINTMENT BOOKING CAPABILITY:
You have the ability to help customers book appointments directly through this chat. When a customer wants to schedule a service, appointment, or visit:
1. DO NOT tell them to call or visit a website - you can book it for them right here
2. Ask for the details you need: what service they want, their preferred date/time, and their contact information
3. Be proactive - offer to schedule an appointment when discussing services
4. Say something like "I can help you schedule that right now! What day and time works best for you?"
5. Collect: name, phone number, preferred date/time, and the service they need
6. Confirm the details before finalizing

IMPORTANT: Never say "I can't book for you" or direct customers elsewhere to schedule. You ARE the booking system.
`;

  // Add external booking/payment URLs if configured
  if (config.externalBookingUrl || config.externalPaymentUrl) {
    bookingInfo += `
AFTER BOOKING - PROVIDE LINKS:
After you've collected all the booking information and confirmed the appointment:`;
    
    if (config.externalBookingUrl) {
      bookingInfo += `
- Direct the customer to complete their booking at: ${config.externalBookingUrl}
  Say something like: "Great! To finalize your appointment, please complete your booking here: ${config.externalBookingUrl}"`;
    }
    
    if (config.externalPaymentUrl) {
      bookingInfo += `
- If payment is required, direct them to: ${config.externalPaymentUrl}
  Say something like: "You can complete your payment securely here: ${config.externalPaymentUrl}"`;
    }
    
    bookingInfo += `
Always provide these links after confirming the appointment details - this is how customers finalize their booking.
`;
  }
  
  return prompt + '\n\n' + businessInfo + faqInfo + personalityInfo + bookingInfo;
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
    console.error(`Error saving bot config async for ${botId}:`, error);
    return false;
  }
}

export function saveBotConfig(botId: string, config: BotConfig): boolean {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const existingConfig: BotConfig = JSON.parse(content);
      
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
    console.error(`Error saving bot config for ${botId}:`, error);
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
      console.error(`Bot config file already exists: ${filePath}`);
      return false;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    clearCache();
    console.log(`Created new bot config: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error creating bot config for ${config.botId}:`, error);
    return false;
  }
}

export function getBotFileName(botId: string): string | null {
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const config: BotConfig = JSON.parse(content);
      
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
    console.error('Error saving clients:', error);
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
    console.error('Error registering client:', error);
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
    console.error('Error updating client status:', error);
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
    console.error('Error updating client plan:', error);
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
    console.error('Error updating workspace plan:', error);
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
    console.error('Error adding bot to client:', error);
    return false;
  }
}

export function getClientStatus(clientId: string): string | null {
  const client = getClientById(clientId);
  return client?.status || null;
}

export { clearCache };
