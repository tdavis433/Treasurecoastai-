/**
 * Quick Book v1 API Routes
 * 
 * Service buttons → capture name/phone/email → log lead + booking intent → show "Book Now" → redirect
 * NO live slot picking. NO Square API integration. NO payment handling.
 * 
 * Guardrails:
 * 1) Tenant isolation: every intent update must verify intent.workspaceId matches current workspaceId
 * 2) Lead dedupe/upsert: prevent duplicates via workspaceId + (phone OR email) uniqueness logic
 * 3) Idempotent clicks: if intent already clicked_to_book or demo_confirmed, don't log/create again
 * 4) Friendly fallbacks: if bookingExternalUrl missing or services empty, show defaults and/or demo mode
 * 5) Store timestamps for started/lead_captured/clicked_to_book for audit + troubleshooting
 * 6) Dashboard wording must be honest: "clicked to book" ≠ "confirmed booked"
 * 7) AI must not control step order—state machine only
 */

import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";
import cors from "cors";

const widgetCors = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Widget-Token', 'X-Session-ID']
});

// Validation schemas
const startIntentSchema = z.object({
  serviceId: z.string().optional(),
  serviceName: z.string().min(1, "Service name is required"),
  priceCents: z.number().int().min(0).optional(),
  durationMins: z.number().int().min(0).optional(),
  sessionId: z.string().min(1, "Session ID is required"),
  botId: z.string().min(1, "Bot ID is required"),
});

