'use client';

import { useState, useEffect } from 'react';
import { IntakeFlow } from '@/components/flow/IntakeFlow';
import { BackendWakeup } from '@/components/ui/BackendWakeup';
import { ApiKeySetup } from '@/components/setup/ApiKeySetup';
import { checkBackendHealth } from '@/lib/backend-health';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Home() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [healthCheckAttempt, setHealthCheckAttempt] = useState(0);
  const [maxAttempts] = useState(12);
  const [nextRetryDelay, setNextRetryDelay] = useState(0);
  const [checkFailed, setCheckFailed] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);

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

        // Check if backend has API key or if user has provided one
        const checkApiKey = async () => {
          try {
            const response = await fetch(`${API_BASE}/api-key-status`);
            const data = await response.json();

            if (!data.has_api_key) {
              // Check localStorage for user's API key
              const storedKey = localStorage.getItem('gemini_api_key');
              if (storedKey) {
                setUserApiKey(storedKey);
                setIsBackendReady(true);
              } else {
                setNeedsApiKey(true);
              }
            } else {
              setIsBackendReady(true);
            }
          } catch (error) {
            console.error('Failed to check API key status:', error);
            setIsBackendReady(true); // Proceed anyway
          }
        };

        await checkApiKey();
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

  const handleApiKeySubmit = (apiKey: string) => {
    localStorage.setItem('gemini_api_key', apiKey);
    setUserApiKey(apiKey);
    setNeedsApiKey(false);
    setIsBackendReady(true);
  };

  if (needsApiKey) {
    return <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} />;
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

  return <IntakeFlow apiKey={userApiKey} />;
}
