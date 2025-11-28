import { Response } from 'express';

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiSuccess<T = any> {
  data: T;
  message?: string;
}

export function sendError(
  res: Response,
  statusCode: number,
  error: string,
  code?: string,
  details?: Record<string, any>
): Response {
  const response: ApiError = { error };
  if (code) response.code = code;
  if (details) response.details = details;
  return res.status(statusCode).json(response);
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiSuccess<T> = { data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export function badRequest(res: Response, error: string, details?: Record<string, any>): Response {
  return sendError(res, 400, error, ErrorCodes.BAD_REQUEST, details);
}

export function unauthorized(res: Response, error: string = 'Authentication required'): Response {
  return sendError(res, 401, error, ErrorCodes.UNAUTHORIZED);
}

export function forbidden(res: Response, error: string = 'Access denied'): Response {
  return sendError(res, 403, error, ErrorCodes.FORBIDDEN);
}

export function notFound(res: Response, error: string = 'Resource not found'): Response {
  return sendError(res, 404, error, ErrorCodes.NOT_FOUND);
}

export function conflict(res: Response, error: string): Response {
  return sendError(res, 409, error, ErrorCodes.CONFLICT);
}

export function internalError(res: Response, error: string = 'Internal server error'): Response {
  return sendError(res, 500, error, ErrorCodes.INTERNAL_ERROR);
}

export function serviceUnavailable(res: Response, error: string = 'Service temporarily unavailable'): Response {
  return sendError(res, 503, error, ErrorCodes.SERVICE_UNAVAILABLE);
}

export function validateHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

export function sanitizeHexColor(color: string, defaultColor: string = '#2563eb'): string {
  return validateHexColor(color) ? color : defaultColor;
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
}
