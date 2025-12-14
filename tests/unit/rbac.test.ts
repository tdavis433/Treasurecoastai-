import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

/**
 * RBAC Regression Tests
 * 
 * These tests verify the 3-tier access control system:
 * - Operational: owner, manager, staff, agent (day-to-day ops)
 * - Config: owner, manager, staff (settings, exports)
 * - Destructive: owner only (deletions)
 * 
 * Key scenarios tested:
 * 1. Agent gets 403 on config routes
 * 2. Agent gets 200 on operational routes
 * 3. Missing membership → 403 on client-scoped routes
 */

// Mock storage and dependencies
const mockStorage = {
  getLeadById: async (clientId: string, id: string) => ({
    id,
    clientId,
    name: 'Test Lead',
    status: 'new',
  }),
  updateLead: async (clientId: string, id: string, data: any) => ({
    id,
    clientId,
    ...data,
    updatedAt: new Date(),
  }),
  getAppointmentById: async (clientId: string, id: string) => ({
    id,
    clientId,
    name: 'Test Appointment',
    status: 'new',
  }),
  updateAppointment: async (clientId: string, id: string, data: any) => ({
    id,
    clientId,
    ...data,
  }),
  checkWorkspaceMembership: async (userId: string, clientId: string) => {
    // Return null for 'no_membership_user' to simulate missing membership
    if (userId === 'no_membership_user') return null;
    // Return agent role for 'agent_user'
    if (userId === 'agent_user') return { role: 'agent', status: 'active', workspaceId: 'ws_test' };
    // Return owner role for 'owner_user'
    if (userId === 'owner_user') return { role: 'owner', status: 'active', workspaceId: 'ws_test' };
    return null;
  },
};

// Create test app with RBAC middleware
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
  }));

  // Mock CSRF (skip for tests)
  app.use((req, res, next) => next());

  // requireClientAuth middleware (simplified for testing)
  const requireClientAuth = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const clientId = req.session.clientId;
    if (!clientId) {
      return res.status(403).json({ error: 'Access denied. No workspace context.' });
    }

    // Check workspace membership
    const membership = await mockStorage.checkWorkspaceMembership(req.session.userId, clientId);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this workspace.' });
    }

    req.effectiveClientId = clientId;
    req.membershipRole = membership.role;
    req.workspaceId = membership.workspaceId;
    next();
  };

  // requireWorkspaceRole middleware factory
  const requireWorkspaceRole = (allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      const role = req.membershipRole;
      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
        });
      }
      next();
    };
  };

  const requireOperationalAccess = requireWorkspaceRole(['owner', 'manager', 'staff', 'agent']);
  const requireConfigAccess = requireWorkspaceRole(['owner', 'manager', 'staff']);
  const requireDestructiveAccess = requireWorkspaceRole(['owner']);

  // Test login endpoint
  app.post('/test/login', (req: any, res) => {
    const { userId, clientId } = req.body;
    req.session.userId = userId;
    req.session.clientId = clientId;
    req.session.userRole = 'client_admin';
    res.json({ success: true });
  });

  // OPERATIONAL ROUTES (agent CAN access)
  app.patch('/api/client/leads/:id', requireClientAuth, requireOperationalAccess, async (req: any, res) => {
    const lead = await mockStorage.updateLead(req.effectiveClientId, req.params.id, req.body);
    res.json(lead);
  });

  app.patch('/api/client/appointments/:id', requireClientAuth, requireOperationalAccess, async (req: any, res) => {
    const appt = await mockStorage.updateAppointment(req.effectiveClientId, req.params.id, req.body);
    res.json(appt);
  });

  // CONFIG ROUTES (agent CANNOT access)
  app.get('/api/client/analytics/export', requireClientAuth, requireConfigAccess, async (req: any, res) => {
    res.json({ data: 'exported' });
  });

  app.patch('/api/client/bots/:botId/widget', requireClientAuth, requireConfigAccess, async (req: any, res) => {
    res.json({ success: true });
  });

  app.post('/api/client/bots/:botId/automations', requireClientAuth, requireConfigAccess, async (req: any, res) => {
    res.json({ success: true });
  });

  app.patch('/api/client/settings', requireClientAuth, requireConfigAccess, async (req: any, res) => {
    res.json({ success: true });
  });

  // DESTRUCTIVE ROUTES (only owner)
  app.delete('/api/client/leads/:id', requireClientAuth, requireDestructiveAccess, async (req: any, res) => {
    res.json({ deleted: true });
  });

  return app;
}

