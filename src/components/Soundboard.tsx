import React from 'react';
import { playAudioEffect } from '../lib/audio';
import { dbSet } from '../lib/firebase';
import { ts } from '../lib/constants';

interface SoundboardProps {
  roomCode?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean;
}

const SFX_LIST = [
  { id: 'applause', icon: '👏', label: 'Bravo !' },
  { id: 'laugh', icon: '🤣', label: 'Rires' },
  { id: 'buzz', icon: '🚨', label: 'Buzzer' },
  { id: 'airhorn', icon: '📯', label: 'Airhorn' },
  { id: 'fanfare', icon: '🏆', label: 'Fanfare' },
  { id: 'drumroll', icon: '🥁', label: 'Tambour' },
  { id: 'boom', icon: '💥', label: 'Boom !' },
  { id: 'dramatic', icon: '😱', label: 'Suspense' },
];

export const Soundboard: React.FC<SoundboardProps> = ({ roomCode, isOpen = false, onClose, isInline = false }) => {
  const handleTrigger = async (soundId: string) => {
    playAudioEffect(soundId);
    if (roomCode) {
      await dbSet(`rooms/${roomCode}/sfxTrigger`, {
        sound: soundId,
        ts: ts(),
        id: `${ts()}_${Math.random().toString(36).substring(2, 6)}`,
      });
    }
  };

  const grid = (
    <div className="soundboard-grid">
      {SFX_LIST.map((s) => (
        <button key={s.id} type="button" className="sfx-btn" onClick={() => handleTrigger(s.id)}>
          <span>{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );

  if (isInline) {
    return (
      <div className="card dark mt-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70 mb-2 flex justify-between items-center">
          <span>🔊 Soundboard Hôte</span>
          <span className="text-[10px] text-white/70 font-semibold">En direct 📢</span>
        </div>
        {grid}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="modal-box text-center max-w-[440px]">
        <div className="modal-title mb-3.5">🔊 Soundboard Hôte en Direct</div>
        {grid}
        <button
          type="button"
          className="btn btn-secondary mt-4 w-full"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
