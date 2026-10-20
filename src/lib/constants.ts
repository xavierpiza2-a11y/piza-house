import { Badge, DesignAvatar, GameDefinition, GameType, LevelInfo, Room } from '../types';
import {
  avatarCatDjImg,
  avatarCatRockstarImg,
  avatarChillPandaImg,
  avatarFireDragonImg,
  avatarGamerFoxImg,
  avatarGoldMicImg,
  avatarLionKingImg,
  avatarPartyDinoImg,
  avatarPizzaChefImg,
  avatarSpaceAstroImg,
  avatarXavRobotImg,
} from '../assets/images';

export const ANSWER_TIME = 20;
export const CIRC = 2 * Math.PI * 22;

export const EMOJIS = ['🎵','🎸','🎹','🎺','🥁','🎤','🎧','🌟','🔥','💫','👑','🚀','😎','🎯','🍕','🎲','🎮'];
export const COLORS = ['#F5C518','#2ABFBF','#ec4899','#8b5cf6','#10b981','#3b82f6','#ef4444','#06b6d4','#a855f7','#f59e0b'];
export const MEDALS = ['🥇','🥈','🥉'];
export const FUNNY_EMOJIS = ['🤣','😭','🎯','🔥','💀','🤯','👻','🎸','🎺','🦜','🐸','🤦','😤','🥴'];

export const GAMES: Record<GameType, GameDefinition> = {
  blindtest: { id: 'blindtest', name: 'Blind Test', emoji: '🎤', hostPlays: false, timer: 20 },
  quiz: { id: 'quiz', name: 'Quiz Culture G.', emoji: '💡', hostPlays: true, timer: 20 },
  speed: { id: 'speed', name: 'Chrono Éclair', emoji: '⚡', hostPlays: true, timer: 5, tag: '⚡ SPEED' },
  survie: { id: 'survie', name: 'Mort Subite', emoji: '🔥', hostPlays: true, timer: 15, tag: '🔥 SURVIE' },
  intrus: { id: 'intrus', name: "L'Intrus", emoji: '🎭', hostPlays: true, timer: 20, tag: '🎭 PIÈGE' },
  blitz: { id: 'blitz', name: 'Combo Blitz', emoji: '💥', hostPlays: true, timer: 12, tag: '💥 BLITZ' },
};

export const LEVEL_TITLES = [
  { lvl: 1, name: 'Recrue', icon: '🐣' },
  { lvl: 2, name: 'Débutant', icon: '🎵' },
  { lvl: 3, name: 'Amateur', icon: '🎧' },
  { lvl: 4, name: 'Challenger', icon: '🎮' },
  { lvl: 5, name: 'Mélomane', icon: '🎶' },
  { lvl: 6, name: 'Initié', icon: '⭐' },
  { lvl: 7, name: 'Régulier', icon: '🎯' },
  { lvl: 8, name: 'Connaisseur', icon: '📻' },
  { lvl: 9, name: 'Virtuose', icon: '🎻' },
  { lvl: 10, name: 'As du Blind Test', icon: '🎤' },
  { lvl: 12, name: 'Mélomane Averti', icon: '🎷' },
  { lvl: 15, name: 'Maître des Salles', icon: '👑' },
  { lvl: 18, name: 'Génie de la Pop', icon: '⚡' },
  { lvl: 20, name: 'Légende Piza-House', icon: '💎' },
  { lvl: 25, name: 'Phenom Musical', icon: '🔥' },
  { lvl: 30, name: 'Empereur du Quiz', icon: '🌟' },
  { lvl: 35, name: 'Oracle des Tubes', icon: '🔮' },
  { lvl: 40, name: 'Dieu du Rythme', icon: '🔱' },
  { lvl: 45, name: 'Titan de la Musique', icon: '🌌' },
  { lvl: 50, name: 'Xav Suprême', icon: '🏆✨' },
];

export function levelFor(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp || 0);
  let lvl = 1;
  while (lvl < 50) {
    const nextXp = Math.floor(120 * Math.pow(lvl, 1.65));
    if (safeXp >= nextXp) lvl++;
    else break;
  }
  const curMin = lvl === 1 ? 0 : Math.floor(120 * Math.pow(lvl - 1, 1.65));
  const nextMin = Math.floor(120 * Math.pow(lvl, 1.65));
  const progress = lvl >= 50 ? 1 : Math.min(1, Math.max(0, (safeXp - curMin) / (nextMin - curMin)));

  let titleObj = LEVEL_TITLES[0];
  for (let i = 0; i < LEVEL_TITLES.length; i++) {
    if (lvl >= LEVEL_TITLES[i].lvl) titleObj = LEVEL_TITLES[i];
  }

  return {
    level: lvl,
    name: titleObj.name,
    icon: titleObj.icon,
    curMin,
    nextMin,
    progress,
    isMax: lvl >= 50,
    xp: safeXp,
  };
}

