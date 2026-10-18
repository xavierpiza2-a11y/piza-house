import React from 'react';

export const FriendsScreen: React.FC = () => {
  return (
    <div className="wrap">
      <div className="app-header">
        <div className="hdr-info">
          <div className="hdr-name">👥 Amis</div>
          <div className="hdr-hi">Ta bande de la Piza-House</div>
        </div>
      </div>
      <div className="placeholder">
        <div className="ph-icon">👥</div>
        <h3>Bientôt disponible</h3>
        <p>Ajoute tes amis, compare vos niveaux et défiez-vous sur vos jeux préférés.</p>
      </div>
    </div>
  );
};
