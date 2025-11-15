'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface VoiceVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export function VoiceVisualizer({ audioLevel, isActive }: VoiceVisualizerProps) {
  // Create 8 simple vertical bars
  const bars = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((i) => {
        // Vary height based on position and audio level
        const baseHeight = 16 + (i % 3) * 4;
        const heightMultiplier = isActive ? 1 + audioLevel * 1.5 : 0.3;
        const height = baseHeight * heightMultiplier;

        return (
          <motion.div
            key={i}
            className="w-1 bg-zen-green rounded-full"
            animate={{
              height: `${height}px`,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}