export const DESIGN_AVATARS: Record<string, DesignAvatar> = {
  avatar_rockstar: {
    id: 'avatar_rockstar',
    name: 'Cat Rockstar 🎸',
    price: 250,
    desc: 'Chat déjanté aux lunettes noires et guitare électrique.',
    image: avatarCatRockstarImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#1e1b4b"/><circle cx="50" cy="55" r="30" fill="#fb7185"/><rect x="25" y="42" width="50" height="18" rx="6" fill="#0f172a"/></svg>`,
  },
  avatar_cyberdj: {
    id: 'avatar_cyberdj',
    name: 'Cyber DJ 🎧',
    price: 350,
    desc: 'Casque néon à résonance électro-spatiale.',
    image: avatarCatDjImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0284c7"/><circle cx="50" cy="56" r="22" fill="#0f172a"/></svg>`,
  },
  avatar_pizachef: {
    id: 'avatar_pizachef',
    name: 'Pizza Chef 🍕',
    price: 450,
    desc: 'La tranche sacrée de la Piza-House avec sa toque.',
    image: avatarPizzaChefImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#78350f"/><polygon points="50,22 18,82 82,82" fill="#f59e0b"/></svg>`,
  },
  avatar_goldmic: {
    id: 'avatar_goldmic',
    name: "Micro d'Or 🎤",
    price: 600,
    desc: 'Microphone trophée serti de diamants et couronne.',
    image: avatarGoldMicImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#1c1917"/><rect x="42" y="18" width="16" height="30" rx="8" fill="#f59e0b"/></svg>`,
  },
  avatar_spaceastro: {
    id: 'avatar_spaceastro',
    name: 'Astronaute 👨‍🚀',
    price: 750,
    desc: 'Casque galactique aux reflets nébuleux et étoiles.',
    image: avatarSpaceAstroImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#090d16"/><circle cx="50" cy="50" r="36" fill="#e2e8f0"/></svg>`,
  },
  avatar_dragon: {
    id: 'avatar_dragon',
    name: 'Dragon de Feu 🐉',
    price: 1000,
    desc: "Bébé dragon mythique cracheur d'étincelles dorées.",
    image: avatarFireDragonImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#450a0a"/><circle cx="50" cy="50" r="36" fill="#ef4444"/></svg>`,
  },
  avatar_robot: {
    id: 'avatar_robot',
    name: 'Xav Robot 🤖',
    price: 1200,
    desc: "L'incarnation cybernétique de votre hôte favori.",
    image: avatarXavRobotImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0f172a"/><rect x="24" y="28" width="52" height="44" rx="10" fill="#94a3b8"/></svg>`,
  },
  avatar_lion: {
    id: 'avatar_lion',
    name: 'Lion King 🦁',
    price: 200,
    desc: 'Le roi félin de la savane aux lunettes dorées.',
    image: avatarLionKingImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#d97706"/><circle cx="50" cy="50" r="30" fill="#fde68a"/></svg>`,
  },
  avatar_fox: {
    id: 'avatar_fox',
    name: 'Gamer Fox 🦊',
    price: 200,
    desc: 'Renard ultra-connecté au micro-casque néon.',
    image: avatarGamerFoxImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0e7490"/><circle cx="50" cy="50" r="30" fill="#fb923c"/></svg>`,
  },
  avatar_panda: {
    id: 'avatar_panda',
    name: 'Chill Panda 🐼',
    price: 200,
    desc: 'Panda épicurien savourant sa part de pizza.',
    image: avatarChillPandaImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#b45309"/><circle cx="50" cy="50" r="30" fill="#f1f5f9"/></svg>`,
  },
  avatar_dino: {
    id: 'avatar_dino',
    name: 'Party Dino 🦖',
    price: 200,
    desc: 'Bébé T-Rex festif coiffé de son chapeau confettis.',
    image: avatarPartyDinoImg,
    svg: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#15803d"/><circle cx="50" cy="50" r="30" fill="#86efac"/></svg>`,
  },
};

