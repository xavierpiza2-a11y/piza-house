import React, { useState } from 'react';
import { loginWithEmail } from '../lib/api';
import { DESIGN_AVATARS } from '../lib/constants';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('avatar_rockstar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await loginWithEmail(email.trim(), name.trim(), avatar);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box text-center max-w-sm">
        <div className="text-3xl mb-1">🍕</div>
        <div className="modal-title font-black text-xl mb-1">
          {isRegister ? 'Créer un Compte Piza-House' : 'Connexion Joueur'}
        </div>
        <p className="text-xs text-white/70 mb-4">
          Progression, statistiques, étoiles et avatars 3D sauvegardés localement.
        </p>

        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/40 rounded-xl p-2.5 mb-3 text-xs font-bold text-left">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-left space-y-3">
          <div>
            <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              className="inp"
              placeholder="ex: joueur@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-1">
              Prénom ou Pseudo {isRegister ? '' : '(optionnel)'}
            </label>
            <input
              type="text"
              className="inp"
              placeholder="ex: Sophie, Alex…"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-1">
                Choisis ton Avatar 3D
              </label>
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {Object.values(DESIGN_AVATARS).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`flex flex-col items-center p-1 rounded-xl border transition-all ${
                      avatar === a.id
                        ? 'border-[#ffd700] bg-yellow-400/20 shadow-md scale-105'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                    onClick={() => setAvatar(a.id)}
                  >
                    {a.image ? (
                      <img src={a.image} alt={a.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: a.svg(32) }} />
                    )}
                    <span className="text-[9px] text-white/90 truncate max-w-full mt-0.5">
                      {a.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-sm font-black justify-center"
              disabled={loading}
            >
              {loading
                ? '⏳ Connexion en cours…'
                : isRegister
                ? '🚀 Créer mon compte'
                : '🔑 Se connecter'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/60">
            {isRegister ? 'Déjà un compte ?' : 'Nouveau joueur ?'}
          </span>
          <button
            type="button"
            className="text-[#ffd700] font-bold hover:underline"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Se connecter' : 'Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
};
