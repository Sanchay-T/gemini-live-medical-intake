'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceState } from '@/types';

interface VoiceButtonProps {
  isActive: boolean;
  state: VoiceState;
  onClick: () => void;
}

export function VoiceButton({ isActive, state, onClick }: VoiceButtonProps) {
  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className="w-12 h-12 text-white" />;
      case 'processing':
      case 'speaking':
        return <Loader2 className="w-12 h-12 text-white animate-spin" />;
      default:
        return isActive ? (
          <MicOff className="w-12 h-12 text-white" />
        ) : (
          <Mic className="w-12 h-12 text-white" />
        );
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'AI Speaking...';
      default:
        return 'Click to start';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{
          scale: state === 'listening' ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: state === 'listening' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <Button
          onClick={onClick}
          size="icon"
          className={`w-24 h-24 rounded-full ${
            isActive
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          {getIcon()}
        </Button>
      </motion.div>

      <p className="text-sm text-muted-foreground">{getStatusText()}</p>
    </div>
  );
}
