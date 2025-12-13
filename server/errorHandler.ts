/**
 * Centralized Error Handling for Production Safety
 * 
 * Provides utilities to sanitize error responses and prevent
 * stack trace leaks in production environments.
 */

import { Response, Request, NextFunction } from 'express';
import { redactMessage } from './utils/redact';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Error codes for consistent API responses
 */
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

interface ApiError {
  success: false;
  error: string;
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * Sanitizes an error for API response.
 * In production, removes stack traces and sensitive details.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    if (isProduction) {
      if (error.message.includes('password') || 
          error.message.includes('token') || 
          error.message.includes('secret')) {
        return 'Authentication error';
      }
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('ETIMEDOUT')) {
        return 'Service temporarily unavailable';
      }
      if (error.message.includes('duplicate key') || 
          error.message.includes('unique constraint')) {
        return 'A record with this information already exists';
      }
      return error.message.length > 200 
        ? error.message.substring(0, 200) + '...' 
        : error.message;
    }
    return error.message;
  }
  return String(error);
}

/**
 * Logs error with appropriate detail level
 * Applies PII redaction to prevent sensitive data in logs
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const rawMessage = error instanceof Error ? error.message : String(error);
  // Apply PII redaction to error messages before logging
  const errorMessage = redactMessage(rawMessage);
  const stack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[${timestamp}] [ERROR] ${context}: ${errorMessage}`);
  
  if (!isProduction && stack) {
    // Also redact PII from stack traces
    console.error(redactMessage(stack));
  }
}

/**
 * Sends a standardized error response
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  message: string,
  code?: ErrorCode,
  details?: Record<string, unknown>
): void {
  const response: ApiError = {
    success: false,
    error: message,
    ...(code && { code }),
    ...(!isProduction && details && { details })
  };
  
  res.status(statusCode).json(response);
}

/**
 * Common error response helpers
 */
export const errors = {
  badRequest: (res: Response, message = 'Bad request') => 
    sendErrorResponse(res, 400, message, ErrorCodes.BAD_REQUEST),
    
  unauthorized: (res: Response, message = 'Authentication required') => 
    sendErrorResponse(res, 401, message, ErrorCodes.UNAUTHORIZED),
    
  forbidden: (res: Response, message = 'Access denied') => 
    sendErrorResponse(res, 403, message, ErrorCodes.FORBIDDEN),
    
  notFound: (res: Response, message = 'Resource not found') => 
    sendErrorResponse(res, 404, message, ErrorCodes.NOT_FOUND),
    
  rateLimited: (res: Response, message = 'Too many requests') => 
    sendErrorResponse(res, 429, message, ErrorCodes.RATE_LIMITED),
    
  validation: (res: Response, message: string, details?: Record<string, unknown>) => 
    sendErrorResponse(res, 400, message, ErrorCodes.VALIDATION_ERROR, details),
    
  internal: (res: Response, error: unknown, context?: string) => {
    if (context) logError(context, error);
    sendErrorResponse(res, 500, sanitizeError(error), ErrorCodes.INTERNAL_ERROR);
  },
  
  database: (res: Response, error: unknown, context?: string) => {
    if (context) logError(context, error);
    const message = isProduction 
      ? 'Database operation failed' 
      : sanitizeError(error);
    sendErrorResponse(res, 500, message, ErrorCodes.DATABASE_ERROR);
  },
  
  externalService: (res: Response, service: string, error: unknown) => {
    logError(`External service: ${service}`, error);
    const message = isProduction 
      ? `${service} service error` 
      : sanitizeError(error);
    sendErrorResponse(res, 502, message, ErrorCodes.EXTERNAL_SERVICE_ERROR);
  }
};

/**
 * Express error handling middleware
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logError('Unhandled error', err);
  
  const statusCode = (err as any).statusCode || 500;
  const message = sanitizeError(err);
  
  sendErrorResponse(res, statusCode, message, ErrorCodes.INTERNAL_ERROR);
}

/**
 * Async route handler wrapper that catches errors
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const res = args[1] as Response;
    return Promise.resolve(fn(...args)).catch((error) => {
      errors.internal(res, error, 'Route handler');
    }) as Promise<ReturnType<T>>;
  };
}
