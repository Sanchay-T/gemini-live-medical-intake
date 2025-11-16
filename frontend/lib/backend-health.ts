/**
 * Backend Health Check Utility
 * Handles Render free tier cold starts (15min inactivity → 30-60s wake time)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
const HEALTH_ENDPOINT = `${API_BASE}/health`;

interface HealthCheckOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, nextDelay: number) => void;
  onColdStart?: () => void;
}

interface HealthCheckResult {
  isHealthy: boolean;
  attempts: number;
  totalTime: number;
  wasColdStart: boolean;
}

/**
 * Check backend health with exponential backoff retry logic
 * Detects cold starts (longer first response) and retries appropriately
 */
export async function checkBackendHealth(
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const {
    maxRetries = 12, // ~90 seconds total
    initialDelay = 2000, // 2 seconds
    maxDelay = 10000, // 10 seconds max
    onRetry,
    onColdStart,
  } = options;

  const startTime = Date.now();
  let attempts = 0;
  let delay = initialDelay;
  let wasColdStart = false;

  for (let i = 0; i < maxRetries; i++) {
    attempts++;

    try {
      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000), // 15s timeout per request
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'healthy') {
          const totalTime = Date.now() - startTime;

          // Cold start detected if first attempt took > 5s
          if (attempts === 1 && totalTime > 5000) {
            wasColdStart = true;
          }

          return {
            isHealthy: true,
            attempts,
            totalTime,
            wasColdStart,
          };
        }
      }
    } catch (error) {
      // First slow failure likely indicates cold start
      if (attempts === 1 && onColdStart) {
        wasColdStart = true;
        onColdStart();
      }

      console.log(
        `[Health Check] Attempt ${attempts}/${maxRetries} failed:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Don't sleep after last attempt
    if (i < maxRetries - 1) {
      if (onRetry) {
        onRetry(attempts, delay);
      }

      await sleep(delay);

      // Exponential backoff with max cap
      delay = Math.min(delay * 1.5, maxDelay);
    }
  }

  return {
    isHealthy: false,
    attempts,
    totalTime: Date.now() - startTime,
    wasColdStart,
  };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Quick health check (single attempt, 5s timeout)
 * Use this for periodic checks when backend should already be warm
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_ENDPOINT, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }

    return false;
  } catch {
    return false;
  }
}
