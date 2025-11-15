'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassLayerProps {
  children: ReactNode;
  variant?: 'surface' | 'card' | 'overlay';
  className?: string;
}

export function GlassLayer({ children, variant = 'surface', className }: GlassLayerProps) {
  const variantStyles = {
    surface: 'glass-zen',
    card: 'glass-zen-card',
    overlay: 'glass-zen-overlay',
  };

  return (
    <div className={cn(variantStyles[variant], className)}>
      {children}
    </div>
  );
}
