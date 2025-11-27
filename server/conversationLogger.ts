import * as fs from 'fs';
import * as path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

export interface ConversationLogEntry {
  timestamp: string;
  clientId: string;
  botId: string;
  userMessage: string;
  botReply: string;
  sessionId?: string;
}

function ensureLogDirectory(clientId: string): string {
  const clientLogDir = path.join(LOGS_DIR, clientId);
  
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(clientLogDir)) {
    fs.mkdirSync(clientLogDir, { recursive: true });
  }
  
  return clientLogDir;
}

function getLogFileName(botId: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  return `${botId}-${dateStr}.log`;
}

export function logConversation(entry: ConversationLogEntry): void {
  try {
    const clientLogDir = ensureLogDirectory(entry.clientId);
    const logFileName = getLogFileName(entry.botId);
    const logFilePath = path.join(clientLogDir, logFileName);
    
    const logLine = JSON.stringify({
      timestamp: entry.timestamp || new Date().toISOString(),
      clientId: entry.clientId,
      botId: entry.botId,
      sessionId: entry.sessionId,
      userMessage: entry.userMessage,
      botReply: entry.botReply
    }) + '\n';
    
    fs.appendFileSync(logFilePath, logLine, 'utf-8');
  } catch (error) {
    console.error('Error logging conversation:', error);
  }
}

export function getConversationLogs(
  clientId: string, 
  botId?: string, 
  date?: string
): ConversationLogEntry[] {
  try {
    const clientLogDir = path.join(LOGS_DIR, clientId);
    
    if (!fs.existsSync(clientLogDir)) {
      return [];
    }
    
    const logFiles = fs.readdirSync(clientLogDir).filter(f => f.endsWith('.log'));
    const entries: ConversationLogEntry[] = [];
    
    for (const file of logFiles) {
      if (botId && !file.startsWith(botId)) {
        continue;
      }
      
      if (date) {
        const dateStr = date.replace(/-/g, '');
        if (!file.includes(dateStr)) {
          continue;
        }
      }
      
      const filePath = path.join(clientLogDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as ConversationLogEntry;
          entries.push(entry);
        } catch (parseError) {
          console.error('Error parsing log line:', parseError);
        }
      }
    }
    
    return entries.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error reading conversation logs:', error);
    return [];
  }
}

export function getLogStats(clientId: string): {
  totalConversations: number;
  messageCount: number;
  botIds: string[];
  dateRange: { first: string; last: string } | null;
} {
  try {
    const logs = getConversationLogs(clientId);
    
    if (logs.length === 0) {
      return {
        totalConversations: 0,
        messageCount: 0,
        botIds: [],
        dateRange: null
      };
    }
    
    const sessionIds = new Set(logs.filter(l => l.sessionId).map(l => l.sessionId));
    const botIds = Array.from(new Set(logs.map(l => l.botId)));
    
    return {
      totalConversations: sessionIds.size || Math.ceil(logs.length / 2),
      messageCount: logs.length,
      botIds,
      dateRange: {
        first: logs[0].timestamp,
        last: logs[logs.length - 1].timestamp
      }
    };
  } catch (error) {
    console.error('Error getting log stats:', error);
    return {
      totalConversations: 0,
      messageCount: 0,
      botIds: [],
      dateRange: null
    };
  }
}