const captureLeadSchema = z.object({
  intentId: z.string().min(1, "Intent ID is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
  message: "Either phone or email is required"
});

const clickToBookSchema = z.object({
  intentId: z.string().min(1, "Intent ID is required"),
});

const abandonIntentSchema = z.object({
  intentId: z.string().min(1, "Intent ID is required"),
});

const demoConfirmSchema = z.object({
  intentId: z.string().min(1, "Intent ID is required"),
});

export function registerQuickBookRoutes(app: Express) {
  
  /**
   * GET /api/quickbook/config/:clientId/:botId
   * Returns Quick Book configuration for the widget
   */
  app.get("/api/quickbook/config/:clientId/:botId", widgetCors, async (req: Request, res: Response) => {
    try {
      const { clientId, botId } = req.params;
      
      if (!clientId || !botId) {
        return res.status(400).json({ error: "Missing clientId or botId" });
      }
      
      // Get client settings
      const settings = await storage.getSettings(clientId);
      
      if (!settings) {
        // Guardrail #4: Friendly fallback - return demo mode if no settings
        return res.json({
          enabled: true,
          demoMode: true,
          bookingExternalUrl: null,
          services: getDefaultServices(),
        });
      }
      
      // Get services from catalog
      const services = (settings.servicesCatalog || [])
        .filter((s: any) => s.active !== false)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          priceCents: parsePriceToCents(s.price),
          durationMins: parseDurationToMins(s.duration),
          bookingUrl: s.bookingUrl,
        }));
      
      // Guardrail #4: If no services, use defaults
      const finalServices = services.length > 0 ? services : getDefaultServices();
      
      // Check workspace status too (UI "Demo" dropdown sets workspace.status = 'demo')
      const workspace = await storage.getWorkspaceByClientId(clientId);
      const isWorkspaceDemoStatus = workspace?.status === 'demo';
      
      // Determine if demo mode
      // Demo mode if: quickBookDemoMode is true, OR workspace status is 'demo', OR no external booking URL configured
      const demoMode = settings.quickBookDemoMode || isWorkspaceDemoStatus || !settings.externalBookingUrl;
      
      return res.json({
        enabled: settings.quickBookEnabled !== false,
        demoMode,
        bookingExternalUrl: settings.externalBookingUrl || null,
        bookingProviderName: settings.externalBookingProviderName || null,
        services: finalServices,
      });
    } catch (error) {
      console.error("[QuickBook] Error getting config:", error);
      // Guardrail #4: Return safe fallback on error
      return res.json({
        enabled: true,
        demoMode: true,
        bookingExternalUrl: null,
        services: getDefaultServices(),
      });
    }
  });

  /**
   * POST /api/quickbook/intent/start
   * User clicked a service button - create booking intent
   */
  app.post("/api/quickbook/intent/start/:clientId/:botId", widgetCors, async (req: Request, res: Response) => {
    try {
      const { clientId, botId } = req.params;
      
      const validation = startIntentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { serviceId, serviceName, priceCents, durationMins, sessionId } = validation.data;
      
      // Get booking URL for this service
      const settings = await storage.getSettings(clientId);
      let bookingUrl = settings?.externalBookingUrl || null;
      
      // Check for service-specific booking URL
      if (settings?.servicesCatalog) {
        const service = (settings.servicesCatalog as any[]).find(
          s => s.id === serviceId || s.name === serviceName
        );
        if (service?.bookingUrl) {
          bookingUrl = service.bookingUrl;
        }
      }
      
      // Determine handling mode - NO DEMO LEAKAGE
      // Default is 'internal' (lead capture + staff follow-up)
      // Demo when: quickBookDemoMode === true OR workspace status === 'demo'
      // External ONLY when bookingMode='external' AND bookingUrl exists
      let handling: 'internal' | 'external' | 'demo' = 'internal';
      
      // Check if workspace is in demo status (from workspace dropdown)
      const workspace = await storage.getWorkspaceByClientId(clientId);
      const isWorkspaceDemoStatus = workspace?.status === 'demo';
      
      if (settings?.quickBookDemoMode === true || isWorkspaceDemoStatus) {
        handling = 'demo';
      } else if (settings?.bookingMode === 'external' && bookingUrl) {
        handling = 'external';
      }
      // else handling stays 'internal' (default - no demo leakage)
      
      // Create booking intent - Guardrail #5: timestamp recorded via startedAt default
      // Only store externalUrl for external/demo handling; internal = null
      const intent = await storage.createBookingIntent({
        workspaceId: clientId,
        clientId,
        sessionId,
        bookingType: 'service_booking',
        serviceId: serviceId || null,
        serviceName,
        priceCents: priceCents || null,
        durationMins: durationMins || null,
        handling,
        externalUrl: handling === 'internal' ? null : bookingUrl,
        externalProviderName: handling === 'internal' ? null : (settings?.externalBookingProviderName || null),
        status: 'started',
      });
      
      return res.json({
        ok: true,
        intentId: intent.id,
        handling,
      });
    } catch (error) {
      console.error("[QuickBook] Error starting intent:", error);
      return res.status(500).json({ error: "Failed to start booking intent" });
    }
  });

  /**
   * POST /api/quickbook/intent/lead
   * Capture contact info and create/update lead
   */
  app.post("/api/quickbook/intent/lead/:clientId/:botId", widgetCors, async (req: Request, res: Response) => {
    try {
      const { clientId, botId } = req.params;
      
      const validation = captureLeadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { intentId, name, phone, email } = validation.data;
      
      // Guardrail #1: Verify intent belongs to this workspace
      const intent = await storage.getBookingIntentById(intentId);
      if (!intent || intent.workspaceId !== clientId) {
        return res.status(404).json({ error: "Booking intent not found" });
      }
      
      // Guardrail #3: Check if already past lead_captured
      if (['clicked_to_book', 'demo_confirmed', 'confirmed', 'redirected'].includes(intent.status)) {
        // Already progressed - return existing data
        return res.json({
          ok: true,
          leadId: intent.leadId,
          alreadyCaptured: true,
        });
      }
      
      // Guardrail #2: Upsert lead with dedupe logic
      const lead = await storage.upsertQuickBookLead(clientId, botId, intent.sessionId, {
        name,
        phone,
        email,
        serviceName: intent.serviceName || undefined,
        intentId,
      });
      
      // Update intent with contact info and lead link - Guardrail #5: timestamp
      await storage.updateBookingIntent(intentId, {
        leadId: lead.id,
        contactName: name,
        contactPhone: phone || null,
        contactEmail: email || null,
        status: 'lead_captured',
        leadCapturedAt: new Date(),
      });
      
      return res.json({
        ok: true,
        leadId: lead.id,
      });
    } catch (error) {
      console.error("[QuickBook] Error capturing lead:", error);
      return res.status(500).json({ error: "Failed to capture contact info" });
    }
  });

  /**
   * POST /api/quickbook/intent/click
   * User clicked "Book Now" - determine response based on handling mode
   * - external: redirect to external URL, log click, set clicked_to_book
   * - demo: redirect to demo confirmation page, log click, set clicked_to_book
   * - internal: no redirect, no click logged, no status change, show message
   */
  app.post("/api/quickbook/intent/click/:clientId/:botId", widgetCors, async (req: Request, res: Response) => {
    try {
      const { clientId, botId } = req.params;
      
      const validation = clickToBookSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { intentId } = validation.data;
      
      // Guardrail #1: Verify intent belongs to this workspace
      const intent = await storage.getBookingIntentById(intentId);
      if (!intent || intent.workspaceId !== clientId) {
        return res.status(404).json({ error: "Booking intent not found" });
      }
      
      // Use the stored handling mode from intent creation - no runtime overrides
      const handling = (intent.handling as 'internal' | 'external' | 'demo') || 'internal';
      
      // Prepare URLs based on handling mode
      const externalUrl = intent.externalUrl || null;
      const demoUrl = `/demo-booking-confirmation?intentId=${intentId}`;
      
      // Guardrail #3: Idempotent - if already clicked, return existing data
      if (['clicked_to_book', 'demo_confirmed', 'confirmed', 'redirected'].includes(intent.status)) {
        return res.json({
          ok: true,
          redirectType: handling,
          url: handling === 'external' ? externalUrl : 
               handling === 'demo' ? demoUrl : 
               null,
          message: handling === 'internal' ? 'Our team will reach out to confirm your booking.' : undefined,
          alreadyClicked: true,
        });
      }
      
      // ========== HANDLING MODE: INTERNAL ==========
      // - NO status change (keep at lead_captured)
      // - NO booking_link_click event (no link was clicked)
      // - Create appointment for staff follow-up
      // - Return confirmation message only
      if (handling === 'internal') {
        // Update lead status to pending_followup
        if (intent.leadId) {
          await storage.updateLead(clientId, intent.leadId, { 
            bookingStatus: 'pending_followup',
            status: 'qualified',
          });
        }
        
        // Create appointment for staff to follow up (but don't change intent status)
        if (intent.contactName) {
          try {
            const appointment = await storage.createAppointment(clientId, {
              sessionId: intent.sessionId || undefined,
              name: intent.contactName || 'Quick Book Customer',
              contact: intent.contactPhone || intent.contactEmail || '',
              email: intent.contactEmail || undefined,
              preferredTime: 'To be scheduled',
              contactPreference: intent.contactPhone ? 'phone' : 'email',
              appointmentType: intent.serviceName || 'Quick Book Service',
              notes: `Quick Book: ${intent.serviceName || 'Service'} - ${intent.priceCents ? `$${(intent.priceCents / 100).toFixed(2)}` : 'Price TBD'} - Staff follow-up required`,
            });
            console.log(`[QuickBook] Created appointment ${appointment.id} for internal follow-up, intent ${intentId}`);
          } catch (appointmentError) {
            console.error("[QuickBook] Error creating appointment (non-fatal):", appointmentError);
          }
        }
        
        return res.json({
          ok: true,
          redirectType: 'internal',
          url: null,
          message: 'Our team will reach out to confirm your booking.',
        });
      }
      
      // ========== HANDLING MODE: EXTERNAL ==========
      // - Set status='clicked_to_book', clickedToBookAt
      // - Log booking_link_click with external URL
      // - Do NOT create appointment (external system handles it)
      if (handling === 'external') {
        await storage.updateBookingIntent(intentId, {
          status: 'clicked_to_book',
          clickedToBookAt: new Date(),
        });
        
        // Log link click for external redirects
        await storage.logBookingLinkClickEvent({
          clientId,
          botId,
          sessionId: intent.sessionId,
          leadId: intent.leadId || undefined,
          bookingUrl: externalUrl || 'external_booking',
        });
        
        // Update lead status
        if (intent.leadId) {
          await storage.updateLead(clientId, intent.leadId, { 
            bookingStatus: 'pending_redirect',
          });
        }
        
        return res.json({
          ok: true,
          redirectType: 'external',
          url: externalUrl,
        });
      }
      
      // ========== HANDLING MODE: DEMO ==========
      // - Set status='clicked_to_book', clickedToBookAt
      // - Log booking_link_click (a link IS clicked)
      // - Do NOT create appointment (demo confirm endpoint creates it)
      await storage.updateBookingIntent(intentId, {
        status: 'clicked_to_book',
        clickedToBookAt: new Date(),
      });
      
      // Log link click for demo redirects
      await storage.logBookingLinkClickEvent({
        clientId,
        botId,
        sessionId: intent.sessionId,
        leadId: intent.leadId || undefined,
        bookingUrl: demoUrl,
      });
      
      // Update lead status
      if (intent.leadId) {
        await storage.updateLead(clientId, intent.leadId, { 
          bookingStatus: 'pending_demo',
        });
      }
      
      return res.json({
        ok: true,
        redirectType: 'demo',
        url: demoUrl,
      });
    } catch (error) {
      console.error("[QuickBook] Error processing click:", error);
      return res.status(500).json({ error: "Failed to process booking click" });
    }
  });

  /**
   * POST /api/quickbook/intent/abandon
   * User abandoned the booking flow
   */
  app.post("/api/quickbook/intent/abandon/:clientId/:botId", widgetCors, async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      
      const validation = abandonIntentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { intentId } = validation.data;
      
      // Guardrail #1: Verify intent belongs to this workspace
      const intent = await storage.getBookingIntentById(intentId);
      if (!intent || intent.workspaceId !== clientId) {
        return res.status(404).json({ error: "Booking intent not found" });
      }
      
      // Don't abandon if already completed
      if (['demo_confirmed', 'confirmed', 'redirected'].includes(intent.status)) {
        return res.json({ ok: true, alreadyCompleted: true });
      }
      
      await storage.updateBookingIntent(intentId, {
        status: 'abandoned',
      });
      
      return res.json({ ok: true });
    } catch (error) {
      console.error("[QuickBook] Error abandoning intent:", error);
      return res.status(500).json({ error: "Failed to abandon booking intent" });
    }
  });

  /**
   * POST /api/quickbook/demo/confirm
   * Confirm a demo booking (for demo mode only)
   */
  app.post("/api/quickbook/demo/confirm", widgetCors, async (req: Request, res: Response) => {
    try {
      const validation = demoConfirmSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      const { intentId } = validation.data;
      
      // Get intent
      const intent = await storage.getBookingIntentById(intentId);
      if (!intent) {
        return res.status(404).json({ error: "Booking intent not found" });
      }
      
      // GUARD: Only allow demo confirmation for intents with handling='demo'
      // This prevents demo confirmation from polluting real client data
      if (intent.handling !== 'demo') {
        return res.status(403).json({ 
          error: "Demo confirmation not enabled for this booking",
          handling: intent.handling 
        });
      }
      
      // Guardrail #3: Idempotent - if already confirmed, return success
      if (intent.status === 'demo_confirmed' || intent.status === 'confirmed') {
        return res.json({ 
          ok: true, 
          alreadyConfirmed: true,
          intentId: intent.id,
        });
      }
      
      // Update intent to demo_confirmed
      await storage.updateBookingIntent(intentId, {
        status: 'demo_confirmed',
        confirmedAt: new Date(),
      });
      
      // Update lead status if linked
      if (intent.leadId) {
        await storage.updateLead(intent.workspaceId, intent.leadId, {
          bookingStatus: 'demo_confirmed',
          status: 'qualified',
        });
      }
      
      // Create appointment record so booking shows in Bookings tab
      try {
        const appointment = await storage.createAppointment(intent.workspaceId, {
          sessionId: intent.sessionId || undefined,
          name: intent.contactName || 'Quick Book Customer',
          contact: intent.contactPhone || intent.contactEmail || '',
          email: intent.contactEmail || undefined,
          preferredTime: 'To be scheduled',
          contactPreference: intent.contactPhone ? 'phone' : 'email',
          appointmentType: intent.serviceName || 'Quick Book Service',
          notes: `Quick Book: ${intent.serviceName || 'Service'} - ${intent.priceCents ? `$${(intent.priceCents / 100).toFixed(2)}` : 'Price TBD'}`,
        });
        console.log(`[QuickBook] Created appointment ${appointment.id} for intent ${intentId}`);
      } catch (appointmentError) {
        // Log but don't fail the confirmation if appointment creation fails
        console.error("[QuickBook] Error creating appointment (non-fatal):", appointmentError);
      }
      
      return res.json({
        ok: true,
        intentId: intent.id,
      });
    } catch (error) {
      console.error("[QuickBook] Error confirming demo:", error);
      return res.status(500).json({ error: "Failed to confirm demo booking" });
    }
  });

  /**
   * GET /api/quickbook/intent/:intentId
   * Get intent details (for demo confirmation page)
   */
  app.get("/api/quickbook/intent/:intentId", widgetCors, async (req: Request, res: Response) => {
    try {
      const { intentId } = req.params;
      
      const intent = await storage.getBookingIntentById(intentId);
      if (!intent) {
        return res.status(404).json({ error: "Booking intent not found" });
      }
      
      // Get client settings for business info
      const settings = await storage.getSettings(intent.workspaceId);
      
      return res.json({
        id: intent.id,
        serviceName: intent.serviceName,
        priceCents: intent.priceCents,
        durationMins: intent.durationMins,
        contactName: intent.contactName,
        contactPhone: intent.contactPhone,
        contactEmail: intent.contactEmail,
        status: intent.status,
        businessName: settings?.businessName || 'Business',
        logoUrl: settings?.logoUrl,
        primaryColor: settings?.primaryColor,
      });
    } catch (error) {
      console.error("[QuickBook] Error getting intent:", error);
      return res.status(500).json({ error: "Failed to get booking intent" });
    }
  });

  /**
   * GET /api/quickbook/intents/:clientId
   * Get booking intents for dashboard (requires auth)
   */
  app.get("/api/quickbook/intents/:clientId", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      
      // TODO: Add auth check here for production
      
      const intents = await storage.getBookingIntents(clientId, { 
        status: status || undefined,
        limit 
      });
      
      // Guardrail #6: Honest status wording in response
      const formattedIntents = intents.map(intent => ({
        id: intent.id,
        serviceName: intent.serviceName,
        priceCents: intent.priceCents,
        customerName: intent.contactName,
        customerPhone: intent.contactPhone,
        customerEmail: intent.contactEmail,
        status: intent.status,
        statusLabel: getStatusLabel(intent.status),
        startedAt: intent.startedAt,
        leadCapturedAt: intent.leadCapturedAt,
        clickedToBookAt: intent.clickedToBookAt,
        confirmedAt: intent.confirmedAt,
        leadId: intent.leadId,
      }));
      
      return res.json({ intents: formattedIntents });
    } catch (error) {
      console.error("[QuickBook] Error getting intents:", error);
      return res.status(500).json({ error: "Failed to get booking intents" });
    }
  });
}

