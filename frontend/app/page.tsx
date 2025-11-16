'use client';

import { useState, useEffect } from 'react';
import { IntakeFlow } from '@/components/flow/IntakeFlow';
import { BackendWakeup } from '@/components/ui/BackendWakeup';
import { checkBackendHealth } from '@/lib/backend-health';

export default function Home() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [healthCheckAttempt, setHealthCheckAttempt] = useState(0);
  const [maxAttempts] = useState(12);
  const [nextRetryDelay, setNextRetryDelay] = useState(0);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    // Check backend health on mount
    const performHealthCheck = async () => {
      const result = await checkBackendHealth({
        maxRetries: maxAttempts,
        onRetry: (attempt, delay) => {
          setHealthCheckAttempt(attempt);
          setNextRetryDelay(delay);
        },
        onColdStart: () => {
          console.log('🥶 Cold start detected - backend is waking up');
        },
      });

      if (result.isHealthy) {
        console.log(
          `✅ Backend is healthy (${result.attempts} attempts, ${result.totalTime}ms${
            result.wasColdStart ? ', cold start' : ''
          })`
        );
        setIsBackendReady(true);
      } else {
        console.error(
          `❌ Backend health check failed after ${result.attempts} attempts`
        );
        setCheckFailed(true);
      }
    };

    performHealthCheck();
  }, [maxAttempts]);

  if (checkFailed) {
    return (
      <div className="min-h-screen bg-zen-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="text-6xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold text-zen-gray-900 mb-4">
            Backend Unavailable
          </h2>
          <p className="text-zen-gray-600 mb-6">
            Unable to connect to the backend server. It may still be deploying or
            experiencing issues.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zen-primary text-white rounded-lg hover:bg-zen-primary/90 transition-colors"
          >
            Retry
          </button>
          <p className="mt-4 text-sm text-zen-gray-500">
            Check{' '}
            <a
              href="https://dashboard.render.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zen-primary hover:underline"
            >
              Render dashboard
            </a>{' '}
            for deployment status
          </p>
        </div>
      </div>
    );
  }

  if (!isBackendReady) {
    return (
      <BackendWakeup
        attempt={healthCheckAttempt}
        maxAttempts={maxAttempts}
        nextRetryIn={nextRetryDelay}
      />
    );
  }

  return <IntakeFlow />;
}
