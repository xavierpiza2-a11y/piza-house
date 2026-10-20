import React, { useEffect, useState } from 'react';
import { AppConfig, GameType, Room, UserProfile } from '../../types';
import { ADMIN_EMAIL, CONFIG_REF, dbGet, dbRemove, dbSet, USERS_REF } from '../../lib/api';
import { GAMES, levelFor } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';
import { DEFAULT_PROMPTS, DEFAULT_PROMPTS_QUIZ } from '../../lib/claude';

interface AdminScreenProps {
  currentProfile: UserProfile | null;
  onBack: () => void;
  onEditPlayer: (player: UserProfile) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ currentProfile, onBack, onEditPlayer }) => {
  const [tab, setTab] = useState<'rooms' | 'profiles' | 'config'>('rooms');
  const [loading, setLoading] = useState(false);

  // Rooms
  const [rooms, setRooms] = useState<{ code: string; room: Room }[]>([]);

  // Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Config
  const [config, setConfig] = useState<AppConfig>({
    timer: 20,
    rounds: 10,
    interludeEnabled: true,
    interludeFreq: 3,
    finalEnabled: true,
  });

  // Prompts
  const [promptGame, setPromptGame] = useState<GameType>('blindtest');
  const [promptInterlude, setPromptInterlude] = useState(DEFAULT_PROMPTS.interlude);
  const [promptFinal, setPromptFinal] = useState(DEFAULT_PROMPTS.finalScores);
  const [savePromptStatus, setSavePromptStatus] = useState(false);

  useEffect(() => {
    loadTabContent();
  }, [tab]);

  const loadTabContent = async () => {
    setLoading(true);
    if (tab === 'rooms') {
      const data = await dbGet<Record<string, Room>>('rooms');
      if (data) {
        const list = Object.entries(data)
          .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
          .map(([code, room]) => ({ code, room }));
        setRooms(list);
      } else {
        setRooms([]);
      }
    } else if (tab === 'profiles') {
      const data = await dbGet<Record<string, UserProfile>>(USERS_REF);
      if (data) {
        const list = Object.values(data).sort((a, b) => (b.xp || 0) - (a.xp || 0));
        setProfiles(list);
      } else {
        setProfiles([]);
      }
    } else if (tab === 'config') {
      const cfg = await dbGet<AppConfig>(CONFIG_REF);
      if (cfg) setConfig((prev) => ({ ...prev, ...cfg }));

      const savedPrompts = await dbGet<any>(`${CONFIG_REF}/prompts`);
      loadPromptsForGame(promptGame, savedPrompts);
    }
    setLoading(false);
  };

  const loadPromptsForGame = (g: GameType, savedData?: any) => {
    const data = savedData || {};
    const gamePrompts = data[g] || {};
    if (g === 'quiz') {
      setPromptInterlude(gamePrompts.interlude || DEFAULT_PROMPTS_QUIZ.interlude);
      setPromptFinal(gamePrompts.finalScores || DEFAULT_PROMPTS_QUIZ.finalScores);
    } else {
      setPromptInterlude(gamePrompts.interlude || DEFAULT_PROMPTS.interlude);
      setPromptFinal(gamePrompts.finalScores || DEFAULT_PROMPTS.finalScores);
    }
  };

  const handleSwitchPromptGame = async (g: GameType) => {
    setPromptGame(g);
    const savedPrompts = await dbGet<any>(`${CONFIG_REF}/prompts`);
    loadPromptsForGame(g, savedPrompts);
  };

  const handleDeleteRoom = async (code: string) => {
    if (!confirm(`Supprimer la salle ${code} ?`)) return;
    await dbRemove(`rooms/${code}`);
    loadTabContent();
  };

  const handlePurgeRooms = async () => {
    const finished = rooms.filter((r) => r.room.phase === 'scores').map((r) => r.code);
    if (!finished.length) {
      alert('Aucune partie terminée.');
      return;
    }
    if (!confirm(`Supprimer ${finished.length} partie(s) terminée(s) ?`)) return;
    await Promise.all(finished.map((c) => dbRemove(`rooms/${c}`)));
    loadTabContent();
  };

  const handleDeleteProfile = async (uid: string) => {
    if (uid === currentProfile?.uid) {
      alert('Impossible de supprimer ton propre profil');
      return;
    }
    if (!confirm('Supprimer ce joueur ?')) return;
    await dbRemove(`${USERS_REF}/${uid}`);
    loadTabContent();
  };

  const handleToggleConfig = async (key: 'interludeEnabled' | 'finalEnabled') => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    await dbSet(CONFIG_REF, updated);
  };

  const handleUpdateFreq = async (delta: number) => {
    const newFreq = Math.min(5, Math.max(2, config.interludeFreq + delta));
    const updated = { ...config, interludeFreq: newFreq };
    setConfig(updated);
    await dbSet(CONFIG_REF, updated);
  };

  const handleSavePrompts = async () => {
    await dbSet(`${CONFIG_REF}/prompts/${promptGame}`, {
      interlude: promptInterlude,
      finalScores: promptFinal,
    });
    setSavePromptStatus(true);
    setTimeout(() => setSavePromptStatus(false), 2000);
  };

  const handleResetPrompts = async () => {
    if (!confirm('Réinitialiser les prompts de ce jeu ?')) return;
    await dbRemove(`${CONFIG_REF}/prompts/${promptGame}`);
    if (promptGame === 'quiz') {
      setPromptInterlude(DEFAULT_PROMPTS_QUIZ.interlude);
      setPromptFinal(DEFAULT_PROMPTS_QUIZ.finalScores);
    } else {
      setPromptInterlude(DEFAULT_PROMPTS.interlude);
      setPromptFinal(DEFAULT_PROMPTS.finalScores);
    }
  };

  const phaseLabel = (p: string) => {
    return p === 'lobby'
      ? '🕐 Lobby'
      : p === 'scores'
      ? '🏁 Terminée'
      : p === 'interlude'
      ? '🎙️ Interlude'
      : '🎵 En jeu';
  };

  return (
    <div className="game-screen active overflow-y-auto bg-[var(--bg)]">
      <div className="admin-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ←
        </button>
        <div className="text-2xl">⚙️</div>
        <div className="admin-header-info">
          <div className="admin-header-title">Panneau Admin</div>
          <div className="admin-header-sub">
            {currentProfile?.name} · Administrateur
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <div
          className={`admin-tab ${tab === 'rooms' ? 'active' : ''}`}
          onClick={() => setTab('rooms')}
        >
          🗂️ Salles
        </div>
        <div
          className={`admin-tab ${tab === 'profiles' ? 'active' : ''}`}
          onClick={() => setTab('profiles')}
        >
          👥 Joueurs
        </div>
        <div
          className={`admin-tab ${tab === 'config' ? 'active' : ''}`}
          onClick={() => setTab('config')}
        >
          ⚙️ Config
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="spin-load">
            <span className="spin-icon">⏳</span>
          </div>
        ) : tab === 'rooms' ? (
          <div className="admin-section">
            <div className="admin-section-title">Salles ({rooms.length})</div>
            {rooms.length === 0 ? (
              <div className="text-white/70 text-center py-5">Aucune salle</div>
            ) : (
              rooms.map(({ code, room }) => {
                const def = GAMES[room.gameType] || GAMES.blindtest;
                return (
                  <div key={code} className="a-item">
                    <div className="text-2xl">{def.emoji}</div>
                    <div className="a-item-info">
                      <div className="a-item-name">
                        {room.title || 'Sans titre'} · {code}
                      </div>
                      <div className="a-item-meta">
                        {phaseLabel(room.phase)} · {Object.keys(room.players || {}).length} joueur(s) ·{' '}
                        {(room.questions || []).length} manche(s)
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDeleteRoom(code)}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                );
              })
            )}
            {rooms.length > 0 && (
              <button
                type="button"
                className="btn btn-danger mt-2"
                onClick={handlePurgeRooms}
              >
                🧹 Purger les parties terminées
              </button>
            )}
          </div>
        ) : tab === 'profiles' ? (
          <div className="admin-section">
            <div className="admin-section-title">Joueurs ({profiles.length})</div>
            {profiles.map((p) => {
              const lv = levelFor(p.xp);
              const stars = p.stars || 0;
              const avs = (p.unlockedAvatars || []).length;
              const bdg = (p.badges || []).length;
              return (
                <div key={p.uid} className="a-item">
                  <div className="rank-avatar">
                    <AvatarDisplay player={p} size={40} />
                  </div>
                  <div className="a-item-info">
                    <div className="a-item-name">
                      {p.name}{' '}
                      {p.isAdmin && (
                        <span className="text-[10px] bg-[var(--dark)] py-0.5 px-1.5 rounded-md">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="a-item-meta">
                      {lv.icon} {lv.name} · {p.xp || 0} XP · ⭐ {stars} · 🎭 {avs} · 🏆 {bdg}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="btn-sm btn-primary py-1.5 px-3 text-xs"
                      onClick={() => onEditPlayer(p)}
                    >
                      ✏️ Éditer
                    </button>
                    {p.email !== ADMIN_EMAIL && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleDeleteProfile(p.uid)}
                        title="Supprimer le joueur"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="admin-section">
              <div className="admin-section-title">Paramètres</div>
              <div className="card dark py-1.5 px-3.5">
                <div className="config-row">
                  <div>
                    <div className="config-label">Commentaires interlude</div>
                    <div className="config-sub">Xav commente entre les manches</div>
                  </div>
                  <div onClick={() => handleToggleConfig('interludeEnabled')}>
                    <div
                      className={`cfg-toggle ${config.interludeEnabled ? 'on' : ''}`}
                    />
                  </div>
                </div>

                <div
                  className="config-row"
                  style={{
                    opacity: config.interludeEnabled ? 1 : 0.4,
                    pointerEvents: config.interludeEnabled ? 'auto' : 'none',
                  }}
                >
                  <div>
                    <div className="config-label">Fréquence interlude</div>
                    <div className="config-sub">Toutes les N manches</div>
                  </div>
                  <div className="config-val">
                    <button
                      type="button"
                      className="config-btn"
                      onClick={() => handleUpdateFreq(-1)}
                    >
                      −
                    </button>
                    <span>{config.interludeFreq}</span>
                    <button
                      type="button"
                      className="config-btn"
                      onClick={() => handleUpdateFreq(1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="config-row">
                  <div>
                    <div className="config-label">Commentaires scores finaux</div>
                    <div className="config-sub">Xav analyse le podium</div>
                  </div>
                  <div onClick={() => handleToggleConfig('finalEnabled')}>
                    <div
                      className={`cfg-toggle ${config.finalEnabled ? 'on' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <div className="admin-section-title">Prompts IA</div>
              <div className="pill-row mb-3.5">
                <button
                  type="button"
                  className={`pill ${promptGame === 'blindtest' ? 'active' : ''}`}
                  onClick={() => handleSwitchPromptGame('blindtest')}
                >
                  🎤 Blind Test
                </button>
                <button
                  type="button"
                  className={`pill ${promptGame === 'quiz' ? 'active' : ''}`}
                  onClick={() => handleSwitchPromptGame('quiz')}
                >
                  💡 Quiz
                </button>
              </div>

              <div className="admin-section-title">💬 Interlude</div>
              <textarea
                className="inp min-h-[120px] text-xs font-mono"
                value={promptInterlude}
                onChange={(e) => setPromptInterlude(e.target.value)}
              />

              <div className="admin-section-title">🏆 Scores finaux</div>
              <textarea
                className="inp min-h-[120px] text-xs font-mono"
                value={promptFinal}
                onChange={(e) => setPromptFinal(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary flex-1 text-xs"
                  onClick={handleResetPrompts}
                >
                  ↺ Défaut
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1 text-xs"
                  onClick={handleSavePrompts}
                >
                  {savePromptStatus ? '✅ Enregistré' : '💾 Sauver'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
