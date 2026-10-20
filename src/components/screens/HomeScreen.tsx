import React, { useEffect, useState } from 'react';
import { GameType, Room, SessionData, UserProfile } from '../../types';
import { AvatarDisplay } from '../AvatarDisplay';
import { GAMES, levelFor } from '../../lib/constants';
import { dbGet } from '../../lib/firebase';
import {
  gameBlindtestImg,
  gameQuizImg,
  modeBlitzImg,
  modeIntrusImg,
  modeSpeedImg,
  modeSurvieImg,
} from '../../assets/images';

interface HomeScreenProps {
  profile: UserProfile | null;
  guestName: string;
  guestAvatar: string;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onOpenHost: (gameType: GameType) => void;
  onJoinRoom: (name: string, code: string) => void;
  session: SessionData | null;
  onReconnect: () => void;
  onDismissReconnect: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  guestName,
  guestAvatar,
  onOpenProfile,
  onOpenLogin,
  onOpenHost,
  onJoinRoom,
  session,
  onReconnect,
  onDismissReconnect,
}) => {
  const [activeRooms, setActiveRooms] = useState<{ code: string; room: Room }[]>([]);
  const [joinName, setJoinName] = useState(profile ? profile.name : guestName);
  const [joinCode, setJoinCode] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (profile?.name) setJoinName(profile.name);
    else if (guestName) setJoinName(guestName);
  }, [profile, guestName]);

  useEffect(() => {
    const fetchRooms = async () => {
      const data = await dbGet<Record<string, Room>>('rooms');
      if (data) {
        const list = Object.entries(data)
          .filter(([, r]) => r.phase !== 'scores')
          .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
          .map(([code, room]) => ({ code, room }));
        setActiveRooms(list);
      } else {
        setActiveRooms([]);
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = () => {
    setJoinErr('');
    const name = joinName.trim();
    const code = joinCode.trim().toUpperCase();
    if (!name) {
      setJoinErr('Entre ton prénom !');
      return;
    }
    if (code.length < 5) {
      setJoinErr('Code de 5 lettres requis');
      return;
    }
    setJoining(true);
    onJoinRoom(name, code);
    setJoining(false);
  };

  const isConnected = !!profile;
  const lvlInfo = profile ? levelFor(profile.xp) : null;

  return (
    <div className="wrap">
      {/* Header */}
      <div className="app-header">
        <div className="hdr-avatar" onClick={onOpenProfile}>
          {profile ? (
            <AvatarDisplay player={profile} size={46} />
          ) : (
            <span id="hdrAvatarEmoji">{guestAvatar || '👤'}</span>
          )}
        </div>
        <div className="hdr-info">
          <div className="hdr-hi">
            {isConnected && lvlInfo ? `${lvlInfo.icon} ${lvlInfo.name}` : 'Mode invité 🎭'}
          </div>
          <div className="hdr-name">{isConnected ? profile.name : guestName || 'Piza-House'}</div>
        </div>
        {isConnected ? (
          <button type="button" className="hdr-btn ghost" onClick={onOpenProfile}>
            👤 Profil
          </button>
        ) : (
          <button type="button" className="hdr-btn" onClick={onOpenLogin}>
            S'inscrire
          </button>
        )}
      </div>

      {/* Guest Banner */}
      {!isConnected && (
        <div className="guest-banner">
          <h3>🎮 Crée ton compte gratuit</h3>
          <p>
            Gagne de l'XP, monte en niveau et grimpe au classement. Ta progression est sauvegardée sur
            tous tes appareils !
          </p>
          <button type="button" className="btn-signup" onClick={onOpenLogin}>
            ✨ Créer un compte ou se connecter
          </button>
        </div>
      )}

      {/* Reconnect Banner */}
      {session && (
        <div className="card dark mt-3">
          <div className="font-black text-sm mb-1">
            {session.role === 'mj' ? '🎤 Partie en cours — Hôte' : `🎮 Partie en cours — ${session.name}`}
          </div>
          <div className="text-xs text-white/70 mb-3">
            Salle {session.code} · {session.title || 'Partie'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm flex-1"
              onClick={onReconnect}
            >
              ▶️ Reprendre
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm flex-1"
              onClick={onDismissReconnect}
            >
              ✕ Ignorer
            </button>
          </div>
        </div>
      )}

      {/* Principaux jeux */}
      <div className="sect-title">Principaux jeux</div>
      <div className="game-buttons-grid">
        <button
          type="button"
          className="game-btn"
          onClick={() => onOpenHost('blindtest')}
        >
          <div className="game-btn-img-box">
            <img src={gameBlindtestImg} alt="Blind Test" />
          </div>
          <div className="game-btn-label">Blind Test</div>
        </button>

        <button
          type="button"
          className="game-btn"
          onClick={() => onOpenHost('quiz')}
        >
          <div className="game-btn-img-box">
            <img src={gameQuizImg} alt="Quiz Culture G." />
          </div>
          <div className="game-btn-label">Quiz Culture G.</div>
        </button>
      </div>

      {/* Modes Arcade */}
      <div className="sect-title flex items-center justify-between">
        <span>🕹️ Modes Arcade</span>
        <span className="text-[10px] text-[#ffd700] font-black bg-[rgba(255,215,0,0.15)] py-0.5 px-2 rounded-md">
          4 OPTIONS
        </span>
      </div>
      <div className="game-buttons-grid">
        <button
          type="button"
          className="game-btn"
          onClick={() => onOpenHost('speed')}
        >
          <div className="game-btn-img-box">
            <img src={modeSpeedImg} alt="Chrono Éclair" />
          </div>
          <div className="game-btn-label">Chrono Éclair</div>
        </button>

        <button
          type="button"
          className="game-btn"
          onClick={() => onOpenHost('survie')}
        >
          <div className="game-btn-img-box">
            <img src={modeSurvieImg} alt="Mort Subite" />
          </div>
          <div className="game-btn-label">Mort Subite</div>
        </button>

        <button
          type="button"
          className="game-btn"
          onClick={() => onOpenHost('intrus')}
        >
          <div className="game-btn-img-box">
            <img src={modeIntrusImg} alt="L'Intrus" />
          </div>
          <div className="game-btn-label">L'Intrus</div>
        </button>

        <button
          type="button"
          className="game-btn"
          onClick={() => onOpenHost('blitz')}
        >
          <div className="game-btn-img-box">
            <img src={modeBlitzImg} alt="Combo Blitz" />
          </div>
          <div className="game-btn-label">Combo Blitz</div>
        </button>
      </div>

      {/* Multijoueur */}
      <div className="sect-title">Multijoueur</div>
      <div className="rooms-scroll">
        {activeRooms.length === 0 ? (
          <div className="rooms-empty">Aucune salle active pour l'instant…</div>
        ) : (
          activeRooms.map(({ code, room }) => {
            const def = GAMES[room.gameType] || GAMES.blindtest;
            const count = Object.keys(room.players || {}).length;
            return (
              <div
                key={code}
                className="room-card"
                onClick={() => {
                  setJoinCode(code);
                }}
              >
                <div className="rc-top">
                  <span className="rc-emoji">{def.emoji}</span>
                  <span className="rc-code">{code}</span>
                </div>
                <div className="rc-title">{room.title || def.name}</div>
                <div className="rc-meta">
                  {def.name} · {count} joueur{count > 1 ? 's' : ''}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rejoindre avec un code */}
      <div className="sect-title">Rejoindre avec un code</div>
      <div className="card dark">
        <input
          className="inp"
          placeholder="Ton prénom"
          maxLength={20}
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
        />
        <input
          className="inp inp-code"
          placeholder="CODE"
          maxLength={5}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin();
          }}
        />
        {joinErr && <p className="err show">{joinErr}</p>}
        <button
          type="button"
          className="btn btn-primary mb-0"
          disabled={joining}
          onClick={handleJoin}
        >
          {joining ? '⏳ Connexion…' : '🚀 Rejoindre'}
        </button>
      </div>
    </div>
  );
};