export const BADGES: Badge[] = [
  { id: 'first_game', icon: '🎵', name: 'Première Note', desc: 'Participer à sa 1ère partie.' },
  { id: 'perfect_game', icon: '💯', name: 'Sans Faute !', desc: '100% de bonnes réponses dans 1 partie.' },
  { id: 'night_owl', icon: '🌙', name: 'Joueur Nocturne', desc: 'Partie jouée entre 22h et 6h.' },
  { id: 'early_bird', icon: '🌅', name: 'Lève-Tôt', desc: 'Partie jouée entre 6h et 9h.' },
  { id: 'streak_3', icon: '🔥', name: 'Série de 3', desc: '3 bonnes réponses consécutives.' },
  { id: 'streak_5', icon: '👑', name: 'Roi de la Série', desc: '5 bonnes réponses consécutives.' },
  { id: 'streak_10', icon: '🚀', name: 'Inarrêtable', desc: '10 bonnes réponses consécutives.' },
  { id: 'fast_draw', icon: '⚡', name: 'Éclair de Génie', desc: 'Réponse correcte en < 2s.' },
  { id: 'speed_demon', icon: '⏱️', name: 'Doigts de Fée', desc: '3 réponses en < 3s dans 1 partie.' },
  { id: 'victory_1', icon: '🏆', name: 'Premier Champion', desc: 'Terminer 1er de la partie.' },
  { id: 'podium_3', icon: '🥉', name: 'Sur le Podium', desc: 'Finir dans le Top 3.' },
  { id: 'veteran_10', icon: '🎮', name: 'Mélomane Accro', desc: 'Jouer au moins 10 parties.' },
  { id: 'veteran_50', icon: '🛡️', name: 'Vétéran Piza', desc: 'Jouer au moins 50 parties.' },
  { id: 'star_collector_50', icon: '⭐', name: 'Petite Étoile', desc: 'Cumuler 50 étoiles.' },
  { id: 'star_collector_300', icon: '🌌', name: 'Constellation', desc: 'Cumuler 300 étoiles.' },
  { id: 'shopaholic', icon: '🛒', name: 'Fashion Victim', desc: 'Acheter un article en boutique.' },
  { id: 'avatar_vip', icon: '🎭', name: 'Look VIP', desc: 'Posséder un avatar stylisé.' },
  { id: 'level_10', icon: '🎖️', name: 'Niveau 10', desc: 'Atteindre le Niveau 10.' },
  { id: 'level_25', icon: '💎', name: 'Légende Vivante', desc: 'Atteindre le Niveau 25.' },
  { id: 'correct_50', icon: '👂', name: 'Fine Oreille', desc: 'Cumuler 50 bonnes réponses.' },
  { id: 'correct_200', icon: '📚', name: 'Encyclopédie', desc: 'Cumuler 200 bonnes réponses.' },
  { id: 'score_800', icon: '🎯', name: 'Expert des Points', desc: 'Atteindre au moins 800 points dans 1 partie.' },
  { id: 'score_950', icon: '👑', name: 'Maître Pur', desc: 'Atteindre au moins 950 points dans 1 partie.' },
];

export function getAnswerTime(gameType?: GameType): number {
  if (gameType && GAMES[gameType]?.timer) {
    return GAMES[gameType].timer;
  }
  return 20;
}

export function getPlayerStreak(room: Room, playerId: string, uptoRound: number): number {
  let streak = 0;
  for (let i = 0; i < uptoRound; i++) {
    const q = room.questions[i];
    const ans = room.answers?.[i]?.[playerId];
    if (ans && q && ans.choice === q.answer) streak++;
    else streak = 0;
  }
  return streak;
}

export function isEliminated(room: Room | null, playerId: string): boolean {
  if (!room || room.gameType !== 'survie') return false;
  for (let i = 0; i <= room.currentQ; i++) {
    const q = room.questions?.[i];
    const ans = room.answers?.[i]?.[playerId];
    if (i < room.currentQ) {
      if (!ans || !q || ans.choice !== q.answer) return true;
    } else {
      if (ans && q && ans.choice !== q.answer) return true;
    }
  }
  return false;
}

export function ts(): number {
  return Date.now();
}

export function genCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function randAvatar(): string {
  const keys = Object.keys(DESIGN_AVATARS);
  return keys[Math.floor(Math.random() * keys.length)] || 'avatar_rockstar';
}

export function randItem<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
