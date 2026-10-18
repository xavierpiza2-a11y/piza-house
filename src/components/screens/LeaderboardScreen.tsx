import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../types';
import { dbGet, USERS_REF } from '../../lib/firebase';
import { levelFor, MEDALS } from '../../lib/constants';
import { AvatarDisplay } from '../AvatarDisplay';

interface LeaderboardScreenProps {
  currentUid?: string;
  onOpenLogin: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ currentUid, onOpenLogin }) => {
  const [list, setList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const users = await dbGet<Record<string, UserProfile>>(USERS_REF);
        if (users) {
          const sorted = Object.values(users)
            .map((u) => ({ ...u, xp: u.xp || 0 }))
            .sort((a, b) => (b.xp || 0) - (a.xp || 0))
            .slice(0, 10);
          setList(sorted);
        } else {
          setList([]);
        }
      } catch (e) {
        if (!currentUid) {
          setIsRestricted(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [currentUid]);

  return (
    <div className="wrap">
      <div className="app-header">
        <div className="hdr-info">
          <div className="hdr-name">📊 Classement</div>
          <div className="hdr-hi">Top joueurs par XP</div>
        </div>
      </div>

      {loading ? (
        <div className="spin-load">
          <span className="spin-icon">⏳</span>
        </div>
      ) : isRestricted ? (
        <div className="placeholder">
          <div className="ph-icon">🔒</div>
          <h3>Classement réservé aux membres</h3>
          <p>Connecte-toi pour découvrir le top des joueurs et y figurer avec ton XP !</p>
          <button
            type="button"
            className="btn btn-primary max-w-[280px] mt-4"
            onClick={onOpenLogin}
          >
            Se connecter avec Google
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="placeholder">
          <div className="ph-icon">📊</div>
          <h3>Classement vide</h3>
          <p>Sois le premier à jouer une partie connecté !</p>
        </div>
      ) : (
        <div>
          {list.map((u, i) => {
            const lv = levelFor(u.xp || 0);
            const isMe = u.uid === currentUid;
            return (
              <div key={u.uid} className={`rank-row ${isMe ? 'me' : ''}`}>
                <div className="rank-pos">{MEDALS[i] || i + 1}</div>
                <div className="rank-avatar">
                  <AvatarDisplay player={u} size={40} />
                </div>
                <div className="rank-info">
                  <div className="rank-name">{u.name}</div>
                  <div className="rank-lvl">
                    {lv.icon} {lv.name}
                  </div>
                </div>
                <div className="rank-xp">{u.xp} XP</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
