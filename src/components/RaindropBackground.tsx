import React, { useMemo } from 'react';

interface RaindropBackgroundProps {
  intensity?: 'light' | 'moderate';
}

export const RaindropBackground: React.FC<RaindropBackgroundProps> = ({ intensity = 'light' }) => {
  // Generate deterministic drops to prevent layout shifts on re-renders
  const drops = useMemo(() => {
    const count = intensity === 'light' ? 24 : 36;
    return Array.from({ length: count }, (_, i) => {
      const left = ((i * 100) / count) + (Math.sin(i * 1.5) * 2.5);
      const duration = 2.4 + ((i * 13) % 25) / 10; // 2.4s to 4.9s
      const delay = ((i * 17) % 30) / 10; // 0s to 3s
      const height = 18 + ((i * 7) % 24); // 18px to 42px
      const opacity = 0.18 + ((i * 11) % 35) / 100; // 0.18 to 0.53
      const width = i % 4 === 0 ? 2 : 1.5;

      return {
        id: i,
        left: Math.max(1, Math.min(99, left)),
        duration,
        delay,
        height,
        opacity,
        width,
      };
    });
  }, [intensity]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Soft atmospheric ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-[600px] h-64 bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Falling Raindrops */}
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute rounded-full bg-gradient-to-b from-teal-400/0 via-teal-500/40 to-cyan-600/60 animate-raindrop"
          style={{
            left: `${drop.left}%`,
            width: `${drop.width}px`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}

      {/* Gentle soft grid/dot texture for architectural precision */}
      <div 
        className="absolute inset-0 opacity-[0.025] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        style={{
          backgroundImage: 'radial-gradient(#0f766e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
