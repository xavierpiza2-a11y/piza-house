import React, { useEffect, useState } from 'react';
import { Player, Room } from '../../types';
import { CIRC, getAnswerTime, getPlayerStreak, isEliminated, ts } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';

interface PlayerGameScreenProps {
  room: Room;
  player: Player;
  isHostPlaying: boolean;
  onAnswer: (choiceIndex: number) => Promise<void>;
  onHostReveal: () => Promise<void>;
  onHostNextRound: () => Promise<void>;
  onOpenSoundboard: () => void;
}

const KAH_ICONS = ['▲', '◆', '●', '■'];

export const PlayerGameScreen: React.FC<PlayerGameScreenProps> = ({
  room,
  player,
  isHostPlaying,
  onAnswer,
  onHostReveal,
  onHostNextRound,
  onOpenSoundboard,
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
  const myAns = answers[player.id];
  const myScore = room.scores?.[player.id] || 0;
  const isReveal = room.phase === 'reveal';
  const eliminated = isEliminated(room, player.id);
  const players = Object.values(room.players || {});
  const ansCount = Object.keys(answers).length;
  const isLast = room.currentQ + 1 >= room.questions.length;

  let qLabel = '🎵 Écoute bien…';
  if (room.gameType === 'speed') qLabel = '⚡ 5s CHRONO ! Vitesse pure';
  else if (room.gameType === 'survie') qLabel = '🔥 MORT SUBITE - 1 erreur = 💀';
  else if (room.gameType === 'intrus') qLabel = "🎭 TROUVE L'INTRUS PIÈGE !";
  else if (room.gameType === 'blitz') qLabel = '💥 COMBO BLITZ ! Multiplicateurs';
  else if (room.gameType === 'quiz') qLabel = '🧠 Ta réponse ?';

  let qText = currentQ?.title || '';
  if (room.gameType === 'blitz') {
    const streak = getPlayerStreak(room, player.id, room.currentQ);
    if (streak >= 3) qText = `🔥 (COMBO x3!) ${currentQ?.title}`;
    else if (streak >= 1) qText = `⚡ (COMBO x2!) ${currentQ?.title}`;
  } else if (room.gameType === 'intrus') {
    if (!qText.toLowerCase().includes('intrus')) qText = `🎭 ${qText} — Trouve l'intrus !`;
  }

  const arcOffset = CIRC * (1 - timeLeft / maxTime);
  const timerColor = timeLeft <= 0 ? 'rgba(255,255,255,.4)' : timeLeft <= 3 ? '#ffd7d0' : '#fff';

  return (
    <div className={`game-screen active ${isHostPlaying ? 'host-playing' : ''}`}>
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
        <div className="g-label">{qLabel}</div>
        <div className="g-score">
          <span className="g-score-num">{myScore}</span>
          <span className="g-score-lbl">pts</span>
        </div>
      </div>

      {/* Stage */}
      {!isReveal ? (
        <div className="g-stage">
          {room.gameType === 'blindtest' ? (
            <div className="music-visual">
              <div className="note-bg">🎵</div>
              <div className="bars">
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
              </div>
              <p className="playing-txt">La musique joue chez l'hôte…</p>
            </div>
          ) : (
            <div className="quiz-q-box my-0 mx-1 max-w-[440px] w-full">
              {qText}
            </div>
          )}

          {/* Status Box */}
          <div className="status-box">
            {eliminated ? (
              <div className="expired" style={{ background: 'rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                💀 Éliminé en Mort Subite
              </div>
            ) : myAns !== undefined ? (
              <div className="answered">✅ Réponse enregistrée !</div>
            ) : timeLeft <= 0 ? (
              <div className="expired">⏱️ Temps écoulé</div>
            ) : null}
          </div>

          {/* Answers list */}
          <div className="ans-list-card">
            <div className="ans-bar-label">
              <span>Réponses</span>
              <span>
                {ansCount} / {players.length}
              </span>
            </div>
            <div>
              {players.map((p) => {
                const a = answers[p.id];
                const has = a !== undefined;
                return (
                  <div
                    key={p.id}
                    className={`p-row ${p.id === player.id ? 'me' : ''}`}
                  >
                    <div className="p-avatar">
                      <AvatarDisplay player={p} size={28} />
                    </div>
                    <div className="p-name">{p.name}</div>
                    <div className="p-status">{has ? '✔️' : '⏳'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Reveal view */
        <div className="g-stage">
          <div className="reveal-box">
            {myAns ? (
              myAns.choice === currentQ?.answer ? (
                <div className="result-win">🎉 Bravo ! +{myAns.points} points</div>
              ) : (
                <div className="result-lose">
                  😢 Raté ! C'était : {currentQ?.choices[currentQ.answer]}
                </div>
              )
            ) : (
              <div className="result-lose">⏱️ Trop lent cette fois…</div>
            )}
            <div className="reveal-label">Bonne réponse</div>
            <div className="reveal-name">{currentQ?.choices[currentQ?.answer]}</div>
          </div>

          <div className="ans-list-card">
            <div className="ans-bar-label">
              <span>Résultats</span>
              <span />
            </div>
            <div>
              {players.map((pl) => {
                const pa = answers[pl.id];
                const pok = pa && pa.choice === currentQ?.answer;
                return (
                  <div
                    key={pl.id}
                    className={`reveal-row ${pl.id === player.id ? 'me' : ''}`}
                  >
                    <div className="reveal-nm">
                      <span className="inline-flex items-center justify-center w-5 h-5">
                        <AvatarDisplay player={pl} size={22} />
                      </span>
                      <span>{pl.name}</span>
                    </div>
                    <span className="reveal-pts">
                      {!pa ? '⏱️ —' : pok ? `✅ +${pa.points}` : '❌'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Choices Grid */}
      <div className="choices">
        {currentQ?.choices.map((c, ci) => {
          let cls = '';
          let disabled = false;

          if (isReveal) {
            const isCorrect = ci === currentQ.answer;
            const isChosen = myAns && myAns.choice === ci;
            cls = isCorrect ? 'correct' : isChosen ? 'wrong' : 'dim';
            disabled = true;
          } else {
            if (eliminated) {
              cls = 'dim';
              disabled = true;
            } else if (myAns !== undefined) {
              cls = myAns.choice === ci ? 'selected' : 'dim';
              disabled = true;
            } else if (timeLeft <= 0) {
              cls = 'dim';
              disabled = true;
            }
          }

          return (
            <button
              key={ci}
              type="button"
              className={`choice-btn enter-${ci + 1} ${cls}`}
              disabled={disabled}
              onClick={() => onAnswer(ci)}
            >
              <span className="ci">{isReveal && ci === currentQ.answer ? '✅' : isReveal && myAns?.choice === ci ? '❌' : KAH_ICONS[ci]}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>

      {/* Host FAB when host plays */}
      {isHostPlaying && (
        <div className="host-fab show">
          {!isReveal ? (
            <>
              <div className="fab-info">
                👑 {ansCount}/{players.length} ont répondu
              </div>
              <button type="button" className="fab-btn" onClick={onHostReveal}>
                ⏹ Révéler
              </button>
              <button
                type="button"
                className="fab-btn-icon"
                title="Soundboard Hôte"
                onClick={onOpenSoundboard}
              >
                🔊
              </button>
            </>
          ) : (
            <>
              <button type="button" className="fab-btn" onClick={onHostNextRound}>
                {isLast ? '🏆 Scores finals' : '⏭ Manche suivante'}
              </button>
              <button
                type="button"
                className="fab-btn-icon"
                title="Soundboard Hôte"
                onClick={onOpenSoundboard}
              >
                🔊
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
