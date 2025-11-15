'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  color?: string;
}

export function Particles({
  className = '',
  quantity = 50,
  staticity = 50,
  ease = 50,
  color = '#ffffff',
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const particles = useRef<Particle[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    context.current = canvas.getContext('2d');

    const initCanvas = () => {
      const container = canvasContainerRef.current;
      if (!container) return;

      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    const initParticles = () => {
      particles.current = [];
      for (let i = 0; i < quantity; i++) {
        particles.current.push({
          x: Math.random() * (canvas.width || 0),
          y: Math.random() * (canvas.height || 0),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const drawParticles = () => {
      if (!context.current || !canvas.width || !canvas.height) return;

      context.current.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle) => {
        if (!context.current) return;

        // Mouse interaction
        const dx = mousePosition.current.x - particle.x;
        const dy = mousePosition.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = (staticity - distance) / staticity;

        if (distance < staticity) {
          const angle = Math.atan2(dy, dx);
          particle.vx -= force * Math.cos(angle) * 0.1;
          particle.vy -= force * Math.sin(angle) * 0.1;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply ease
        particle.vx *= 1 - ease / 100;
        particle.vy *= 1 - ease / 100;

        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Clamp position
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Draw particle
        context.current.beginPath();
        context.current.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.current.fillStyle = `${color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        context.current.fill();
      });

      animationFrame.current = requestAnimationFrame(drawParticles);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleResize = () => {
      initCanvas();
      initParticles();
    };

    initCanvas();
    initParticles();
    drawParticles();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [quantity, staticity, ease, color]);

  return (
    <div ref={canvasContainerRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
