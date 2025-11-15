'use client';

import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export function AudioVisualizer({ audioLevel, isActive }: AudioVisualizerProps) {
  const bars = 20;

  return (
    <div className="flex items-center justify-center gap-1 h-20">
      {Array.from({ length: bars }).map((_, i) => {
        const height = isActive
          ? Math.max(8, audioLevel * 60 * (0.5 + Math.random() * 0.5))
          : 8;

        return (
          <motion.div
            key={i}
            className="w-1 bg-blue-500 rounded-full"
            animate={{
              height: isActive ? height : 8,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}
