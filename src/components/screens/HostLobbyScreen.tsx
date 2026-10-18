import React from 'react';
import { Room } from '../../types';
import { GAMES } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';
import { Soundboard } from '../Soundboard';

interface HostLobbyScreenProps {
  room: Room;
  roomCode: string;
  onStartGame: () => Promise<void>;
  onQuitRoom: () => Promise<void>;
}

export const HostLobbyScreen: React.FC<HostLobbyScreenProps> = ({
  room,
  roomCode,
  onStartGame,
  onQuitRoom,
}) => {
  const g = GAMES[room.gameType] || GAMES.blindtest;
  const players = Object.values(room.players || {});
  const n = players.length;

  return (
    <div className="game-screen active">
      {/* Topbar */}
      <div className="g-topbar">
        <div className="text-[26px]">{g.emoji}</div>
        <div className="g-label">{room.title || g.name}</div>
        <div className="g-score">
          <span className="g-score-num text-sm">{room.questions?.length || '—'}</span>
          <span className="g-score-lbl">manches</span>
        </div>
      </div>

      {/* Stage */}
      <div className="g-stage justify-start pt-5">
        <div className="w-full max-w-[440px]">
          {/* Code box */}
          <div className="code-box">
            <div className="code-label">Code de la salle</div>
            <div className="code-val">{roomCode}</div>
            <div className="code-hint">Les joueurs entrent ce code sur leur téléphone</div>
          </div>

          {/* Players chips */}
          <div className="card dark">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70 mb-3">
              {n ? `👥 ${n} joueur${n > 1 ? 's' : ''} connecté${n > 1 ? 's' : ''}` : '👥 En attente des joueurs…'}
            </div>
            <div className="chips">
              {players.map((p) => (
                <div key={p.id} className="chip">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <AvatarDisplay player={p} size={20} />
                  </span>
                  <span>{p.name}</span>
                  {p.lvl && <span>{p.lvl}</span>}
                  {p.guest && <span className="badge-guest">Invité</span>}
                </div>
              ))}
            </div>

            {n === 0 && (
              <div className="waiting-dots">
                <div className="waiting-dot" />
                <div className="waiting-dot" />
                <div className="waiting-dot" />
              </div>
            )}
          </div>

          {/* Soundboard */}
          <Soundboard roomCode={roomCode} isInline />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pb-[calc(24px+env(safe-area-inset-bottom))] shrink-0 max-w-[440px] w-full mx-auto">
        <button
          type="button"
          className="btn btn-primary"
          style={{ opacity: n ? 1 : 0.5 }}
          onClick={onStartGame}
        >
          🎵 Démarrer !
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm w-full"
          onClick={onQuitRoom}
        >
          ✕ Fermer la salle
        </button>
      </div>
    </div>
  );
};
