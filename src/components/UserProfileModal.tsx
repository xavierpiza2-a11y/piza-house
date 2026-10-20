import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COLORS, DESIGN_AVATARS } from '../lib/constants';
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
  const [avatar, setAvatar] = useState(profile.avatar || 'avatar_rockstar');
  const [photo, setPhoto] = useState(profile.customPhoto || profile.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Saisis ton prénom');
      return;
    }
    const customPhoto = photo;
    await dbSet(`${USERS_REF}/${user.uid}/name`, trimmed);
    await dbSet(`${USERS_REF}/${user.uid}/color`, color);
    await dbSet(`${USERS_REF}/${user.uid}/avatar`, avatar);
    await dbSet(`${USERS_REF}/${user.uid}/customPhoto`, customPhoto);

    onProfileUpdated({
      ...profile,
      name: trimmed,
      color,
      avatar,
      customPhoto,
    });
    onClose();
  };

  const activeAvatarObj = DESIGN_AVATARS[avatar];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box max-w-sm">
        <div className="modal-title mb-3">Modifier mon profil</div>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/40 rounded-xl p-2.5 mb-3 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex flex-col items-center mb-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#ffd700] shadow-lg flex items-center justify-center bg-black/40 mb-2 relative"
            style={{ borderColor: color }}
          >
            {photo ? (
              <img src={photo} alt="" className="w-full h-full object-cover" />
            ) : activeAvatarObj && activeAvatarObj.image ? (
              <img src={activeAvatarObj.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>

          <input
            type="file"
            id="upPhotoInput"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <label
            htmlFor="upPhotoInput"
            className="btn btn-secondary btn-sm text-center cursor-pointer mb-0"
          >
            {uploading ? '⏳ Envoi…' : '📤 Importer une photo personnalisée'}
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

        <div className="modal-label mt-2">Avatar 3D Officiel</div>
        <div className="grid grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
          {Object.values(DESIGN_AVATARS).map((a) => (
            <button
              key={a.id}
              type="button"
              className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                a.id === avatar
                  ? 'border-[#ffd700] bg-yellow-400/20 shadow-lg scale-105'
                  : 'border-white/15 bg-white/5 hover:border-white/40'
              }`}
              onClick={() => {
                setAvatar(a.id);
                setPhoto(''); // Clear photo so avatar displays
              }}
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

        <div className="modal-label">Couleur de halo</div>
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
