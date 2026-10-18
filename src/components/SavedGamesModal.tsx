import React, { useEffect, useState } from 'react';
import { dbGet, dbRemove, SAVED_REF } from '../lib/firebase';
import { GAMES, fmtDate } from '../lib/constants';
import { SavedGame } from '../types';

interface SavedGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGame: (game: SavedGame) => void;
}

export const SavedGamesModal: React.FC<SavedGamesModalProps> = ({ isOpen, onClose, onLoadGame }) => {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  const loadList = async () => {
    setLoading(true);
    const data = await dbGet<Record<string, SavedGame>>(SAVED_REF);
    if (!data) {
      setGames([]);
    } else {
      setGames(Object.values(data).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette partie ?')) return;
    await dbRemove(`${SAVED_REF}/${id}`);
    loadList();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-title text-center mb-4 font-black text-lg">📂 Parties enregistrées</div>

        {loading ? (
          <div className="text-center py-6">
            <span className="spin-icon">⏳</span>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-white/70 py-6 font-bold">
            Aucune partie enregistrée 😢
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {games.map((g) => {
              const def = GAMES[g.gameType] || GAMES.blindtest;
              return (
                <div key={g.id} className="a-item">
                  <div className="text-2xl">{def.emoji}</div>
                  <div
                    className="a-item-info cursor-pointer"
                    onClick={() => {
                      onLoadGame(g);
                      onClose();
                    }}
                  >
                    <div className="a-item-name">{g.title}</div>
                    <div className="a-item-meta">
                      {def.name} · {g.count} manche{g.count > 1 ? 's' : ''} · {fmtDate(g.savedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleDelete(g.id)}
                    title="Supprimer"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-actions mt-3.5">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
