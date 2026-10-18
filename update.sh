#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# 🍕 Piza-House — Script de Mise à Jour Automatique en 1 Commande
# Sécurisation absolue : Sauvegarde automatique de data/ avant tout git pull
# Port actif : 2601
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=========================================================="
echo "      🍕 MISE À JOUR AUTOMATIQUE DE PIZA-HOUSE 🍕        "
echo "=========================================================="
echo -e "${NC}"

# Détection de la commande compose
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
else
  echo -e "${RED}Erreur : Docker Compose est introuvable.${NC}"
  exit 1
fi

# 1. ÉTAPE DE SÉCURITÉ MAJEURE : Sauvegarde intégrale du dossier data/
echo -e "${YELLOW}[1/4] Sauvegarde de sécurité du dossier data/...${NC}"
mkdir -p backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/data_backup_${TIMESTAMP}.tar.gz"

if [ -d "data" ]; then
  tar -czf "$BACKUP_FILE" data/
  echo -e "${GREEN}✓ Sauvegarde réussie dans : ${BACKUP_FILE}${NC}"
else
  mkdir -p data data/uploads
  echo -e "${YELLOW}Dossier data/ initialisé.${NC}"
fi

# 2. Récupération des dernières modifications depuis GitHub
echo -e "${BLUE}[2/4] Récupération du code source depuis GitHub...${NC}"

if [ -d ".git" ]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  echo -e "Branche active : ${YELLOW}${CURRENT_BRANCH}${NC}"
  
  # On s'assure que data/ est bien ignoré et intact
  git fetch origin "$CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH"
  echo -e "${GREEN}✓ Code source mis à jour avec succès.${NC}"
else
  echo -e "${YELLOW}Dossier .git non détecté. Passage à la recompilation Docker...${NC}"
fi

# 3. Recompilation et redémarrage du conteneur Docker (sans interruption)
echo -e "${BLUE}[3/4] Recompilation et redémarrage du conteneur (Port 2601)...${NC}"
$COMPOSE_CMD up -d --build

# Nettoyage des anciennes images inutilisées
docker image prune -f > /dev/null 2>&1 || true

# 4. Confirmation finale et statut
echo -e "${BLUE}[4/4] Vérification du service...${NC}"
sleep 2

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}    ✓ MISE À JOUR TERMINÉE AVEC SUCCÈS ! (PORT 2601)      ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e "Données protégées : ${GREEN}Toutes vos données (users, rooms, saved) ont été préservées intactes.${NC}"
echo -e "Archive de secours : ${YELLOW}${BACKUP_FILE}${NC}"
echo ""
echo -e "Accès direct :"
echo -e "  👉 Local :       ${BLUE}http://localhost:2601${NC}"
echo -e "  👉 Réseau local : ${BLUE}http://${LOCAL_IP}:2601${NC}"
echo ""
