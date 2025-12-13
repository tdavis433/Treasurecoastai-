/**
 * Retry Utilities with Exponential Backoff
 * 
 * Provides robust retry logic for external service calls like email, SMS, and API requests.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterPercent?: number;
  retryableErrors?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any, delayMs: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
  totalDelayMs: number;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterPercent: 20,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitterPercent: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  
  const jitterRange = cappedDelay * (jitterPercent / 100);
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  
  return Math.max(0, Math.floor(cappedDelay + jitter));
}

function isRetryableError(error: any): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const code = (error as any).code?.toLowerCase() || '';
    
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'econnreset',
      'econnrefused',
      'enotfound',
      'epipe',
      'ehostunreach',
      'enetunreach',
      'socket hang up',
      'fetch failed',
      'aborted',
      'ssl',
      'tls',
      'certificate',
      '503',
      '502',
      '504',
      '500',
      'rate limit',
      '429',
      'temporarily unavailable',
      'service unavailable',
      'gateway',
    ];
    
    for (const pattern of retryablePatterns) {
      if (message.includes(pattern) || code.includes(pattern)) {
        return true;
      }
    }
  }
  return false;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    baseDelayMs = DEFAULT_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    jitterPercent = DEFAULT_OPTIONS.jitterPercent,
    retryableErrors = isRetryableError,
    onRetry,
  } = options;

  let lastError: any;
  let totalDelayMs = 0;
  let actualAttempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    actualAttempts = attempt + 1;
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: actualAttempts,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry if the error is not retryable
      if (!retryableErrors(error)) {
        break;
      }

      const delayMs = calculateDelay(
        attempt,
        baseDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitterPercent
      );
      totalDelayMs += delayMs;

      if (onRetry) {
        onRetry(actualAttempts, error, delayMs);
      } else {
        console.log(
          `[Retry] Attempt ${actualAttempts}/${maxRetries + 1} failed. Retrying in ${delayMs}ms...`
        );
      }

      await sleep(delayMs);
    }
  }

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    attempts: actualAttempts,
    totalDelayMs,
  };
}

export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<RetryResult<Response>> {
  const customRetryable = (error: any): boolean => {
    if (error && typeof error === 'object') {
      const status = error.status || error.statusCode;
      if (status === 429 || status === 502 || status === 503 || status === 504) {
        return true;
      }
    }
    return isRetryableError(error);
  };

  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      
      if (response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504) {
        const errorObj = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (errorObj as any).status = response.status;
        throw errorObj;
      }
      
      return response;
    },
    {
      ...retryOptions,
      retryableErrors: retryOptions.retryableErrors || customRetryable,
    }
  );
}

export function createNotificationRetryLogger(type: 'email' | 'sms') {
  return (attempt: number, error: any, delayMs: number) => {
    console.log(
      `[${type.toUpperCase()} Retry] Attempt ${attempt} failed: ${error?.message || error}. Retrying in ${delayMs}ms...`
    );
  };
}
