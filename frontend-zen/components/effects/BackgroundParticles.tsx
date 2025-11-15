'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  shape: 'square' | 'circle' | 'line';
}

export function BackgroundParticles() {
  const particles = useMemo<Particle[]>(() => {
    // Minimal Zen: Only 12 geometric shapes, sparse distribution
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 4, // 3-7px
      duration: 15 + Math.random() * 10, // 15-25s slow drift
      delay: Math.random() * 8,
      shape: ['square', 'circle', 'line'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'line',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => {
        const isLine = particle.shape === 'line';

        return (
          <motion.div
            key={particle.id}
            className={`absolute ${
              particle.shape === 'circle' ? 'rounded-full' : particle.shape === 'square' ? '' : ''
            } bg-zen-gray-300/20`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: isLine ? `${particle.size * 8}px` : `${particle.size}px`,
              height: isLine ? '1px' : `${particle.size}px`,
            }}
            animate={{
              y: [-20, -80, -140],
              x: [0, 15, -15, 0],
              opacity: [0, 0.4, 0.4, 0],
              rotate: isLine ? [0, 90, 180] : 0,
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}
