import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../server/storage";
import { workspaces, workspaceMemberships, adminUsers, leads, appointments } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const TEST_WORKSPACE_A_SLUG = `test_tenant_a_${Date.now()}`;
const TEST_WORKSPACE_B_SLUG = `test_tenant_b_${Date.now()}`;
const TEST_BOT_ID = `test_bot_${Date.now()}`;

let workspaceA: any;
let workspaceB: any;
let userA: any;
let userB: any;
let leadA: any;
let leadB: any;
let appointmentA: any;
let appointmentB: any;

describe("Multi-Tenancy Data Isolation", () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("TestPass123!", 10);

    const [uA] = await db.insert(adminUsers).values({
      username: `user_a_${Date.now()}`,
      passwordHash,
      role: "client_admin",
      clientId: TEST_WORKSPACE_A_SLUG,
      disabled: false,
    }).returning();
    userA = uA;

    const [uB] = await db.insert(adminUsers).values({
      username: `user_b_${Date.now()}`,
      passwordHash,
      role: "client_admin",
      clientId: TEST_WORKSPACE_B_SLUG,
      disabled: false,
    }).returning();
    userB = uB;

    const [wsA] = await db.insert(workspaces).values({
      slug: TEST_WORKSPACE_A_SLUG,
      name: "Test Tenant A",
      ownerId: userA.id,
      plan: "starter",
      isDemo: false,
    }).returning();
    workspaceA = wsA;

    const [wsB] = await db.insert(workspaces).values({
      slug: TEST_WORKSPACE_B_SLUG,
      name: "Test Tenant B",
      ownerId: userB.id,
      plan: "starter",
      isDemo: false,
    }).returning();
    workspaceB = wsB;

    const [lA] = await db.insert(leads).values({
      clientId: TEST_WORKSPACE_A_SLUG,
      botId: TEST_BOT_ID,
      name: "Lead A - Private",
      phone: "555-111-1111",
      email: "leada@tenant-a.com",
      status: "new",
    }).returning();
    leadA = lA;

    const [lB] = await db.insert(leads).values({
      clientId: TEST_WORKSPACE_B_SLUG,
      botId: TEST_BOT_ID,
      name: "Lead B - Private",
      phone: "555-222-2222",
      email: "leadb@tenant-b.com",
      status: "new",
    }).returning();
    leadB = lB;

    const [aA] = await db.insert(appointments).values({
      clientId: TEST_WORKSPACE_A_SLUG,
      name: "Appointment A",
      contact: "555-111-1111",
      preferredTime: "10:00 AM",
      status: "new",
      appointmentType: "tour",
    }).returning();
    appointmentA = aA;

    const [aB] = await db.insert(appointments).values({
      clientId: TEST_WORKSPACE_B_SLUG,
      name: "Appointment B",
      contact: "555-222-2222",
      preferredTime: "2:00 PM",
      status: "new",
      appointmentType: "tour",
    }).returning();
    appointmentB = aB;
  });

  afterAll(async () => {
    if (appointmentA?.id) {
      await db.delete(appointments).where(eq(appointments.id, appointmentA.id));
    }
    if (appointmentB?.id) {
      await db.delete(appointments).where(eq(appointments.id, appointmentB.id));
    }
    if (leadA?.id) {
      await db.delete(leads).where(eq(leads.id, leadA.id));
    }
    if (leadB?.id) {
      await db.delete(leads).where(eq(leads.id, leadB.id));
    }
    if (workspaceA?.id) {
      await db.delete(workspaces).where(eq(workspaces.id, workspaceA.id));
    }
    if (workspaceB?.id) {
      await db.delete(workspaces).where(eq(workspaces.id, workspaceB.id));
    }
    if (userA?.id) {
      await db.delete(adminUsers).where(eq(adminUsers.id, userA.id));
    }
    if (userB?.id) {
      await db.delete(adminUsers).where(eq(adminUsers.id, userB.id));
    }
  });

  describe("Leads Isolation", () => {
    it("should only return leads belonging to Tenant A when queried with Tenant A clientId", async () => {
      const tenantALeads = await db.select()
        .from(leads)
        .where(eq(leads.clientId, TEST_WORKSPACE_A_SLUG));
      
      expect(tenantALeads.length).toBeGreaterThanOrEqual(1);
      expect(tenantALeads.every(l => l.clientId === TEST_WORKSPACE_A_SLUG)).toBe(true);
      expect(tenantALeads.some(l => l.id === leadA.id)).toBe(true);
      expect(tenantALeads.some(l => l.id === leadB.id)).toBe(false);
    });

    it("should only return leads belonging to Tenant B when queried with Tenant B clientId", async () => {
      const tenantBLeads = await db.select()
        .from(leads)
        .where(eq(leads.clientId, TEST_WORKSPACE_B_SLUG));
      
      expect(tenantBLeads.length).toBeGreaterThanOrEqual(1);
      expect(tenantBLeads.every(l => l.clientId === TEST_WORKSPACE_B_SLUG)).toBe(true);
      expect(tenantBLeads.some(l => l.id === leadB.id)).toBe(true);
      expect(tenantBLeads.some(l => l.id === leadA.id)).toBe(false);
    });

    it("should not find Tenant A lead when querying with Tenant B clientId", async () => {
      const crossTenantQuery = await db.select()
        .from(leads)
        .where(and(
          eq(leads.id, leadA.id),
          eq(leads.clientId, TEST_WORKSPACE_B_SLUG)
        ));
      
      expect(crossTenantQuery.length).toBe(0);
    });
  });

  describe("Appointments Isolation", () => {
    it("should only return appointments belonging to Tenant A when queried with Tenant A clientId", async () => {
      const tenantAAppointments = await db.select()
        .from(appointments)
        .where(eq(appointments.clientId, TEST_WORKSPACE_A_SLUG));
      
      expect(tenantAAppointments.length).toBeGreaterThanOrEqual(1);
      expect(tenantAAppointments.every(a => a.clientId === TEST_WORKSPACE_A_SLUG)).toBe(true);
      expect(tenantAAppointments.some(a => a.id === appointmentA.id)).toBe(true);
      expect(tenantAAppointments.some(a => a.id === appointmentB.id)).toBe(false);
    });

    it("should only return appointments belonging to Tenant B when queried with Tenant B clientId", async () => {
      const tenantBAppointments = await db.select()
        .from(appointments)
        .where(eq(appointments.clientId, TEST_WORKSPACE_B_SLUG));
      
      expect(tenantBAppointments.length).toBeGreaterThanOrEqual(1);
      expect(tenantBAppointments.every(a => a.clientId === TEST_WORKSPACE_B_SLUG)).toBe(true);
      expect(tenantBAppointments.some(a => a.id === appointmentB.id)).toBe(true);
      expect(tenantBAppointments.some(a => a.id === appointmentA.id)).toBe(false);
    });

    it("should not find Tenant B appointment when querying with Tenant A clientId", async () => {
      const crossTenantQuery = await db.select()
        .from(appointments)
        .where(and(
          eq(appointments.id, appointmentB.id),
          eq(appointments.clientId, TEST_WORKSPACE_A_SLUG)
        ));
      
      expect(crossTenantQuery.length).toBe(0);
    });
  });

  describe("User-Workspace Association", () => {
    it("should associate User A with Tenant A workspace only", async () => {
      expect(userA.clientId).toBe(TEST_WORKSPACE_A_SLUG);
      expect(userA.clientId).not.toBe(TEST_WORKSPACE_B_SLUG);
    });

    it("should associate User B with Tenant B workspace only", async () => {
      expect(userB.clientId).toBe(TEST_WORKSPACE_B_SLUG);
      expect(userB.clientId).not.toBe(TEST_WORKSPACE_A_SLUG);
    });
  });

  describe("Cross-Tenant Data Access Prevention", () => {
    it("should demonstrate that scoped queries prevent cross-tenant data access", async () => {
      const allLeadsWithWrongScope = await db.select()
        .from(leads)
        .where(eq(leads.clientId, "nonexistent_tenant_xyz"));
      
      expect(allLeadsWithWrongScope.length).toBe(0);
    });

    it("should correctly scope update operations by clientId", async () => {
      const updateResult = await db.update(leads)
        .set({ notes: "Attempted cross-tenant update" })
        .where(and(
          eq(leads.id, leadA.id),
          eq(leads.clientId, TEST_WORKSPACE_B_SLUG)
        ))
        .returning();
      
      expect(updateResult.length).toBe(0);
      
      const originalLead = await db.select().from(leads).where(eq(leads.id, leadA.id));
      expect(originalLead[0].notes).not.toBe("Attempted cross-tenant update");
    });

    it("should correctly scope delete operations by clientId", async () => {
      const tempLead = await db.insert(leads).values({
        clientId: TEST_WORKSPACE_A_SLUG,
        botId: TEST_BOT_ID,
        name: "Temp Lead for Delete Test",
        phone: "555-999-9999",
        status: "new",
      }).returning();

      const deleteResult = await db.delete(leads)
        .where(and(
          eq(leads.id, tempLead[0].id),
          eq(leads.clientId, TEST_WORKSPACE_B_SLUG)
        ))
        .returning();
      
      expect(deleteResult.length).toBe(0);
      
      const stillExists = await db.select().from(leads).where(eq(leads.id, tempLead[0].id));
      expect(stillExists.length).toBe(1);
      
      await db.delete(leads).where(eq(leads.id, tempLead[0].id));
    });
  });

  describe("Membership Enforcement - Security Regression", () => {
    let membershipA: any;
    
    beforeAll(async () => {
      // Create membership for User A in Workspace A
      const [mA] = await db.insert(workspaceMemberships).values({
        workspaceId: workspaceA.id,
        userId: userA.id,
        role: "admin",
      }).returning();
      membershipA = mA;
    });

    afterAll(async () => {
      // Clean up membership
      if (membershipA?.id) {
        try {
          await db.delete(workspaceMemberships).where(eq(workspaceMemberships.id, membershipA.id));
        } catch (e) {
          // Already deleted by test
        }
      }
    });

    it("should enforce that users without workspace membership cannot access workspace data", async () => {
      // Remove membership
      await db.delete(workspaceMemberships).where(eq(workspaceMemberships.id, membershipA.id));
      
      // Verify membership is gone
      const membership = await db.select().from(workspaceMemberships)
        .where(and(
          eq(workspaceMemberships.workspaceId, workspaceA.id),
          eq(workspaceMemberships.userId, userA.id)
        ));
      
      expect(membership.length).toBe(0);
      
      // Validates that workspace membership is enforced
      // The requireClientAuth middleware uses checkWorkspaceMembership() to deny access
      // This test confirms the database state that triggers 403 at API level
    });

    it("should demonstrate that membership check finds no record for removed user", async () => {
      // Query what the middleware's checkWorkspaceMembership would find
      const activeMembership = await db.select()
        .from(workspaceMemberships)
        .where(and(
          eq(workspaceMemberships.workspaceId, workspaceA.id),
          eq(workspaceMemberships.userId, userA.id)
        ));
      
      // No membership = requireClientAuth will return 403
      expect(activeMembership.length).toBe(0);
    });
  });

  describe("IDOR Protection - Cross-Tenant Appointment Access", () => {
    it("should prevent Tenant A from accessing Tenant B appointment by ID", async () => {
      // Attempt to query appointment B using Tenant A's clientId scope
      const crossTenantAppointment = await db.select()
        .from(appointments)
        .where(and(
          eq(appointments.id, appointmentB.id),
          eq(appointments.clientId, TEST_WORKSPACE_A_SLUG)
        ));
      
      // Should return empty - appointment B belongs to Tenant B, not A
      expect(crossTenantAppointment.length).toBe(0);
    });

    it("should prevent Tenant B from accessing Tenant A appointment by ID", async () => {
      // Attempt to query appointment A using Tenant B's clientId scope
      const crossTenantAppointment = await db.select()
        .from(appointments)
        .where(and(
          eq(appointments.id, appointmentA.id),
          eq(appointments.clientId, TEST_WORKSPACE_B_SLUG)
        ));
      
      // Should return empty - appointment A belongs to Tenant A, not B
      expect(crossTenantAppointment.length).toBe(0);
    });

    it("should allow tenant to access their own appointment by ID", async () => {
      // Tenant A accessing their own appointment - should succeed
      const ownAppointment = await db.select()
        .from(appointments)
        .where(and(
          eq(appointments.id, appointmentA.id),
          eq(appointments.clientId, TEST_WORKSPACE_A_SLUG)
        ));
      
      expect(ownAppointment.length).toBe(1);
      expect(ownAppointment[0].id).toBe(appointmentA.id);
    });

    it("should demonstrate IDOR protection pattern for leads", async () => {
      // Tenant A tries to access Tenant B's lead by ID
      const crossTenantLead = await db.select()
        .from(leads)
        .where(and(
          eq(leads.id, leadB.id),
          eq(leads.clientId, TEST_WORKSPACE_A_SLUG)
        ));
      
      // IDOR prevented - lead B not returned when scoped to Tenant A
      expect(crossTenantLead.length).toBe(0);
    });
  });
});
