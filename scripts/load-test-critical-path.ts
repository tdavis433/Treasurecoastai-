#!/usr/bin/env npx tsx
/**
 * ============================================================================
 * LOAD TEST - CRITICAL PATH ENDPOINTS
 * ============================================================================
 * Tests critical API endpoints under concurrent load to identify:
 * - Response time degradation under load
 * - Error rates at different concurrency levels
 * - Rate limiting behavior
 * - Memory/resource exhaustion issues
 *
 * Usage:
 *   npx tsx scripts/load-test-critical-path.ts [options]
 *
 * Options:
 *   --base-url=URL     Base URL (default: http://localhost:5000)
 *   --concurrency=N    Concurrent requests (default: 10)
 *   --duration=N       Test duration in seconds (default: 30)
 *   --ramp-up          Enable gradual ramp-up
 *   --verbose          Show individual request results
 *
 * Exit codes:
 *   0 - All tests passed
 *   1 - Performance thresholds exceeded
 *   2 - Script error
 * ============================================================================
 */

interface TestResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  rateLimitRate: number;
  errors: { status: number; count: number }[];
}

interface RequestResult {
  success: boolean;
  status: number;
  responseTime: number;
  error?: string;
}

interface LoadTestConfig {
  baseUrl: string;
  concurrency: number;
  durationSeconds: number;
  rampUp: boolean;
  verbose: boolean;
}

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  expectedStatus?: number[];
  skipAuth?: boolean;
}

const CRITICAL_ENDPOINTS: EndpointConfig[] = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    expectedStatus: [200],
    skipAuth: true,
  },
  {
    name: 'Auth Check',
    method: 'GET',
    path: '/api/auth/check',
    expectedStatus: [200],
    skipAuth: true,
  },
  {
    name: 'Widget Config (demo)',
    method: 'GET',
    path: '/api/widget/config/1/1',
    expectedStatus: [200, 404],
    skipAuth: true,
  },
  {
    name: 'Demo List',
    method: 'GET',
    path: '/api/demos',
    expectedStatus: [200],
    skipAuth: true,
  },
  {
    name: 'Templates List',
    method: 'GET',
    path: '/api/templates',
    expectedStatus: [200],
    skipAuth: true,
  },
];

const PERFORMANCE_THRESHOLDS = {
  maxAvgResponseTime: 500, // ms
  maxP95ResponseTime: 1000, // ms
  maxP99ResponseTime: 2000, // ms
  maxErrorRate: 0.05, // 5%
  minRequestsPerSecond: 10, // per endpoint
};

