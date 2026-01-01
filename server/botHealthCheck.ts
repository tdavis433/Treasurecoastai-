import { getBotConfigByBotIdAsync } from "./botConfig";
import { orchestrator } from "./orchestrator";
import { structuredLogger } from "./structuredLogger";

export interface HealthCheckTest {
  id: string;
  name: string;
  description: string;
  query: string;
  expectedPatterns: RegExp[];
  status: 'pending' | 'pass' | 'fail' | 'warning';
  response?: string;
  responseTimeMs?: number;
  issues?: string[];
}

export interface BotHealthCheckResult {
  botId: string;
  clientId: string;
  timestamp: string;
  overallStatus: 'healthy' | 'issues' | 'critical';
  score: number;
  tests: HealthCheckTest[];
  recommendations: string[];
}

const TEST_DEFINITIONS = [
  {
    id: 'hours',
    name: 'Business Hours',
    description: 'Verifies the bot correctly responds with operating hours',
    query: 'What are your hours?',
    expectedPatterns: [
      /\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)/i,
      /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
      /open|close|hour/i
    ]
  },
  {
    id: 'services',
    name: 'Services/Pricing',
    description: 'Verifies the bot can describe services or pricing',
    query: 'What services do you offer and how much do they cost?',
    expectedPatterns: [
      /\$\d+|\d+\s*dollars?/i,
      /service|offer|provid|treatment|cut|style/i
    ]
  },
  {
    id: 'booking',
    name: 'Booking Intent',
    description: 'Verifies the bot responds appropriately to booking requests',
    query: 'I would like to book an appointment',
    expectedPatterns: [
      /book|appointment|schedule|reserve|available|name|phone|email|contact/i
    ]
  },
  {
    id: 'walkins',
    name: 'Walk-in Policy',
    description: 'Verifies the bot can answer walk-in questions',
    query: 'Do you accept walk-ins?',
    expectedPatterns: [
      /walk.?in|accept|welcome|appointment|recommend|call|come in/i
    ]
  },
  {
    id: 'greeting',
    name: 'Greeting Response',
    description: 'Verifies the bot provides a friendly greeting',
    query: 'Hello!',
    expectedPatterns: [
      /hello|hi|hey|welcome|help|assist/i
    ]
  }
];

export async function runBotHealthCheck(clientId: string, botId: string): Promise<BotHealthCheckResult> {
  const startTime = Date.now();
  const tests: HealthCheckTest[] = [];
  const recommendations: string[] = [];
  
  structuredLogger.info(`[HealthCheck] Starting health check for ${clientId}/${botId}`);
  
  const botConfig = await getBotConfigByBotIdAsync(botId);
  if (!botConfig) {
    return {
      botId,
      clientId,
      timestamp: new Date().toISOString(),
      overallStatus: 'critical',
      score: 0,
      tests: [],
      recommendations: ['Bot configuration not found. Please ensure the bot is properly configured.']
    };
  }
  
  const sessionId = `healthcheck_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  for (const testDef of TEST_DEFINITIONS) {
    const testStartTime = Date.now();
    const test: HealthCheckTest = {
      id: testDef.id,
      name: testDef.name,
      description: testDef.description,
      query: testDef.query,
      expectedPatterns: testDef.expectedPatterns,
      status: 'pending',
      issues: []
    };
    
    try {
      const response = await orchestrator.processMessage({
        clientId,
        botId,
        messages: [{ role: 'user', content: testDef.query }],
        sessionId,
        language: 'en',
        source: 'api'
      });
      
      test.responseTimeMs = Date.now() - testStartTime;
      
      if (!response.success) {
        test.status = 'fail';
        test.issues = [response.error || 'Failed to get response from bot'];
      } else {
        test.response = response.reply;
        
        const matchedPatterns = testDef.expectedPatterns.filter(p => p.test(response.reply));
        const matchRatio = matchedPatterns.length / testDef.expectedPatterns.length;
        
        if (matchRatio >= 0.5) {
          test.status = 'pass';
        } else if (matchRatio > 0) {
          test.status = 'warning';
          test.issues = ['Response may not fully address the question'];
        } else {
          test.status = 'fail';
          test.issues = ['Response does not appear to contain expected information'];
        }
        
        if (test.responseTimeMs > 5000) {
          if (test.status === 'pass') test.status = 'warning';
          test.issues = test.issues || [];
          test.issues.push('Response time exceeded 5 seconds');
        }
      }
    } catch (error) {
      test.status = 'fail';
      test.responseTimeMs = Date.now() - testStartTime;
      test.issues = [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`];
    }
    
    tests.push(test);
  }
  
  const passCount = tests.filter(t => t.status === 'pass').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  
  const score = Math.round(((passCount * 100) + (warningCount * 50)) / tests.length);
  
  let overallStatus: 'healthy' | 'issues' | 'critical';
  if (failCount === 0 && warningCount === 0) {
    overallStatus = 'healthy';
  } else if (failCount >= 2 || score < 50) {
    overallStatus = 'critical';
  } else {
    overallStatus = 'issues';
  }
  
  if (tests.find(t => t.id === 'hours' && t.status !== 'pass')) {
    recommendations.push('Configure business hours in the assistant settings');
  }
  if (tests.find(t => t.id === 'services' && t.status !== 'pass')) {
    recommendations.push('Add service information and pricing to the knowledge base');
  }
  if (tests.find(t => t.id === 'booking' && t.status !== 'pass')) {
    recommendations.push('Review booking configuration and lead capture settings');
  }
  if (tests.find(t => t.id === 'walkins' && t.status !== 'pass')) {
    recommendations.push('Add walk-in policy information to FAQs or knowledge base');
  }
  
  const totalTime = Date.now() - startTime;
  structuredLogger.info(`[HealthCheck] Completed for ${clientId}/${botId} in ${totalTime}ms - Score: ${score}%`);
  
  return {
    botId,
    clientId,
    timestamp: new Date().toISOString(),
    overallStatus,
    score,
    tests,
    recommendations
  };
}
