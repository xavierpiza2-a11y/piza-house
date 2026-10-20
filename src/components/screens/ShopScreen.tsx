import React from 'react';
import { UserProfile } from '../../types';
import { DESIGN_AVATARS } from '../../lib/constants';

interface ShopScreenProps {
  profile: UserProfile | null;
  onOpenLogin: () => void;
  onBuyAvatar: (id: string) => Promise<void>;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ profile, onOpenLogin, onBuyAvatar }) => {
  if (!profile) {
    return (
      <div className="wrap">
        <div className="app-header">
          <div className="hdr-info">
            <div className="hdr-name">🛍️ Boutique Avatars 3D</div>
            <div className="hdr-hi">Débloque des héros exclusifs</div>
          </div>
        </div>
        <div className="guest-banner mt-2">
          <h3>🔒 Connecte-toi pour accéder à la boutique</h3>
          <p>
            Gagne des ⭐ étoiles en répondant rapidement et en alignant les bonnes réponses pour
            collectionner tous les avatars 3D officiels de la Piza-House !
          </p>
          <button type="button" className="btn-signup" onClick={onOpenLogin}>
            ✨ Créer un compte ou se connecter
          </button>
        </div>
      </div>
    );
  }

  const stars = profile.stars || 0;
  const currentAvatar = profile.avatar || 'avatar_rockstar';
  const unlockedAvatars = profile.unlockedAvatars || ['avatar_rockstar'];

  return (
    <div className="wrap">
      <div className="app-header">
        <div className="hdr-info">
          <div className="hdr-name">🛍️ Boutique d'Avatars 3D</div>
          <div className="hdr-hi">Personnages et Mascottes Officielles</div>
        </div>
        <div className="stars-badge">⭐ {stars}</div>
      </div>

      <div className="shop-header-card">
        <div>
          <div className="font-black text-sm text-white">Comment gagner des ⭐ étoiles ?</div>
          <div className="text-xs text-white/70 mt-1 leading-relaxed">
            Réponses en moins de 3s (+3⭐) · Séries de 3, 5, 10 (+8 à +40⭐) · Podiums (+10 à +30⭐)
          </div>
        </div>
      </div>

      {/* Collection Avatars 3D */}
      <div className="sect-title my-4 font-black text-base text-white">
        🎭 Collection d'Avatars 3D ({unlockedAvatars.length}/{Object.keys(DESIGN_AVATARS).length})
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
                  onClick={() => onBuyAvatar(a.id)}
                >
                  Porter
                </button>
              ) : (
                <button
                  type="button"
                  className={`shop-btn buy ${stars < a.price ? 'locked' : ''}`}
                  onClick={() => onBuyAvatar(a.id)}
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
