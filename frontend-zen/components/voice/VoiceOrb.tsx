'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceState } from '@/types';

interface VoiceOrbProps {
  isActive: boolean;
  state: VoiceState;
  audioLevel: number;
  onClick: () => void;
  className?: string;
}

export function VoiceOrb({ isActive, state, audioLevel, onClick, className }: VoiceOrbProps) {
  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          ringColor: 'border-zen-green',
          icon: <Mic className="w-12 h-12 text-zen-black" />,
          showRing: true,
        };
      case 'processing':
        return {
          ringColor: 'border-zen-gray-400',
          icon: <Loader2 className="w-12 h-12 text-zen-black animate-spin" />,
          showRing: true,
        };
      case 'speaking':
        return {
          ringColor: 'border-zen-green',
          icon: <Mic className="w-12 h-12 text-zen-black" />,
          showRing: true,
        };
      default:
        return {
          ringColor: 'border-zen-gray-300',
          icon: <MicOff className="w-12 h-12 text-zen-gray-400" />,
          showRing: false,
        };
    }
  };

  const config = getStateConfig();

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Minimal Zen: Single expanding ring when active */}
      {config.showRing && (
        <motion.div
          className={cn('absolute w-[200px] h-[200px] rounded-full border-2', config.ringColor)}
          animate={{
            scale: [1, 1.2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Main orb - pure white circle with subtle shadow */}
      <motion.button
        onClick={onClick}
        aria-label={isActive ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isActive}
        role="button"
        tabIndex={0}
        className={cn(
          'relative z-10 w-40 h-40 rounded-full bg-zen-white',
          'flex items-center justify-center cursor-pointer',
          'border-2',
          config.ringColor,
          'shadow-lg',
          'hover:shadow-xl',
          'focus:outline-none focus:ring-2 focus:ring-zen-black focus:ring-offset-2',
          'transition-all duration-150'
        )}
        animate={{
          scale: isActive ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 2.5,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Icon */}
        <div className="relative z-10">{config.icon}</div>
      </motion.button>

      {/* Minimal pulse ring for listening state */}
      {state === 'listening' && audioLevel > 0.1 && (
        <motion.div
          className="absolute w-[160px] h-[160px] rounded-full border border-zen-green"
          animate={{
            scale: [1, 1.15],
            opacity: [0.4, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </div>
  );
}