// Helper functions

function parsePriceToCents(price?: string): number | undefined {
  if (!price) return undefined;
  // Remove $ and other non-numeric chars, parse as float, convert to cents
  const cleaned = price.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : Math.round(parsed * 100);
}

function parseDurationToMins(duration?: string): number | undefined {
  if (!duration) return undefined;
  // Try to extract minutes from strings like "45 minutes", "1 hour", "90 min"
  const minMatch = duration.match(/(\d+)\s*(?:min|minute)/i);
  if (minMatch) return parseInt(minMatch[1]);
  
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour)/i);
  if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 60);
  
  // Just try parsing as number
  const num = parseInt(duration);
  return isNaN(num) ? undefined : num;
}

function getDefaultServices() {
  return [
    { id: 'default_service_1', name: 'Standard Service', priceCents: 5000, durationMins: 60 },
    { id: 'default_service_2', name: 'Premium Service', priceCents: 10000, durationMins: 90 },
  ];
}

// Guardrail #6: Honest status labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'started': 'Started booking',
    'lead_captured': 'Contact info collected',
    'clicked_to_book': 'Clicked to book (pending)', // NOT "confirmed"
    'demo_confirmed': 'Demo booking confirmed',
    'redirected': 'Redirected to booking page',
    'confirmed': 'Booking confirmed',
    'abandoned': 'Abandoned',
    'cancelled': 'Cancelled',
  };
  return labels[status] || status;
}
