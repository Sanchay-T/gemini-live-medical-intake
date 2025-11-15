'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      shimmerDuration = '2s',
      borderRadius = '0.5rem',
      background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-center overflow-hidden rounded-lg px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 active:scale-95',
          className
        )}
        style={{
          borderRadius,
          background,
        }}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        <div
          className="absolute inset-0 -z-10 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            backgroundSize: '200% 100%',
            animationDuration: shimmerDuration,
          }}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
