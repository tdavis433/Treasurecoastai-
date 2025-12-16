import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    let token = req.cookies?.[CSRF_COOKIE_NAME];
    if (!token) {
      token = generateCsrfToken();
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    req.csrfToken = token;
    return next();
  }
  
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;
  
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: "CSRF token missing" });
  }
  
  if (cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF token mismatch" });
  }
  
  next();
}

export function csrfTokenEndpoint(req: Request, res: Response) {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  res.json({ token });
}

export function getSkipCsrfPaths(): string[] {
  return [
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/logout",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/chat",
    "/api/widget",
    "/api/health",
    "/api/quickbook",
  ];
}

export function createCsrfMiddleware() {
  const skipPaths = getSkipCsrfPaths();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const shouldSkip = skipPaths.some(path => 
      req.path === path || req.path.startsWith(path + "/")
    );
    
    if (shouldSkip) {
      return next();
    }
    
    return csrfProtection(req, res, next);
  };
}
