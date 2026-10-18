import React from 'react';
import { DESIGN_AVATARS } from '../lib/constants';

interface AvatarDisplayProps {
  player?: {
    avatar?: string;
    photoURL?: string;
    customPhoto?: string;
  } | string | null;
  size?: number;
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ player, size = 28, className = '' }) => {
  const s = size;

  if (!player) {
    return <span style={{ fontSize: Math.round(s * 0.55) }}>👤</span>;
  }

  if (typeof player === 'string') {
    const d = DESIGN_AVATARS[player];
    if (d) {
      if (d.image) {
        return (
          <img
            src={d.image}
            alt={d.name}
            style={{ width: `${s}px`, height: `${s}px` }}
            className={`rounded-full object-cover shadow-sm ${className}`}
          />
        );
      }
      return (
        <span
          className={`inline-flex items-center justify-center ${className}`}
          dangerouslySetInnerHTML={{ __html: d.svg(s) }}
        />
      );
    }
    return <span style={{ fontSize: Math.round(s * 0.55) }}>{player}</span>;
  }

  const av = player.avatar;
  if (av && DESIGN_AVATARS[av]) {
    const d = DESIGN_AVATARS[av];
    if (d.image) {
      return (
        <img
          src={d.image}
          alt={d.name}
          style={{ width: `${s}px`, height: `${s}px` }}
          className={`rounded-full object-cover shadow-sm ${className}`}
        />
      );
    }
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        dangerouslySetInnerHTML={{ __html: d.svg(s) }}
      />
    );
  }

  const photo = player.customPhoto || player.photoURL;
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        style={{ width: `${s}px`, height: `${s}px` }}
        className={`rounded-full object-cover shadow-sm ${className}`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  if (av) {
    return <span style={{ fontSize: Math.round(s * 0.55) }}>{av}</span>;
  }

  return <span style={{ fontSize: Math.round(s * 0.55) }}>👤</span>;
};
