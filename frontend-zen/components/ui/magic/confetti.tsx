'use client';

import { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
}

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
];

export function Confetti({
  isActive,
  onComplete,
  duration = 3000,
  particleCount = 100,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<ConfettiPiece[]>([]);
  const animationFrame = useRef<number>();
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
    particles.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 5 + 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      opacity: 1,
    }));

    startTime.current = Date.now();

    const animate = () => {
      if (!ctx || !canvas.width || !canvas.height) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      particles.current = particles.current.filter((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.vy += 0.3; // Gravity

        // Fade out towards the end
        if (progress > 0.7) {
          particle.opacity = 1 - (progress - 0.7) / 0.3;
        }

        // Remove if off screen or faded
        if (particle.y > canvas.height || particle.opacity <= 0) {
          return false;
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();

        return true;
      });

      if (progress < 1 && particles.current.length > 0) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isActive, duration, particleCount, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
