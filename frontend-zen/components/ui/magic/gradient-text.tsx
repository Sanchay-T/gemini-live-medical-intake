'use client';

import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  animate?: boolean;
}

export function GradientText({
  children,
  className = '',
  as: Component = 'span',
  animate = true,
}: GradientTextProps) {
  return (
    <Component
      className={cn(
        'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent',
        animate && 'animate-gradient bg-[length:200%_auto]',
        className
      )}
    >
      {children}
    </Component>
  );
}
