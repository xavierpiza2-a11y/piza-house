import React from 'react';
import { Room } from '../../types';
import { MEDALS } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';
import { trophyGoldImg } from '../../assets/images';

interface FinalScoresScreenProps {
  room: Room;
  isHost: boolean;
  xpToastHtml?: string;
  onRestart: () => void;
  onHome: () => void;
}

export const FinalScoresScreen: React.FC<FinalScoresScreenProps> = ({
  room,
  isHost,
  xpToastHtml,
  onRestart,
  onHome,
}) => {
  const players = Object.values(room.players || {});
  const sorted = [...players].sort((a, b) => (room.scores?.[b.id] || 0) - (room.scores?.[a.id] || 0));

  const podium = sorted.slice(0, 3);
  const order = [2, 0, 1]; // 2nd on left, 1st in center, 3rd on right
  const heights = [70, 120, 95];

  const globalComment = room.finalComments?.globalComment || '💬 Xav analyse votre soirée… 🤖';
  const playerComments = room.finalComments?.playerComments || {};

  return (
    <div className="game-screen active overflow-y-auto">
      <div className="final">
        <div className="flex justify-center mb-2">
          <img
            src={trophyGoldImg}
            alt="Trophée d'or"
            className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-[#ffd700]/60 animate-bounce"
            style={{ animationDuration: '3s' }}
          />
        </div>
        <div className="final-title">🏆 Classement final</div>
        <p className="text-white/70 text-xs font-bold mb-4">{room.title}</p>

        {xpToastHtml && (
          <div
            id="xpToast"
            dangerouslySetInnerHTML={{ __html: xpToastHtml }}
          />
        )}

        {globalComment && (
          <div className="final-comment">{globalComment}</div>
        )}

        {/* Podium */}
        <div className="podium">
          {order.map((rankIdx, col) => {
            const p = podium[rankIdx];
            if (!p) return <div key={col} className="pod-col" />;
            return (
              <div
                key={p.id}
                className="pod-col"
                style={{ animation: `pop 0.5s ease ${col * 0.15}s both` }}
              >
                <div className="pod-avatar flex items-center justify-center">
                  <AvatarDisplay player={p} size={50} />
                </div>
                <div className="pod-name">{p.name}</div>
                <div className="pod-pts">{room.scores?.[p.id] || 0}</div>
                <div
                  className={`pod-block pod-${rankIdx + 1}`}
                  style={{ height: `${heights[col]}px` }}
                >
                  {MEDALS[rankIdx] || ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final list */}
        <div className="final-list">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className="final-row"
              style={{ animation: `slideUp 0.4s ease ${i * 0.08}s both` }}
            >
              <span className="fr-medal">{MEDALS[i] || `${i + 1}.`}</span>
              <span className="fr-avatar inline-flex items-center justify-center">
                <AvatarDisplay player={p} size={28} />
              </span>
              <div className="fr-info">
                <div className="fr-name">
                  {p.name} {p.guest && <span className="badge-guest">Invité</span>}
                </div>
                <div className="fr-comment">
                  {playerComments[p.id] ? `💬 ${playerComments[p.id]}` : '💬 …'}
                </div>
              </div>
              <span className="fr-pts">{room.scores?.[p.id] || 0} pts</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            type="button"
            className="btn btn-primary max-w-[400px] w-full"
            onClick={onRestart}
          >
            🔄 Revanche !
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary max-w-[400px] w-full"
          onClick={onHome}
        >
          🏠 Accueil
        </button>
      </div>
    </div>
  );
};
