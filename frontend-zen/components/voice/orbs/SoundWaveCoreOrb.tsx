'use client';

import { motion } from 'framer-motion';

interface Props {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  audioLevel: number;
  onClick: () => void;
  layoutId?: string;
  size?: number;
}

export function SoundWaveCoreOrb({ state, audioLevel, onClick, layoutId, size = 280 }: Props) {
  const numBars = 32;
  const bars = Array.from({ length: numBars }, (_, i) => i);

  const isActive = state !== 'idle';

  // Sizing - clean and simple
  const orbSize = size * 0.35; // 35% of container
  const barLength = size * 0.15; // 15% of container
  const barDistance = orbSize + (size * 0.05); // Small gap from orb

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Radiating Bars */}
      {bars.map((i) => {
        const angle = (i / numBars) * 360;
        const delay = i * 0.025;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              width: 0,
              height: 0,
              transform: `rotate(${angle}deg)`,
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                width: '2px',
                height: barLength,
                backgroundColor: '#94a3b8',
                left: 0,
                bottom: barDistance,
                transformOrigin: 'bottom',
              }}
              animate={{
                scaleY: [1, 1.4, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay,
              }}
            />
          </div>
        );
      })}

      {/* Pulsing Rings - only when active */}
      {isActive && (
        <>
          <motion.div
            className="absolute rounded-full border border-cyan-400"
            style={{
              width: size * 0.7,
              height: size * 0.7,
            }}
            animate={{
              scale: [1, 1.2],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute rounded-full border border-cyan-400"
            style={{
              width: size * 0.85,
              height: size * 0.85,
            }}
            animate={{
              scale: [1, 1.15],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Center Orb */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-gray-800 to-black"
        style={{
          width: orbSize,
          height: orbSize,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.1)',
        }}
        animate={{
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Highlight */}
        <div
          className="absolute w-1/3 h-1/3 top-[20%] left-[20%] rounded-full bg-white/20 blur-xl"
        />
      </motion.div>
    </div>
  );
}