describe('RBAC Middleware Tests', () => {
  const app = createTestApp();
  let agentCookies: string[];
  let ownerCookies: string[];
  let noMembershipCookies: string[];

  beforeAll(async () => {
    // Login as agent
    const agentRes = await request(app)
      .post('/test/login')
      .send({ userId: 'agent_user', clientId: 'test_client' });
    agentCookies = agentRes.headers['set-cookie'];

    // Login as owner
    const ownerRes = await request(app)
      .post('/test/login')
      .send({ userId: 'owner_user', clientId: 'test_client' });
    ownerCookies = ownerRes.headers['set-cookie'];

    // Login as user without membership
    const noMemberRes = await request(app)
      .post('/test/login')
      .send({ userId: 'no_membership_user', clientId: 'test_client' });
    noMembershipCookies = noMemberRes.headers['set-cookie'];
  });

  describe('Agent role (operational only)', () => {
    it('gets 200 on lead status update (operational)', async () => {
      const res = await request(app)
        .patch('/api/client/leads/123')
        .set('Cookie', agentCookies)
        .send({ status: 'contacted' });
      expect(res.status).toBe(200);
    });

    it('gets 200 on appointment status update (operational)', async () => {
      const res = await request(app)
        .patch('/api/client/appointments/123')
        .set('Cookie', agentCookies)
        .send({ status: 'scheduled' });
      expect(res.status).toBe(200);
    });

    it('gets 403 on widget settings (config)', async () => {
      const res = await request(app)
        .patch('/api/client/bots/test-bot/widget')
        .set('Cookie', agentCookies)
        .send({ primaryColor: '#ff0000' });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions');
    });

    it('gets 403 on automations (config)', async () => {
      const res = await request(app)
        .post('/api/client/bots/test-bot/automations')
        .set('Cookie', agentCookies)
        .send({ name: 'Test', trigger: 'lead_created' });
      expect(res.status).toBe(403);
    });

    it('gets 403 on client settings (config)', async () => {
      const res = await request(app)
        .patch('/api/client/settings')
        .set('Cookie', agentCookies)
        .send({ defaultLanguage: 'es' });
      expect(res.status).toBe(403);
    });

    it('gets 403 on export (config)', async () => {
      const res = await request(app)
        .get('/api/client/analytics/export')
        .set('Cookie', agentCookies);
      expect(res.status).toBe(403);
    });

    it('gets 403 on delete lead (destructive)', async () => {
      const res = await request(app)
        .delete('/api/client/leads/123')
        .set('Cookie', agentCookies);
      expect(res.status).toBe(403);
    });
  });

  describe('Owner role (full access)', () => {
    it('gets 200 on operational routes', async () => {
      const res = await request(app)
        .patch('/api/client/leads/123')
        .set('Cookie', ownerCookies)
        .send({ status: 'contacted' });
      expect(res.status).toBe(200);
    });

    it('gets 200 on config routes', async () => {
      const res = await request(app)
        .get('/api/client/analytics/export')
        .set('Cookie', ownerCookies);
      expect(res.status).toBe(200);
    });

    it('gets 200 on destructive routes', async () => {
      const res = await request(app)
        .delete('/api/client/leads/123')
        .set('Cookie', ownerCookies);
      expect(res.status).toBe(200);
    });
  });

  describe('Missing membership', () => {
    it('gets 403 on any client-scoped route', async () => {
      const res = await request(app)
        .patch('/api/client/leads/123')
        .set('Cookie', noMembershipCookies)
        .send({ status: 'contacted' });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('not a member');
    });

    it('gets 403 on config routes without membership', async () => {
      const res = await request(app)
        .get('/api/client/analytics/export')
        .set('Cookie', noMembershipCookies);
      expect(res.status).toBe(403);
    });
  });

  describe('Unauthenticated requests', () => {
    it('gets 401 without session', async () => {
      const res = await request(app)
        .patch('/api/client/leads/123')
        .send({ status: 'contacted' });
      expect(res.status).toBe(401);
    });
  });
});
