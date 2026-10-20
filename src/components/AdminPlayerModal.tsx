import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { BADGES, DESIGN_AVATARS, levelFor } from '../lib/constants';
import { AvatarDisplay } from './AvatarDisplay';

interface AdminPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: UserProfile | null;
  onSave: (updated: UserProfile) => Promise<void>;
}

export const AdminPlayerModal: React.FC<AdminPlayerModalProps> = ({ isOpen, onClose, player, onSave }) => {
  if (!isOpen || !player) return null;

  const [editData, setEditData] = useState<UserProfile>({ ...player });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (player) {
      setEditData({
        ...player,
        xp: player.xp || 0,
        stars: player.stars || 0,
        unlockedAvatars: Array.isArray(player.unlockedAvatars) ? [...player.unlockedAvatars] : [],
        badges: Array.isArray(player.badges) ? [...player.badges] : [],
      });
    }
  }, [player]);

  const lvl = levelFor(editData.xp);

  const addXp = (amount: number) => {
    setEditData((prev) => ({ ...prev, xp: Math.max(0, (prev.xp || 0) + amount) }));
  };

  const addStars = (amount: number) => {
    setEditData((prev) => ({ ...prev, stars: Math.max(0, (prev.stars || 0) + amount) }));
  };

  const toggleAvatar = (avId: string) => {
    setEditData((prev) => {
      const avatars = prev.unlockedAvatars || [];
      const exists = avatars.includes(avId);
      return {
        ...prev,
        unlockedAvatars: exists ? avatars.filter((a) => a !== avId) : [...avatars, avId],
      };
    });
  };

  const setAllAvatars = (unlockAll: boolean) => {
    setEditData((prev) => ({
      ...prev,
      unlockedAvatars: unlockAll ? Object.keys(DESIGN_AVATARS) : [],
    }));
  };

  const toggleBadge = (badgeId: string) => {
    setEditData((prev) => {
      const badges = prev.badges || [];
      const exists = badges.includes(badgeId);
      return {
        ...prev,
        badges: exists ? badges.filter((b) => b !== badgeId) : [...badges, badgeId],
      };
    });
  };

  const setAllBadges = (unlockAll: boolean) => {
    setEditData((prev) => ({
      ...prev,
      badges: unlockAll ? BADGES.map((b) => b.id) : [],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(editData);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box max-w-[500px] max-h-[88vh] overflow-y-auto p-5">
        <div className="modal-title text-center mb-3.5 text-lg font-black">⚙️ Modifier le joueur</div>

        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/20">
            <AvatarDisplay player={editData} size={48} />
          </div>
          <div>
            <div className="font-black text-base text-white">{editData.name}</div>
            <div className="text-xs text-white/70">{editData.email}</div>
            <div className="text-xs text-[#ffd700] font-extrabold mt-0.5">
              {lvl.icon} {lvl.name} (Niveau {lvl.level})
            </div>
          </div>
        </div>

        {/* XP & Stars */}
        <div className="admin-section mb-3.5">
          <div className="admin-section-title">✨ Points d'XP & Stars ⭐</div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div>
              <label className="text-[11px] text-white/70 font-extrabold block mb-1">XP Total</label>
              <input
                type="number"
                className="inp mb-1.5"
                value={editData.xp}
                onChange={(e) =>
                  setEditData({ ...editData, xp: parseInt(e.target.value, 10) || 0 })
                }
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn-sm btn-ghost p-1 text-[11px] flex-1"
                  onClick={() => addXp(100)}
                >
                  +100
                </button>
                <button
                  type="button"
                  className="btn-sm btn-ghost p-1 text-[11px] flex-1"
                  onClick={() => addXp(500)}
                >
                  +500
                </button>
                <button
                  type="button"
                  className="btn-sm btn-ghost p-1 text-[11px] flex-1"
                  onClick={() => addXp(2000)}
                >
                  +2k
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/70 font-extrabold block mb-1">Étoiles ⭐</label>
              <input
                type="number"
                className="inp mb-1.5"
                value={editData.stars || 0}
                onChange={(e) =>
                  setEditData({ ...editData, stars: parseInt(e.target.value, 10) || 0 })
                }
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn-sm btn-ghost p-1 text-[11px] flex-1"
                  onClick={() => addStars(50)}
                >
                  +50
                </button>
                <button
                  type="button"
                  className="btn-sm btn-ghost p-1 text-[11px] flex-1"
                  onClick={() => addStars(100)}
                >
                  +100
                </button>
                <button
                  type="button"
                  className="btn-sm btn-ghost p-1 text-[11px] flex-1"
                  onClick={() => addStars(500)}
                >
                  +500
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Avatars */}
        <div className="admin-section mb-3.5">
          <div className="flex justify-between items-center mb-2">
            <div className="admin-section-title mb-0">
              🎭 Avatars Stylisés VIP ({(editData.unlockedAvatars || []).length}/
              {Object.keys(DESIGN_AVATARS).length})
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="btn-sm btn-ghost text-[10px] py-1 px-1.5"
                onClick={() => setAllAvatars(true)}
              >
                Tout 🔓
              </button>
              <button
                type="button"
                className="btn-sm btn-ghost text-[10px] py-1 px-1.5"
                onClick={() => setAllAvatars(false)}
              >
                Reset 🔒
              </button>
            </div>
          </div>
          <div className="max-h-[150px] overflow-y-auto pr-1">
            {Object.values(DESIGN_AVATARS).map((a) => {
              const isUnlocked = (editData.unlockedAvatars || []).includes(a.id);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-xl mb-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: a.svg(24) }}
                    />
                    <div className="text-[13px] font-bold">{a.name}</div>
                  </div>
                  <button
                    type="button"
                    className={`btn-sm ${isUnlocked ? 'btn-danger' : 'btn-primary'} py-1 px-2.5 text-[11px]`}
                    onClick={() => toggleAvatar(a.id)}
                  >
                    {isUnlocked ? '❌ Retirer' : '➕ Débloquer'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        <div className="admin-section mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="admin-section-title mb-0">
              🏆 Succès & Badges ({(editData.badges || []).length}/{BADGES.length})
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="btn-sm btn-ghost text-[10px] py-1 px-1.5"
                onClick={() => setAllBadges(true)}
              >
                Tout 🔓
              </button>
              <button
                type="button"
                className="btn-sm btn-ghost text-[10px] py-1 px-1.5"
                onClick={() => setAllBadges(false)}
              >
                Reset 🔒
              </button>
            </div>
          </div>
          <div className="max-h-[180px] overflow-y-auto pr-1">
            {BADGES.map((b) => {
              const isUnlocked = (editData.badges || []).includes(b.id);
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-1.5 bg-white/5 rounded-xl mb-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.icon}</span>
                    <div>
                      <div className="text-xs font-extrabold text-white">{b.name}</div>
                      <div className="text-[10px] text-white/70">{b.desc}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn-sm ${isUnlocked ? 'btn-danger' : 'btn-primary'} py-1 px-2.5 text-[11px] shrink-0`}
                    onClick={() => toggleBadge(b.id)}
                  >
                    {isUnlocked ? '❌ Retirer' : '➕ Débloquer'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};