function parseArgs(): LoadTestConfig {
  const args = process.argv.slice(2);
  const config: LoadTestConfig = {
    baseUrl: 'http://localhost:5000',
    concurrency: 10,
    durationSeconds: 30,
    rampUp: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--base-url=')) {
      config.baseUrl = arg.split('=')[1];
    } else if (arg.startsWith('--concurrency=')) {
      config.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--duration=')) {
      config.durationSeconds = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--ramp-up') {
      config.rampUp = true;
    } else if (arg === '--verbose') {
      config.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Load Test - Critical Path Endpoints

Usage:
  npx tsx scripts/load-test-critical-path.ts [options]

Options:
  --base-url=URL     Base URL (default: http://localhost:5000)
  --concurrency=N    Concurrent requests (default: 10)
  --duration=N       Test duration in seconds (default: 30)
  --ramp-up          Enable gradual ramp-up
  --verbose          Show individual request results
  -h, --help         Show this help message
`);
      process.exit(0);
    }
  }

  return config;
}

async function makeRequest(
  config: LoadTestConfig,
  endpoint: EndpointConfig
): Promise<RequestResult> {
  const url = `${config.baseUrl}${endpoint.path}`;
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTest/1.0',
        ...endpoint.headers,
      },
    };

    if (endpoint.body && endpoint.method === 'POST') {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    const expectedStatuses = endpoint.expectedStatus || [200];
    const success = expectedStatuses.includes(response.status);

    return {
      success,
      status: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function calculatePercentile(sortedTimes: number[], percentile: number): number {
  if (sortedTimes.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;
  return sortedTimes[Math.max(0, Math.min(index, sortedTimes.length - 1))];
}

async function runEndpointTest(
  config: LoadTestConfig,
  endpoint: EndpointConfig
): Promise<TestResult> {
  const results: RequestResult[] = [];
  const startTime = Date.now();
  const endTime = startTime + config.durationSeconds * 1000;
  const errorCounts: Record<number, number> = {};

  let activeConcurrency = config.rampUp ? 1 : config.concurrency;
  const rampUpInterval = config.rampUp
    ? (config.durationSeconds * 1000) / config.concurrency
    : 0;
  let lastRampUp = startTime;

  const workers: Promise<void>[] = [];

  const createWorker = async (workerId: number): Promise<void> => {
    while (Date.now() < endTime) {
      if (workerId >= activeConcurrency) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const result = await makeRequest(config, endpoint);
      results.push(result);

      if (!result.success) {
        errorCounts[result.status] = (errorCounts[result.status] || 0) + 1;
      }

      if (config.verbose) {
        const status = result.success ? '✓' : '✗';
        console.log(
          `  ${status} ${endpoint.name} - ${result.status} (${result.responseTime}ms)`
        );
      }

      // Small delay between requests to avoid hammering
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };

  // Start workers
  for (let i = 0; i < config.concurrency; i++) {
    workers.push(createWorker(i));
  }

  // Ramp-up logic
  if (config.rampUp) {
    const rampUpTick = async () => {
      while (Date.now() < endTime && activeConcurrency < config.concurrency) {
        if (Date.now() - lastRampUp > rampUpInterval) {
          activeConcurrency++;
          lastRampUp = Date.now();
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };
    rampUpTick();
  }

  // Wait for all workers
  await Promise.all(workers);

  // Calculate metrics
  const totalDuration = (Date.now() - startTime) / 1000;
  const responseTimes = results.map((r) => r.responseTime).sort((a, b) => a - b);
  const successfulRequests = results.filter((r) => r.success).length;
  const rateLimitedRequests = results.filter((r) => r.status === 429).length;
  const actualErrors = results.filter((r) => !r.success && r.status !== 429).length;

  const errors = Object.entries(errorCounts).map(([status, count]) => ({
    status: parseInt(status, 10),
    count,
  }));

  return {
    endpoint: endpoint.name,
    method: endpoint.method,
    totalRequests: results.length,
    successfulRequests,
    rateLimitedRequests,
    failedRequests: actualErrors,
    avgResponseTime:
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0,
    minResponseTime: responseTimes.length > 0 ? responseTimes[0] : 0,
    maxResponseTime:
      responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
    p50ResponseTime: calculatePercentile(responseTimes, 50),
    p95ResponseTime: calculatePercentile(responseTimes, 95),
    p99ResponseTime: calculatePercentile(responseTimes, 99),
    requestsPerSecond: results.length / totalDuration,
    errorRate: results.length > 0 ? actualErrors / results.length : 0,
    rateLimitRate: results.length > 0 ? rateLimitedRequests / results.length : 0,
    errors,
  };
}

function printResult(result: TestResult): void {
  const passAvg = result.avgResponseTime <= PERFORMANCE_THRESHOLDS.maxAvgResponseTime;
  const passP95 = result.p95ResponseTime <= PERFORMANCE_THRESHOLDS.maxP95ResponseTime;
  const passP99 = result.p99ResponseTime <= PERFORMANCE_THRESHOLDS.maxP99ResponseTime;
  const passError = result.errorRate <= PERFORMANCE_THRESHOLDS.maxErrorRate;
  const passRps = result.requestsPerSecond >= PERFORMANCE_THRESHOLDS.minRequestsPerSecond;

  const statusIcon = passAvg && passP95 && passP99 && passError && passRps ? '✓' : '✗';
  const statusColor = statusIcon === '✓' ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  const rateLimitNote = result.rateLimitedRequests > 0
    ? ` (rate limited: ${result.rateLimitedRequests})`
    : '';

  console.log(`
${statusColor}${statusIcon}${reset} ${result.endpoint} (${result.method})
  ┌─────────────────────────────────────────────────────────
  │ Total Requests:      ${result.totalRequests}
  │ Successful:          ${result.successfulRequests}
  │ Rate Limited (429):  ${result.rateLimitedRequests} (${(result.rateLimitRate * 100).toFixed(1)}%)
  │ Failed (non-429):    ${result.failedRequests}
  │ Error Rate:          ${(result.errorRate * 100).toFixed(2)}% ${passError ? '✓' : '✗ EXCEEDED'}
  │ Requests/sec:        ${result.requestsPerSecond.toFixed(2)} ${passRps ? '✓' : '✗ TOO LOW'}
  ├─────────────────────────────────────────────────────────
  │ Response Times (ms):
  │   Min:               ${result.minResponseTime.toFixed(0)}
  │   Avg:               ${result.avgResponseTime.toFixed(0)} ${passAvg ? '✓' : '✗ EXCEEDED'}
  │   P50:               ${result.p50ResponseTime.toFixed(0)}
  │   P95:               ${result.p95ResponseTime.toFixed(0)} ${passP95 ? '✓' : '✗ EXCEEDED'}
  │   P99:               ${result.p99ResponseTime.toFixed(0)} ${passP99 ? '✓' : '✗ EXCEEDED'}
  │   Max:               ${result.maxResponseTime.toFixed(0)}
  └─────────────────────────────────────────────────────────`);

  if (result.rateLimitedRequests > 0) {
    console.log('  Note: Rate limiting (429) is expected behavior under load.');
    if (result.successfulRequests === 0 && result.rateLimitedRequests > 0) {
      console.log('  \x1b[33m[WARN]\x1b[0m All requests were rate limited - unable to measure actual performance.');
    }
  }

  const nonRateLimitErrors = result.errors.filter((e) => e.status !== 429);
  if (nonRateLimitErrors.length > 0) {
    console.log('  Errors by status:');
    for (const err of nonRateLimitErrors) {
      console.log(`    - Status ${err.status}: ${err.count} occurrences`);
    }
  }
}

function checkThresholds(results: TestResult[]): boolean {
  let allPassed = true;

  for (const result of results) {
    if (result.avgResponseTime > PERFORMANCE_THRESHOLDS.maxAvgResponseTime) {
      allPassed = false;
    }
    if (result.p95ResponseTime > PERFORMANCE_THRESHOLDS.maxP95ResponseTime) {
      allPassed = false;
    }
    if (result.p99ResponseTime > PERFORMANCE_THRESHOLDS.maxP99ResponseTime) {
      allPassed = false;
    }
    if (result.errorRate > PERFORMANCE_THRESHOLDS.maxErrorRate) {
      allPassed = false;
    }
    if (result.requestsPerSecond < PERFORMANCE_THRESHOLDS.minRequestsPerSecond) {
      allPassed = false;
    }
  }

  return allPassed;
}

async function main(): Promise<void> {
  const config = parseArgs();

  console.log('='.repeat(60));
  console.log('  LOAD TEST - CRITICAL PATH ENDPOINTS');
  console.log('='.repeat(60));
  console.log();
  console.log(`Configuration:`);
  console.log(`  Base URL:        ${config.baseUrl}`);
  console.log(`  Concurrency:     ${config.concurrency}`);
  console.log(`  Duration:        ${config.durationSeconds}s`);
  console.log(`  Ramp-up:         ${config.rampUp ? 'Enabled' : 'Disabled'}`);
  console.log();
  console.log(`Performance Thresholds:`);
  console.log(`  Max Avg Response:  ${PERFORMANCE_THRESHOLDS.maxAvgResponseTime}ms`);
  console.log(`  Max P95 Response:  ${PERFORMANCE_THRESHOLDS.maxP95ResponseTime}ms`);
  console.log(`  Max P99 Response:  ${PERFORMANCE_THRESHOLDS.maxP99ResponseTime}ms`);
  console.log(`  Max Error Rate:    ${PERFORMANCE_THRESHOLDS.maxErrorRate * 100}%`);
  console.log(`  Min Req/sec:       ${PERFORMANCE_THRESHOLDS.minRequestsPerSecond}`);
  console.log();

  // Check if server is available (with retry for rate limiting)
  console.log('Checking server availability...');
  let serverAvailable = false;
  let retries = 3;
  
  while (retries > 0 && !serverAvailable) {
    try {
      const healthCheck = await fetch(`${config.baseUrl}/api/health`);
      if (healthCheck.ok) {
        serverAvailable = true;
        console.log('\x1b[32m✓\x1b[0m Server is available\n');
      } else if (healthCheck.status === 429) {
        console.log('\x1b[33m!\x1b[0m Rate limited, waiting before retry...');
        await new Promise((r) => setTimeout(r, 2000));
        retries--;
      } else {
        console.error(`\x1b[31m[ERROR]\x1b[0m Server returned ${healthCheck.status}`);
        process.exit(2);
      }
    } catch (error) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Cannot connect to ${config.baseUrl}`);
      console.error('Make sure the server is running and the URL is correct.');
      process.exit(2);
    }
  }

  if (!serverAvailable) {
    console.log('\x1b[33m!\x1b[0m Server is rate limiting. Proceeding with tests anyway.\n');
  }

  const results: TestResult[] = [];

  console.log('Running load tests...\n');

  for (const endpoint of CRITICAL_ENDPOINTS) {
    console.log(`Testing: ${endpoint.name}...`);
    const result = await runEndpointTest(config, endpoint);
    results.push(result);
    printResult(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  LOAD TEST SUMMARY');
  console.log('='.repeat(60));

  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccess = results.reduce((sum, r) => sum + r.successfulRequests, 0);
  const totalRateLimited = results.reduce((sum, r) => sum + r.rateLimitedRequests, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failedRequests, 0);
  const avgRps = results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / results.length;

  console.log(`
  Total Requests:      ${totalRequests}
  Successful:          ${totalSuccess}
  Rate Limited (429):  ${totalRateLimited}
  Failed (non-429):    ${totalFailed}
  Avg Requests/sec:    ${avgRps.toFixed(2)}
  `);

  const allPassed = checkThresholds(results);

  if (allPassed) {
    console.log('\x1b[32m[PASS]\x1b[0m All performance thresholds met\n');
    process.exit(0);
  } else {
    console.log('\x1b[31m[FAIL]\x1b[0m Some performance thresholds exceeded\n');
    console.log('Review the results above and optimize slow endpoints.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\x1b[31m[ERROR]\x1b[0m Unexpected error:', error);
  process.exit(2);
});
