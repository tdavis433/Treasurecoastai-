import * as fs from 'fs';
import * as path from 'path';
import { db } from './storage';
import { bots, botSettings, workspaces, botTemplates } from '@shared/schema';
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
}

export interface ClientRecord {
  id: string;
  name: string;
  type: string;
  bots: string[];
  status: string;
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
    
    const businessProfile = botRecord.businessProfile as BotBusinessProfile;
    const rules = (settingsRecord?.rules || {}) as BotRules;
    const faqs = (settingsRecord?.faqs || []) as BotFaq[];
    const automations = (settingsRecord?.automations || {}) as BotAutomationConfig;
    
    const config: BotConfig = {
      clientId: workspaceRecord?.slug || botRecord.workspaceId,
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
  
  return prompt + '\n\n' + businessInfo + faqInfo;
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
      
      if (updates.faqs || updates.rules || updates.automations) {
        const settingsUpdates: any = {};
        if (updates.faqs) settingsUpdates.faqs = updates.faqs;
        if (updates.rules) settingsUpdates.rules = updates.rules;
        if (updates.automations) settingsUpdates.automations = updates.automations;
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
