'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  bg: string;
  delay: number;
  width: number;
  rotation: number;
}

// Paletimize uyumlu sıcak tonlar
const RENKLER = [
  '#a75c4c',
  '#d4a574',
  '#7a4a2b',
  '#e8d4a6',
  '#5a3320',
  '#c2855e',
];

const PARCACIK_SAYI = 60;

export function Konfeti({ aktif }: { aktif: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!aktif) return undefined;
    const p: Particle[] = [];
    for (let i = 0; i < PARCACIK_SAYI; i++) {
      p.push({
        id: i,
        x: Math.random() * 100,
        bg: RENKLER[Math.floor(Math.random() * RENKLER.length)]!,
        delay: Math.random() * 0.4,
        width: 6 + Math.random() * 7,
        rotation: Math.random() * 360,
      });
    }
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 2400);
    return () => clearTimeout(t);
  }, [aktif]);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="anim-confetti absolute"
          style={{
            left: `${p.x}%`,
            top: '-30px',
            width: `${p.width}px`,
            height: `${p.width * 1.6}px`,
            background: p.bg,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            borderRadius: '2px',
            boxShadow: '0 0 1px rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </div>
  );
}
