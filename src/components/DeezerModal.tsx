import React, { useState, useEffect } from 'react';
import { DeezerTrack, searchDeezer } from '../lib/deezer';

interface DeezerModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelectTrack: (track: DeezerTrack) => void;
}

export const DeezerModal: React.FC<DeezerModalProps> = ({
  isOpen,
  initialQuery = '',
  onClose,
  onSelectTrack,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DeezerTrack[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      if (initialQuery.trim()) {
        triggerSearch(initialQuery.trim());
      } else {
        setResults([]);
      }
    }
  }, [isOpen, initialQuery]);

  const triggerSearch = async (q: string) => {
    if (!q) return;
    setLoading(true);
    const tracks = await searchDeezer(q);
    setResults(tracks);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet">
        <div className="modal-header">
          <span className="modal-title">🔍 Recherche Deezer</span>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-search-row">
          <input
            className="inp"
            placeholder="Artiste ou titre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') triggerSearch(query.trim());
            }}
          />
          <button
            type="button"
            className="btn-deezer"
            onClick={() => triggerSearch(query.trim())}
          >
            🔍
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="text-center py-8">
              <span className="spin-icon">⏳</span>
              <p className="text-white/70 text-sm mt-2 font-bold">Recherche…</p>
            </div>
          ) : results.length > 0 ? (
            results.map((tk) => (
              <div key={tk.id} className="search-result">
                <img
                  className="search-cover"
                  src={tk.album?.cover_small || ''}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="search-info">
                  <div className="search-title">{tk.title_short || tk.title}</div>
                  <div className="search-artist">{tk.artist?.name || ''}</div>
                </div>
                <button
                  type="button"
                  className="search-pick"
                  onClick={() => {
                    onSelectTrack(tk);
                    onClose();
                  }}
                >
                  Choisir
                </button>
              </div>
            ))
          ) : (
            <div className="search-empty">
              {query ? 'Aucun résultat 😕' : 'Tape un artiste ou un titre 🎵'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
