# 🍕 Piza-House

Application web React full-stack (Express + Vite + TypeScript + Tailwind CSS) de soirées jeux en famille et entre amis : Blind Test musical, Quiz de Culture Générale généré par IA, et 4 Modes Arcade chrono avec multijoueur en temps réel.

> **Sans Firebase** : Stockage 100% autonome et local sous forme de fichiers `.json` dans `data/`, diffusion temps réel en Server-Sent Events (SSE) native, authentification Google Identity Services (GIS), conteneurisation Docker sur **port 2601** et refonte visuelle cartoon 3D.

---

## 🌟 Points Forts & Refonte

- **📁 Base de données Locale JSON (`data/`)** :
  - `data/users.json` : Profils joueurs, XP, étoiles, badges et avatars débloqués.
  - `data/rooms.json` : Salons actifs, questions, réponses atomiques et scores.
  - `data/saved.json` : Quiz et blind tests sauvegardés.
  - `data/config.json` : Durée des manches, interludes et prompts de Xav.
  - `data/uploads/` : Photos de profil téléversées localement.
- **⚡ Moteur Temps Réel Server-Sent Events (SSE)** :
  - Latence zéro sans service tiers externe.
  - Reconnexion automatique et synchronisation de salon fluide.
- **🔑 Connexion Compte Google** :
  - Intégration Google Identity Services (GIS) avec validation serveur et session locale.
  - Mode invité préservé pour les parties instantanées sans compte.
- **🎨 Refonte Graphique Cartoon 3D & Prestige Doré** :
  - Illustrations 3D haute définition pour les 4 modes arcade (Chrono Éclair, Mort Subite, L'Intrus, Combo Blitz).
  - Trophée d'or 3D avec reflets brillants pour le podium final.
  - Avatars cartoon 3D (Cat DJ, Pizza Chef) aux côtés des avatars VIP vectoriels.
  - Logos officiels Piza-House scrupuleusement conservés.
- **🐳 Déploiement Docker sur Ubuntu (Port 2601)** :
  - Port dédié **2601**.
  - Volume persistant `./data:/app/data` protégeant les données contre toute réinitialisation.
  - Scripts d'installation et de mise à jour automatique en une seule commande.

---

## 🚀 Déploiement Rapide sur Ubuntu / Debian

### 1. Première installation (en 1 seule commande)

```bash
chmod +x install.sh
./install.sh
```

Le script installe automatiquement Docker et Docker Compose si nécessaire, configure les dossiers persistants `data/`, et lance le conteneur en arrière-plan sur le **port 2601**.

Accédez ensuite à l'application via :
`http://<votre-ip>:2601` ou `http://localhost:2601`

---

### 2. Mise à jour automatique depuis GitHub (en 1 seule commande)

```bash
./update.sh
```

Ce script effectue automatiquement :
1. **Sauvegarde de sécurité immédiate** de tout le dossier `data/` dans `backups/data_backup_YYYYMMDD_HHMMSS.tar.gz`.
2. Récupération des dernières modifications depuis GitHub (`git pull`) **sans toucher ni écraser les données locales**.
3. Recompilation et redémarrage fluide du conteneur Docker.

---

## 🛠️ Stack Technique

- **Serveur & API** : Express 5, Node.js 22, Server-Sent Events (SSE), Multer
- **Frontend** : React 18, TypeScript, Tailwind CSS, Vite
- **Stockage** : Fichiers JSON thread-safe avec écritures atomiques (fichiers temporaires + renommage)
- **Authentification** : Google Identity Services (GIS)
- **Audio & Musique** : Web Audio API synthétiseur & Proxy sécurisé Deezer Music API
- **Conteneurisation** : Docker, Docker Compose, Port 2601, Volume persistant `./data:/app/data`
