import React from 'react';

export type TabType = 'home' | 'leaderboard' | 'friends' | 'shop' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isVisible: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab, isVisible }) => {
  if (!isVisible) return null;

  return (
    <nav className="bottom-nav visible">
      <button
        type="button"
        className={`nav-tab ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => onChangeTab('home')}
      >
        <span className="ico">🏠</span>
        <span>Accueil</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'leaderboard' ? 'active' : ''}`}
        onClick={() => onChangeTab('leaderboard')}
      >
        <span className="ico">📊</span>
        <span>Classement</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'friends' ? 'active' : ''}`}
        onClick={() => onChangeTab('friends')}
      >
        <span className="ico">👥</span>
        <span>Amis</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'shop' ? 'active' : ''}`}
        onClick={() => onChangeTab('shop')}
      >
        <span className="ico">🛒</span>
        <span>Boutique</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${currentTab === 'profile' ? 'active' : ''}`}
        onClick={() => onChangeTab('profile')}
      >
        <span className="ico">👤</span>
        <span>Profil</span>
      </button>
    </nav>
  );
};
