import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      effectiveClientId?: string;
      workspaceId?: string;
      membershipRole?: string;
      user?: {
        id: number;
        username: string;
        role: string;
        clientId?: string | null;
      };
      csrfToken?: string;
    }
  }
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.headers['x-request-id'] as string | undefined;
  const requestId = incomingId || generateRequestId();
  
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  
  next();
}
