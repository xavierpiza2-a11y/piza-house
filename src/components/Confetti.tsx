import React, { useEffect, useState } from 'react';
import { randItem } from '../lib/constants';

interface ConfettiProps {
  trigger: number;
}

interface ConfettiPiece {
  id: number;
  left: number;
  bg: string;
  size: number;
  isCircle: boolean;
  duration: number;
  delay: number;
}

const COLORS = ['#F5C518', '#2ABFBF', '#ec4899', '#8b5cf6', '#10b981', '#fff', '#1A1A2E'];

export const Confetti: React.FC<ConfettiProps> = ({ trigger }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const generated: ConfettiPiece[] = [];
    for (let i = 0; i < 60; i++) {
      generated.push({
        id: i,
        left: Math.random() * 100,
        bg: randItem(COLORS),
        size: 6 + Math.random() * 8,
        isCircle: Math.random() > 0.5,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 0.5,
      });
    }
    setPieces(generated);
    const timeout = setTimeout(() => {
      setPieces([]);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (!pieces.length) return null;

  return (
    <div className="confetti-wrap">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="conf"
          style={{
            left: `${p.left}vw`,
            background: p.bg,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.isCircle ? '50%' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
