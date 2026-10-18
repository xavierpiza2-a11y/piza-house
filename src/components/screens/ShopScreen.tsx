import React from 'react';
import { UserProfile } from '../../types';
import { DESIGN_AVATARS, SHOP_THEMES } from '../../lib/constants';

interface ShopScreenProps {
  profile: UserProfile | null;
  onOpenLogin: () => void;
  onBuyItem: (type: 'theme' | 'avatar', id: string) => Promise<void>;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ profile, onOpenLogin, onBuyItem }) => {
  if (!profile) {
    return (
      <div className="wrap">
        <div className="app-header">
          <div className="hdr-info">
            <div className="hdr-name">🛒 Boutique</div>
            <div className="hdr-hi">Débloque thèmes & avatars</div>
          </div>
        </div>
        <div className="guest-banner mt-2">
          <h3>🔒 Connecte-toi pour accéder à la boutique</h3>
          <p>
            Gagne des ⭐ étoiles en jouant rapidement et en faisant des séries pour débloquer des
            thèmes animés et des avatars exclusifs !
          </p>
          <button type="button" className="btn-signup" onClick={onOpenLogin}>
            Continuer avec Google
          </button>
        </div>
      </div>
    );
  }

  const stars = profile.stars || 0;
  const equippedTheme = profile.equippedTheme || 'original';
  const unlockedThemes = profile.unlockedThemes || ['original'];
  const currentAvatar = profile.avatar || '🎵';
  const unlockedAvatars = profile.unlockedAvatars || [];

  return (
    <div className="wrap">
      <div className="app-header">
        <div className="hdr-info">
          <div className="hdr-name">🛒 Boutique</div>
          <div className="hdr-hi">Thèmes animés & Avatars VIP</div>
        </div>
        <div className="stars-badge">⭐ {stars}</div>
      </div>

      <div className="shop-header-card">
        <div>
          <div className="font-black text-sm text-white">Comment gagner des ⭐ ?</div>
          <div className="text-xs text-white/70 mt-1 leading-relaxed">
            Réponses sous 3s (+3⭐) · Séries de 3, 5, 10 (+8 à +40⭐) · Podium (+10 à +30⭐)
          </div>
        </div>
      </div>

      {/* Thèmes animés */}
      <div className="sect-title my-4 font-black text-base text-white">
        🎨 Thèmes de Salle Animés
      </div>
      <div className="shop-grid">
        {SHOP_THEMES.map((t) => {
          const isUnlocked = unlockedThemes.includes(t.id);
          const isEquipped = equippedTheme === t.id;
          return (
            <div key={t.id} className={`shop-card ${isEquipped ? 'equipped' : ''}`}>
              <div className="shop-preview" style={{ background: t.previewColor }}>
                🎨
              </div>
              <div className="shop-info">
                <div className="shop-title">
                  {t.name} <span className="shop-tag">{t.tag}</span>
                </div>
                <div className="shop-desc">{t.desc}</div>
              </div>
              {isEquipped ? (
                <button type="button" className="shop-btn equipped">
                  ✅ Équipé
                </button>
              ) : isUnlocked ? (
                <button
                  type="button"
                  className="shop-btn activate"
                  onClick={() => onBuyItem('theme', t.id)}
                >
                  Activer
                </button>
              ) : (
                <button
                  type="button"
                  className={`shop-btn buy ${stars < t.price ? 'locked' : ''}`}
                  onClick={() => onBuyItem('theme', t.id)}
                >
                  ⭐ {t.price}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Avatars VIP */}
      <div className="sect-title my-4 font-black text-base text-white">
        🎭 Avatars Stylisés VIP
      </div>
      <div className="shop-grid">
        {Object.values(DESIGN_AVATARS).map((a) => {
          const isUnlocked = unlockedAvatars.includes(a.id);
          const isEquipped = currentAvatar === a.id;
          return (
            <div key={a.id} className={`shop-card ${isEquipped ? 'equipped' : ''}`}>
              <div className="shop-preview">
                {a.image ? (
                  <img
                    src={a.image}
                    alt={a.name}
                    className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-white/20"
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: a.svg(42) }} />
                )}
              </div>
              <div className="shop-info">
                <div className="shop-title">{a.name}</div>
                <div className="shop-desc">{a.desc}</div>
              </div>
              {isEquipped ? (
                <button type="button" className="shop-btn equipped">
                  ✅ Équipé
                </button>
              ) : isUnlocked ? (
                <button
                  type="button"
                  className="shop-btn activate"
                  onClick={() => onBuyItem('avatar', a.id)}
                >
                  Porter
                </button>
              ) : (
                <button
                  type="button"
                  className={`shop-btn buy ${stars < a.price ? 'locked' : ''}`}
                  onClick={() => onBuyItem('avatar', a.id)}
                >
                  ⭐ {a.price}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
