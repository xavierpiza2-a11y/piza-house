import React from 'react';
import { Player, Room } from '../../types';
import { AvatarDisplay } from '../AvatarDisplay';

interface PlayerLobbyScreenProps {
  room: Room;
  player: Player;
}

export const PlayerLobbyScreen: React.FC<PlayerLobbyScreenProps> = ({ room, player }) => {
  const players = Object.values(room.players || {});

  return (
    <div className="game-screen active">
      <div className="g-stage">
        <div className="text-center w-full max-w-[380px]">
          <div className="text-6xl mb-3 flex justify-center">
            <AvatarDisplay player={player} size={64} />
          </div>
          <h2 className="text-2xl font-black mb-1.5 text-white">{player.name}</h2>
          <p className="text-white/70 text-sm font-bold mb-5">{room.title}</p>

          <div className="card dark text-left">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70 mb-3">
              👥 {players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}
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
          </div>

          <div className="waiting-dots">
            <div className="waiting-dot" />
            <div className="waiting-dot" />
            <div className="waiting-dot" />
          </div>
          <p className="text-white/70 text-xs font-bold">L'hôte prépare la soirée… 🎲</p>
        </div>
      </div>
    </div>
  );
};
