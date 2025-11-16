'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BackendWakeupProps {
  attempt: number;
  maxAttempts: number;
  nextRetryIn?: number;
}

export function BackendWakeup({ attempt, maxAttempts, nextRetryIn }: BackendWakeupProps) {
  const [countdown, setCountdown] = useState(nextRetryIn || 0);

  useEffect(() => {
    if (!nextRetryIn) return;

    setCountdown(Math.ceil(nextRetryIn / 1000));

    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRetryIn]);

  const progress = (attempt / maxAttempts) * 100;

  return (
    <div className="fixed inset-0 bg-zen-gray-50 flex items-center justify-center z-50">
      <div className="max-w-md w-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Animated pulse circle */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div
              className="absolute inset-0 rounded-full bg-zen-primary/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-4 rounded-full bg-zen-primary/30"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 0.3, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
            <div className="absolute inset-8 rounded-full bg-zen-primary flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          {/* Status text */}
          <h2 className="text-2xl font-semibold text-zen-gray-900 mb-2">
            Waking up the server...
          </h2>

          <p className="text-zen-gray-600 mb-6">
            The backend is waking from sleep. This may take up to 60 seconds on the first
            visit.
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-zen-gray-200 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-zen-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Attempt counter */}
          <div className="flex items-center justify-center gap-4 text-sm text-zen-gray-500">
            <span>
              Attempt {attempt} of {maxAttempts}
            </span>
            {countdown > 0 && (
              <>
                <span>•</span>
                <span>Next retry in {countdown}s</span>
              </>
            )}
          </div>

          {/* Helpful tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="mt-8 p-4 bg-zen-white border border-zen-gray-200 rounded-lg"
          >
            <p className="text-xs text-zen-gray-600">
              <span className="font-medium">💡 Tip:</span> Render free tier sleeps after
              15 minutes of inactivity. Once warm, the app will respond instantly.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
