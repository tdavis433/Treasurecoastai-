import * as fs from 'fs';
import * as path from 'path';

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

export interface BotConfig {
  clientId: string;
  botId: string;
  name: string;
  description: string;
  businessProfile: BotBusinessProfile;
  rules: BotRules;
  systemPrompt: string;
  faqs: BotFaq[];
  metadata?: {
    isDemo: boolean;
    createdAt: string;
    version: string;
  };
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

export function getBotConfig(clientId: string, botId: string): BotConfig | null {
  const cacheKey = `${clientId}:${botId}`;
  
  if (isCacheValid() && botConfigCache.has(cacheKey)) {
    return botConfigCache.get(cacheKey)!;
  }
  
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const config: BotConfig = JSON.parse(content);
      
      if (config.clientId === clientId && config.botId === botId) {
        botConfigCache.set(cacheKey, config);
        cacheTimestamp = Date.now();
        return config;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading bot config for ${clientId}/${botId}:`, error);
    return null;
  }
}

export function getBotConfigByBotId(botId: string): BotConfig | null {
  if (isCacheValid()) {
    const entries = Array.from(botConfigCache.entries());
    for (const [key, config] of entries) {
      if (config.botId === botId) {
        return config;
      }
    }
  }
  
  try {
    const botFiles = fs.readdirSync(BOTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of botFiles) {
      const filePath = path.join(BOTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const config: BotConfig = JSON.parse(content);
      
      if (config.botId === botId) {
        const cacheKey = `${config.clientId}:${config.botId}`;
        botConfigCache.set(cacheKey, config);
        cacheTimestamp = Date.now();
        return config;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading bot config for botId ${botId}:`, error);
    return null;
  }
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
  const keywords = config.rules.crisisHandling.onCrisisKeywords;
  
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
}

export function getCrisisResponse(config: BotConfig): string {
  return config.rules.crisisHandling.responseTemplate;
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
