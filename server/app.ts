import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { registerRoutes } from "./routes";
import { createCsrfMiddleware, csrfTokenEndpoint } from "./csrfMiddleware";
import { requestIdMiddleware } from "./requestId";
import { structuredLogger, redactPII } from "./structuredLogger";

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgStore = connectPgSimple(session);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

// Trust proxy for rate limiting to work correctly behind reverse proxies
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Session types are declared in types.d.ts

// Build CSP directives based on environment
const isDev = process.env.NODE_ENV !== 'production';
const cspConnectSrc = isDev 
  ? ["'self'", "https://api.openai.com", "https://api.stripe.com", "ws:", "wss:"]
  : ["'self'", "https://api.openai.com", "https://api.stripe.com"];

// Security: Helmet for secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: cspConnectSrc,
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow widget embedding
}));

// Request ID middleware - generates unique ID per request for tracing
app.use(requestIdMiddleware);

// Stripe webhook MUST come before json body parser (needs raw body)
app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const { WebhookHandlers } = await import('./webhookHandlers');
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Body parsers with payload limits - MUST come before rate limiting and routes
// Limit JSON payloads to 100KB to prevent abuse
app.use(express.json({
  limit: '100kb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Security: CORS for widget embeds on third-party sites ONLY
// Admin/internal routes use same-origin policy (no CORS)
// Configure allowed origins via WIDGET_ALLOWED_ORIGINS environment variable
// Format: comma-separated list of domains (e.g., "https://example.com,https://client.com")
// In development, localhost origins are always allowed
const parseAllowedOrigins = (): string[] => {
  const envOrigins = process.env.WIDGET_ALLOWED_ORIGINS || '';
  const origins = envOrigins
    .split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0);
  
  // In development, always allow localhost origins
  if (isDev) {
    origins.push(
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173'
    );
  }
  
  return origins;
};

const allowedWidgetOrigins = parseAllowedOrigins();

const widgetCorsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-side requests)
    if (!origin) return callback(null, true);
    
    // If no allowed origins configured, allow all (backwards compatibility)
    if (allowedWidgetOrigins.length === 0) {
      return callback(null, true);
    }
    
    // Check if origin is in the allow-list
    if (allowedWidgetOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, be more permissive
    if (isDev) {
      console.log(`[CORS] Allowing dev origin: ${origin}`);
      return callback(null, true);
    }
    
    // Origin not allowed
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: false, // Widget doesn't need credentials
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};
// Only apply CORS to widget-specific routes
app.use('/api/chat/:clientId/:botId', cors(widgetCorsOptions));
app.use('/widget', cors(widgetCorsOptions));
app.use('/api/widget', cors(widgetCorsOptions));

// Security: Rate limiting to prevent abuse
// In development mode, use higher limits to allow QA testing (isDev is declared above)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Higher limit in dev for testing
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for Stripe webhooks and health check
    return req.path.startsWith('/api/stripe/webhook') || req.path === '/api/health';
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10, // Higher limit in dev for testing
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 100 : 30, // Higher limit in dev for testing
  message: { error: 'Too many messages, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tenant-specific rate limiter for widget chat (per clientId/botId combination)
// Supports both path params and body params for flexibility
const tenantChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: isDev ? 1000 : 500, // 500 messages per hour per tenant in production
  message: { error: 'Message limit reached for this assistant. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Try path params first, then fall back to body params
    const clientId = req.params.clientId || req.body?.clientId || 'unknown';
    const botId = req.params.botId || req.body?.botId || 'unknown';
    return `tenant:${clientId}:${botId}`;
  },
});

// Daily message cap limiter (resets every 24 hours)
const dailyMessageLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: isDev ? 10000 : 2000, // 2000 messages per day per tenant in production
  message: { error: 'Daily message limit reached. Please try again tomorrow or upgrade your plan.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const clientId = req.params.clientId || req.body?.clientId || 'unknown';
    const botId = req.params.botId || req.body?.botId || 'unknown';
    return `daily:${clientId}:${botId}`;
  },
});

// Apply rate limiting to specific routes (after body parsers)
app.use('/api/auth/login', authLimiter);
// Apply tenant + daily + burst limits to all chat routes (both with and without path params)
app.use('/api/chat/:clientId/:botId', tenantChatLimiter, dailyMessageLimiter, chatLimiter);
app.use('/api/chat', tenantChatLimiter, dailyMessageLimiter, chatLimiter);
app.use('/api/', apiLimiter);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set for security. Please set a strong random secret.");
}

app.use(session({
  store: new PgStore({
    pool: pgPool as any,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax' // Prevent CSRF while allowing normal navigation
  }
}));

// Cookie parser for CSRF tokens
app.use(cookieParser());

// CSRF token endpoint (must be before CSRF protection middleware)
app.get('/api/csrf-token', csrfTokenEndpoint);

// CSRF protection for state-changing requests (skip public endpoints)
app.use(createCsrfMiddleware());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      const logMethod = level === 'error' ? structuredLogger.error : level === 'warn' ? structuredLogger.warn : structuredLogger.info;
      
      logMethod(`${req.method} ${path} ${res.statusCode}`, {
        requestId: req.requestId,
        duration,
        method: req.method,
        path: redactPII(path),
        statusCode: res.statusCode,
        userId: (req.session as any)?.userId,
      });
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    structuredLogger.error('Unhandled error', {
      requestId: req.requestId,
      statusCode: status,
      error: message,
      stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    });

    res.status(status).json({ message });
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}
