import React from 'react';
import { UserProfile } from '../../types';
import { BADGES, levelFor } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';

interface ProfileScreenProps {
  profile: UserProfile | null;
  onOpenLogin: () => void;
  onOpenEditProfile: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onOpenLogin,
  onOpenEditProfile,
  onOpenAdmin,
  onLogout,
}) => {
  if (!profile) {
    return (
      <div className="wrap">
        <div className="app-header">
          <div className="hdr-info">
            <div className="hdr-name">👤 Profil</div>
            <div className="hdr-hi">Mode invité</div>
          </div>
        </div>
        <div className="guest-banner mt-2">
          <h3>🔒 Connecte-toi pour ta progression</h3>
          <p>
            En mode invité, ton XP, ton niveau et tes badges ne sont pas sauvegardés. Crée un compte
            pour tout garder !
          </p>
          <button type="button" className="btn-signup" onClick={onOpenLogin}>
            Continuer avec Google
          </button>
        </div>
      </div>
    );
  }

  const lv = levelFor(profile.xp || 0);
  const st = profile.stats || { games: 0, correct: 0, answered: 0, best: 0 };
  const taux = st.answered ? Math.round((100 * (st.correct || 0)) / st.answered) : 0;
  const unlockedBadges = profile.badges || [];

  return (
    <div className="wrap">
      <div className="app-header">
        <div className="hdr-info">
          <div className="hdr-name">👤 Mon profil</div>
        </div>
        <button type="button" className="hdr-btn ghost" onClick={onOpenEditProfile}>
          ✏️ Éditer
        </button>
      </div>

      <div className="profile-hero">
        <div className="profile-photo">
          <AvatarDisplay player={profile} size={110} />
        </div>
        <div className="profile-name">{profile.name}</div>
        <div className="profile-email">{profile.email || ''}</div>
        <div className="level-badge">
          <span className="text-xl">{lv.icon}</span> {lv.name}{' '}
          <span className="lvl-num">· Niv. {lv.level}</span>
        </div>
        <div className="flex items-center gap-1.5 text-base font-black text-[#ffd700] mb-3">
          ⭐ {profile.stars || 0} Étoiles
        </div>
        <div className="xp-bar-wrap">
          <div className="xp-bar-labels">
            <span>{profile.xp || 0} XP</span>
            <span>{lv.isMax ? 'MAX' : `${lv.nextMin} XP`}</span>
          </div>
          <div className="xp-bar-track">
            <div
              className="xp-bar-fill"
              style={{ width: `${Math.round(lv.progress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <div className="sv">{st.games || 0}</div>
          <div className="sl">Parties</div>
        </div>
        <div className="stat-box">
          <div className="sv">{taux}%</div>
          <div className="sl">Bonnes rép.</div>
        </div>
        <div className="stat-box">
          <div className="sv">{st.best || 0}</div>
          <div className="sl">Best score</div>
        </div>
      </div>

      {/* Badges & Succès */}
      <div className="sect-title my-6 font-black text-base text-white flex items-center justify-between">
        <span>🏆 Badges & Succès</span>
        <span className="text-sm text-[#ffd700] font-extrabold">
          {unlockedBadges.length} / {BADGES.length}
        </span>
      </div>
      <div className="badges-grid">
        {BADGES.map((b) => {
          const isUnlocked = unlockedBadges.includes(b.id);
          return (
            <div key={b.id} className={`badge-card ${isUnlocked ? 'unlocked' : ''}`}>
              <div className="badge-status">{isUnlocked ? '✅' : '🔒'}</div>
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              <div className="badge-desc">{b.desc}</div>
            </div>
          );
        })}
      </div>

      {profile.isAdmin && (
        <button
          type="button"
          className="btn btn-dark mt-2.5"
          onClick={onOpenAdmin}
        >
          ⚙️ Panneau Admin
        </button>
      )}

      <button
        type="button"
        className="btn btn-secondary mt-2.5"
        onClick={onLogout}
      >
        ⬅ Se déconnecter
      </button>
    </div>
  );
};
