import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COLORS, DESIGN_AVATARS, EMOJIS } from '../lib/constants';
import { AuthUser, dbSet, uploadUserPhoto, USERS_REF } from '../lib/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  profile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onProfileUpdated,
}) => {
  if (!isOpen || !user || !profile) return null;

  const [name, setName] = useState(profile.name || '');
  const [color, setColor] = useState(profile.color || '#F5C518');
  const [avatar, setAvatar] = useState(profile.avatar || '🎵');
  const [photo, setPhoto] = useState(profile.customPhoto || profile.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const unlockedAvatars = (profile.unlockedAvatars || []).map((id) => DESIGN_AVATARS[id]).filter(Boolean);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploading(true);
      setErrorMsg('');
      const url = await uploadUserPhoto(user.uid, file);
      setPhoto(url);
    } catch (err: any) {
      setErrorMsg("Erreur lors de l'envoi de la photo : " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleUseGooglePhoto = () => {
    const googlePhoto = user.photoURL || '';
    setPhoto(googlePhoto);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Saisis ton prénom');
      return;
    }
    const customPhoto = photo !== user.photoURL ? photo : '';
    await dbSet(`${USERS_REF}/${user.uid}/name`, trimmed);
    await dbSet(`${USERS_REF}/${user.uid}/color`, color);
    await dbSet(`${USERS_REF}/${user.uid}/avatar`, avatar);
    await dbSet(`${USERS_REF}/${user.uid}/customPhoto`, customPhoto);

    const updated: UserProfile = {
      ...profile,
      name: trimmed,
      color,
      avatar,
      customPhoto,
      photoURL: user.photoURL || '',
    };
    onProfileUpdated(updated);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-title text-center mb-4 font-black text-lg">Mon profil</div>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/40 rounded-xl p-2.5 mb-3 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="relative w-[84px] h-[84px]">
            <img
              src={photo || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%23444"/></svg>'}
              alt=""
              className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-white shadow-lg"
            />
            <label
              htmlFor="upPhotoInput"
              className="absolute bottom-0 right-0 w-7 h-7 bg-[var(--dark)] rounded-full flex items-center justify-center text-sm cursor-pointer border border-white/30"
              title="Changer la photo"
            >
              📷
            </label>
          </div>
        </div>

        <input
          type="file"
          id="upPhotoInput"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
          disabled={uploading}
        />

        <div className="modal-label">Photo</div>
        <div className="flex gap-2 mb-3.5">
          <button
            type="button"
            className="btn btn-secondary btn-sm flex-1"
            onClick={handleUseGooglePhoto}
          >
            🔗 Photo Google
          </button>
          <label
            htmlFor="upPhotoInput"
            className="btn btn-secondary btn-sm flex-1 text-center cursor-pointer mb-0"
          >
            {uploading ? '⏳ Envoi…' : '📤 Importer locale'}
          </label>
        </div>

        <div className="modal-label">Nom affiché</div>
        <input
          className="inp"
          placeholder="Ton prénom"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="modal-label mt-1.5">Avatar 3D Personnalisé</div>
        <div className="grid grid-cols-4 gap-2 mb-3 max-h-44 overflow-y-auto pr-1">
          {Object.values(DESIGN_AVATARS).map((a) => (
            <button
              key={a.id}
              type="button"
              className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                a.id === avatar
                  ? 'border-[#ffd700] bg-yellow-400/20 shadow-lg scale-105'
                  : 'border-white/15 bg-white/5 hover:border-white/40'
              }`}
              onClick={() => setAvatar(a.id)}
              title={a.name}
            >
              {a.image ? (
                <img src={a.image} alt={a.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: a.svg(36) }} />
              )}
              <span className="text-[10px] font-black text-white/90 mt-1 truncate max-w-full">
                {a.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        <div className="modal-label mt-1">Émojis Classiques</div>
        <div className="emoji-grid mb-3">
          {EMOJIS.slice(0, 12).map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-opt ${e === avatar ? 'selected' : ''}`}
              onClick={() => setAvatar(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="modal-label">Couleur</div>
        <div className="color-grid">
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-opt ${c === color ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
