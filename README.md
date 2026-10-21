# 🍕 Piza-House

Application web React full-stack (Express + Vite + TypeScript + Tailwind CSS) de soirées jeux en famille et entre amis : Blind Test musical, Quiz de Culture Générale généré par IA, et 4 Modes Arcade chrono avec multijoueur en temps réel.

> **100% Autonome** : Stockage local sous forme de fichiers `.json` dans `data/`, diffusion temps réel en Server-Sent Events (SSE) native, authentification interne par email (sans service tiers externe), conteneurisation Docker sur **port 5640** et graphismes cartoon 3D.

---

## 🌟 Points Forts

- **📁 Base de données Locale JSON (`data/`)** :
  - `data/users.json` : Profils joueurs, XP, étoiles, badges et avatars débloqués.
  - `data/rooms.json` : Salons actifs, questions, réponses atomiques et scores.
  - `data/saved.json` : Quiz et blind tests sauvegardés.
  - `data/config.json` : Durée des manches, interludes et prompts de Xav.
  - `data/uploads/` : Photos de profil téléversées localement.
- **⚡ Moteur Temps Réel Server-Sent Events (SSE)** :
  - Latence zéro sans dépendance externe.
  - Reconnexion automatique et synchronisation de salon fluide.
- **🔑 Authentification Interne Sécurisée** :
  - Connexion & inscription directes avec n'importe quel email.
  - Mode invité préservé pour les parties instantanées sans compte.
  - Mode administration réservé strictement à l'email configuré dans le `.env`.
- **🎨 Refonte Graphique Cartoon 3D & Prestige Doré** :
  - Illustrations 3D haute définition pour les 4 modes arcade (Chrono Éclair, Mort Subite, L'Intrus, Combo Blitz).
  - Trophée d'or 3D avec reflets brillants pour le podium final.
  - Boutique d'avatars 3D exclusifs déblocables avec les étoiles.
  - Icônes de navigation 3D coordonnées.
- **🐳 Déploiement Docker sur Ubuntu (Port 5640)** :
  - Port dédié **5640**.
  - Volume persistant `./data:/app/data` protégeant les données contre toute réinitialisation.
  - Scripts d'installation et de mise à jour automatique en une seule commande.

---

## 🚀 Déploiement Rapide sur Ubuntu / Debian

### 1. Première installation (en 1 seule commande)

```bash
chmod +x install.sh
./install.sh
```

Le script installe automatiquement Docker et Docker Compose si nécessaire, configure les dossiers persistants `data/`, et lance le conteneur en arrière-plan sur le **port 5640**.

Accédez ensuite à l'application via :
`http://<votre-ip>:5640` ou `http://localhost:5640`

---

### 2. Mise à jour automatique depuis GitHub (en 1 seule commande)

```bash
./update.sh
```

Ce script effectue automatiquement :
1. **Sauvegarde de sécurité immédiate** de tout le dossier `data/` dans `backups/data_backup_YYYYMMDD_HHMMSS.tar.gz`.
2. Récupération et synchronisation des dernières modifications depuis GitHub sans toucher à vos données ni à votre `.env`.
3. Recompilation et redémarrage fluide du conteneur Docker.

---

## 🛠️ Stack Technique

- **Serveur & Runtime** : Bun 1.x (ultra-rapide, exécution native TypeScript), Express 5, Server-Sent Events (SSE), Multer
- **Frontend** : React 18, TypeScript, Tailwind CSS, Vite
- **Stockage** : Fichiers JSON thread-safe avec écritures atomiques (fichiers temporaires + renommage)
- **Authentification** : Gestion interne native par email
- **Audio & Musique** : Web Audio API synthétiseur & Proxy sécurisé Deezer Music API
- **Conteneurisation** : Docker (Image officielle Bun `oven/bun:1-alpine`), Docker Compose, Port 5640, Volume persistant `./data:/app/data`
