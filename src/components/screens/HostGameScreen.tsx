import React, { useEffect, useState } from 'react';
import { Room } from '../../types';
import { CIRC, getAnswerTime, ts } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';
import { Soundboard } from '../Soundboard';
import { extractDeezerTrackId } from '../../lib/deezer';

interface HostGameScreenProps {
  room: Room;
  roomCode: string;
  onStopRound: () => Promise<void>;
  onNextRound: () => Promise<void>;
}

export const HostGameScreen: React.FC<HostGameScreenProps> = ({
  room,
  roomCode,
  onStopRound,
  onNextRound,
}) => {
  const currentQ = room.questions[room.currentQ];
  const maxTime = getAnswerTime(room.gameType);
  const [timeLeft, setTimeLeft] = useState(maxTime);

  useEffect(() => {
    if (room.phase !== 'music' || !room.musicStartedAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, maxTime - (ts() - (room.musicStartedAt || 0)) / 1000);
      setTimeLeft(remaining);
    }, 200);
    return () => clearInterval(interval);
  }, [room.phase, room.musicStartedAt, maxTime]);

  const answers = room.answers?.[room.currentQ] || {};
  const players = Object.values(room.players || {});
  const ansCount = Object.keys(answers).length;
  const isReveal = room.phase === 'reveal';
  const isLast = room.currentQ + 1 >= room.questions.length;

  const arcOffset = CIRC * (1 - timeLeft / maxTime);
  const timerColor = timeLeft <= 0 ? 'rgba(255,255,255,.4)' : timeLeft <= 3 ? '#ffd7d0' : '#fff';
  const trackId = currentQ?.url ? extractDeezerTrackId(currentQ.url) : null;

  return (
    <div className="game-screen active">
      {/* Topbar */}
      <div className="g-topbar">
        <div className={`g-timer ${timeLeft <= 3 && timeLeft > 0 ? 'urgent' : ''}`}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="4" />
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke={timerColor}
              strokeWidth="4"
              strokeDasharray={CIRC}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
          <span className="g-timer-num" style={{ color: timerColor }}>
            {Math.ceil(timeLeft)}
          </span>
        </div>
        <div className="g-label">
          Manche {room.currentQ + 1}/{room.questions.length}
        </div>
        <div className="g-score">
          <span className="g-score-num text-base">
            {ansCount}/{players.length}
          </span>
          <span className="g-score-lbl">réponses</span>
        </div>
      </div>

      {/* Stage */}
      <div className="g-stage justify-start pt-3">
        <div className="w-full max-w-[440px]">
          {!isReveal ? (
            <>
              {/* Deezer player or Quiz box */}
              {room.gameType === 'quiz' ? (
                <div className="quiz-q-box mb-3">🧠 {currentQ?.title}</div>
              ) : trackId ? (
                <div className="deezer-wrap mb-3">
                  <iframe
                    title="Deezer player"
                    scrolling="no"
                    frameBorder="0"
                    allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"
                    src={`https://widget.deezer.com/widget/dark/track/${trackId}?autoplay=1`}
                    style={{ width: '100%', height: '80px', borderRadius: '12px' }}
                  />
                  <p className="playing-txt mt-1">🎧 Lecture du morceau chez toi</p>
                </div>
              ) : (
                <div className="deezer-warn mb-3">⚠️ Lecteur indisponible</div>
              )}

              {/* Answers list */}
              <div className="ans-list-card">
                <div className="ans-bar-label">
                  <span>Réponses</span>
                  <span>
                    {ansCount}/{players.length}
                  </span>
                </div>
                <div>
                  {players.map((p) => {
                    const ans = answers[p.id];
                    return (
                      <div key={p.id} className="p-row">
                        <div className="p-avatar">
                          <AvatarDisplay player={p} size={28} />
                        </div>
                        <div className="p-name">{p.name}</div>
                        <div className="p-status">{ans ? '✔️' : '⏳'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Soundboard */}
              <Soundboard roomCode={roomCode} isInline />
            </>
          ) : (
            <>
              {/* Reveal Phase */}
              <div className="text-center mb-3.5">
                <div className="reveal-label">Manche {room.currentQ + 1} — Bonne réponse</div>
                <div className="reveal-name">
                  {currentQ?.choices[currentQ.answer]}
                </div>
              </div>

              <div className="ans-list-card">
                <div className="ans-bar-label">
                  <span>Résultats</span>
                  <span />
                </div>
                <div>
                  {players.map((p) => {
                    const a = answers[p.id];
                    const ok = a && a.choice === currentQ.answer;
                    return (
                      <div key={p.id} className={`reveal-row ${ok ? 'bg-white/10' : ''}`}>
                        <div className="reveal-nm">
                          <span className="inline-flex items-center justify-center w-5 h-5">
                            <AvatarDisplay player={p} size={22} />
                          </span>
                          <span>{p.name}</span>
                        </div>
                        <span className="reveal-pts">
                          {!a ? '⏱️ —' : ok ? `✅ +${a.points}` : '❌'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pb-[calc(20px+env(safe-area-inset-bottom))] shrink-0 max-w-[440px] w-full mx-auto">
        {!isReveal ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStopRound}
          >
            ⏹ Révéler la réponse
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-dark"
            onClick={onNextRound}
          >
            {isLast ? '🏆 Classement final !' : '➡️ Manche suivante'}
          </button>
        )}
      </div>
    </div>
  );
};
