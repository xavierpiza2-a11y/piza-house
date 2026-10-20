#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# 🍕 Piza-House — Script de Première Installation (Ubuntu / Docker)
# Port configuré : 5640
# Persistance des données : ./data/
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "=========================================================="
echo "   🍕 BIENVENUE DANS L'INSTALLATEUR DE PIZA-HOUSE 🍕     "
echo "=========================================================="
echo -e "${NC}"

# 1. Vérification des prérequis système
echo -e "${BLUE}[1/5] Vérification de l'environnement Ubuntu...${NC}"
if ! command -v apt-get &> /dev/null; then
  echo -e "${YELLOW}Attention : Ce script est optimisé pour Ubuntu / Debian. Poursuite...${NC}"
fi

# 2. Vérification / Installation de Docker et Docker Compose
echo -e "${BLUE}[2/5] Vérification de Docker et Docker Compose...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker n'est pas installé. Installation automatique en cours...${NC}"
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg || true
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  echo -e "${GREEN}Docker installé avec succès.${NC}"
else
  echo -e "${GREEN}Docker est déjà présent : $(docker --version)${NC}"
fi

# Vérification compose
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
else
  echo -e "${RED}Erreur : Docker Compose est introuvable. Veuillez l'installer.${NC}"
  exit 1
fi
echo -e "${GREEN}Utilisation de : ${COMPOSE_CMD}${NC}"

# 3. Préparation des répertoires de données persistantes
echo -e "${BLUE}[3/5] Initialisation du stockage persistant local...${NC}"
mkdir -p data data/uploads backups
chmod -R 775 data backups
echo -e "${GREEN}Dossiers persistants 'data/' et 'backups/' prêts.${NC}"

# 4. Fichier d'environnement local
if [ ! -f .env ]; then
  echo -e "${BLUE}[4/5] Création du fichier de configuration .env...${NC}"
  cat <<EOF > .env
PORT=5640
NODE_ENV=production
DATA_DIR=/app/data
ADMIN_EMAIL=xavier.piza2@gmail.com
VITE_ADMIN_EMAIL=xavier.piza2@gmail.com
EOF
  echo -e "${GREEN}Fichier .env généré (Port 5640).${NC}"
else
  echo -e "${GREEN}Fichier .env existant conservé.${NC}"
fi

# 5. Construction et lancement du conteneur Docker
echo -e "${BLUE}[5/5] Construction de l'image Docker et démarrage sur le port 5640...${NC}"
$COMPOSE_CMD up -d --build

# Récupération de l'adresse IP locale / publique
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}       🎉 PIZA-HOUSE EST INSTALLÉ ET OPÉRATIONNEL !       ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo ""
echo -e "Accédez à votre application :"
echo -e "  👉 Local :       ${BLUE}http://localhost:5640${NC}"
echo -e "  👉 Réseau local : ${BLUE}http://${LOCAL_IP}:5640${NC}"
echo ""
echo -e "Commandes utiles :"
echo -e "  • Voir les logs en direct :  ${YELLOW}$COMPOSE_CMD logs -f${NC}"
echo -e "  • Arrêter l'application :     ${YELLOW}$COMPOSE_CMD down${NC}"
echo -e "  • Relancer l'application :   ${YELLOW}$COMPOSE_CMD up -d${NC}"
echo -e "  • Mettre à jour en 1 clic :  ${GREEN}./update.sh${NC}"
echo ""
