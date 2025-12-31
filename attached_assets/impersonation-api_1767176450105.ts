/**
 * IMPERSONATION ROUTES
 * 
 * Add these to your server/routes.ts or new routes/super-admin.ts
 * 
 * Allows Tyler (super-admin) to "View as Client" and see exactly what they see
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, systemLogs } from './storage';
import { eq, and } from 'drizzle-orm';

/**
 * Impersonate a client - Start viewing as them
 * POST /api/super-admin/impersonate/:clientId
 */
export async function impersonateClient(req: Request, res: Response) {
  try {
    // 1. Verify requester is super-admin
    const currentUser = (req as any).user;
    
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Only super-admins can impersonate clients' 
      });
    }

    const { clientId } = req.params; // This is workspace slug or ID

    // 2. Find a CLIENT user in this workspace
    const [clientUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.workspaceId, clientId),
          eq(users.role, 'CLIENT')
        )
      )
      .limit(1);

    if (!clientUser) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'No client user found in this workspace' 
      });
    }

    // 3. Create impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: clientUser.id,
        username: clientUser.username,
        role: 'CLIENT',
        workspaceId: clientUser.workspaceId,
        // Track who is impersonating
        impersonatedBy: currentUser.id,
        impersonatedByUsername: currentUser.username,
        impersonationStarted: new Date().toISOString(),
      },
      process.env.JWT_SECRET!,
      { expiresIn: '4h' } // 4 hour session for security
    );

    // 4. Set cookie
    res.cookie('auth-token', impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    });

    // 5. Log impersonation for audit trail
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Super-admin ${currentUser.username} started impersonating client ${clientUser.username}`,
      metadata: JSON.stringify({
        superAdminId: currentUser.id,
        superAdminUsername: currentUser.username,
        clientId: clientUser.id,
        clientUsername: clientUser.username,
        workspaceId: clientId,
        action: 'impersonate_start',
      }),
      timestamp: new Date(),
    });

    // 6. Return success
    res.json({ 
      success: true,
      message: `Now viewing as ${clientUser.username}`,
      clientName: clientUser.username,
      workspaceId: clientId,
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to start impersonation' 
    });
  }
}

/**
 * Exit impersonation - Return to super-admin view
 * POST /api/super-admin/exit-impersonation
 */
export async function exitImpersonation(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    // 1. Verify this is an impersonated session
    if (!currentUser.impersonatedBy) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Not currently impersonating anyone' 
      });
    }

    // 2. Find original super-admin user
    const [superAdminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.impersonatedBy))
      .limit(1);

    if (!superAdminUser) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Original super-admin user not found' 
      });
    }

    // 3. Restore super-admin token
    const restoredToken = jwt.sign(
      {
        userId: superAdminUser.id,
        username: superAdminUser.username,
        role: superAdminUser.role,
        workspaceId: superAdminUser.workspaceId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 4. Set cookie
    res.cookie('auth-token', restoredToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5. Log exit
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Super-admin ${currentUser.impersonatedByUsername} exited impersonation of ${currentUser.username}`,
      metadata: JSON.stringify({
        superAdminId: superAdminUser.id,
        superAdminUsername: superAdminUser.username,
        clientId: currentUser.userId,
        clientUsername: currentUser.username,
        action: 'impersonate_exit',
      }),
      timestamp: new Date(),
    });

    // 6. Return success
    res.json({ 
      success: true,
      message: `Returned to super-admin view`,
      username: superAdminUser.username,
    });

  } catch (error) {
    console.error('Exit impersonation error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to exit impersonation' 
    });
  }
}

/**
 * Check if currently impersonating
 * GET /api/super-admin/impersonation-status
 */
export async function getImpersonationStatus(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    if (!currentUser) {
      return res.status(401).json({ isImpersonating: false });
    }

    res.json({
      isImpersonating: !!currentUser.impersonatedBy,
      impersonatedBy: currentUser.impersonatedBy || null,
      impersonatedByUsername: currentUser.impersonatedByUsername || null,
      currentUsername: currentUser.username,
      currentRole: currentUser.role,
    });

  } catch (error) {
    console.error('Impersonation status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
}
