import React from 'react';
import { Room } from '../../types';
import { MEDALS } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';

interface InterludeScreenProps {
  room: Room;
  isHost: boolean;
  onContinue: () => Promise<void>;
}

export const InterludeScreen: React.FC<InterludeScreenProps> = ({ room, isHost, onContinue }) => {
  const players = Object.values(room.players || {});
  const sorted = [...players].sort((a, b) => (room.scores?.[b.id] || 0) - (room.scores?.[a.id] || 0));

  const emoji = room.interludeComment?.emoji || '🎯';
  const comment = room.interludeComment?.comment || 'Xav prépare son commentaire… 🎤';

  return (
    <div className="game-screen active">
      <div className="interlude">
        <div className="interlude-emoji">{emoji}</div>
        <div className="interlude-comment">{comment}</div>

        <div className="mini-scores">
          {sorted.map((p, i) => (
            <div key={p.id} className="mini-row">
              <span className="mini-pos">{MEDALS[i] || `${i + 1}.`}</span>
              <span className="inline-flex items-center justify-center w-6 h-6">
                <AvatarDisplay player={p} size={24} />
              </span>
              <span className="mini-nm">{p.name}</span>
              <span className="mini-pts">{room.scores?.[p.id] || 0} pts</span>
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            type="button"
            className="btn btn-primary max-w-[360px] w-full"
            onClick={onContinue}
          >
            ➡️ Manche suivante
          </button>
        ) : (
          <p className="wait-lbl">⏳ En attente de l'hôte…</p>
        )}
      </div>
    </div>
  );
};
