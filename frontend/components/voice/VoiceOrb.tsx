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
          borderColor: 'border-foreground',
          pulseOpacity: 0.8 + audioLevel * 0.2,
          icon: <Mic className="w-12 h-12" />,
        };
      case 'processing':
        return {
          borderColor: 'border-muted-foreground',
          pulseOpacity: 1,
          icon: <Loader2 className="w-12 h-12 animate-spin" />,
        };
      case 'speaking':
        return {
          borderColor: 'border-foreground',
          pulseOpacity: 1,
          icon: <Mic className="w-12 h-12" />,
        };
      default:
        return {
          borderColor: 'border-border',
          pulseOpacity: 0.4,
          icon: <MicOff className="w-12 h-12 text-muted-foreground" />,
        };
    }
  };

  const config = getStateConfig();

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Subtle outer ring - only when active */}
      {isActive && (
        <motion.div
          className={cn(
            'absolute w-[240px] h-[240px] rounded-full border-2',
            config.borderColor
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scale: [0.95, 1, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main orb */}
      <motion.button
        onClick={onClick}
        aria-label={isActive ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isActive}
        role="button"
        tabIndex={0}
        className={cn(
          'relative z-10 w-40 h-40 rounded-full border-2 bg-background',
          'flex items-center justify-center transition-all duration-200 cursor-pointer',
          config.borderColor,
          'hover:bg-secondary',
          'focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background',
          !isActive && 'opacity-60 hover:opacity-100'
        )}
        animate={{
          opacity: config.pulseOpacity,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <div className="relative z-10 text-foreground">{config.icon}</div>
      </motion.button>

      {/* Subtle pulse rings for listening state */}
      {state === 'listening' && audioLevel > 0.1 && (
        <>
          <motion.div
            className="absolute w-[160px] h-[160px] rounded-full border border-foreground"
            animate={{
              scale: [1, 1.1],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute w-[160px] h-[160px] rounded-full border border-foreground"
            animate={{
              scale: [1, 1.1],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
        </>
      )}
    </div>
  );
}
