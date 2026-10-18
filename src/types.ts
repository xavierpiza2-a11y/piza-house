export type GameType = 'blindtest' | 'quiz' | 'speed' | 'survie' | 'intrus' | 'blitz';

export interface Question {
  id: number | string;
  url: string;
  title: string;
  choices: string[];
  answer: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color?: string;
  photoURL?: string;
  customPhoto?: string;
  guest?: boolean;
  lvl?: string;
}

export interface Answer {
  choice: number;
  points: number;
  time: number;
  ts: number;
}

export interface Room {
  title: string;
  gameType: GameType;
  hostPlays: boolean;
  hostId?: string;
  questions: Question[];
  phase: 'lobby' | 'music' | 'reveal' | 'interlude' | 'scores';
  currentQ: number;
  players?: Record<string, Player>;
  answers?: Record<string | number, Record<string, Answer>>;
  scores?: Record<string, number>;
  musicStartedAt: number | null;
  createdAt: number;
  interludeRound?: number;
  interludeComment?: {
    emoji: string;
    comment: string;
    round?: number;
  } | null;
  finalComments?: {
    globalComment: string;
    playerComments?: Record<string, string>;
  } | null;
  sfxTrigger?: {
    sound: string;
    ts: number;
    id: string;
  };
}

export interface UserStats {
  games: number;
  correct: number;
  answered: number;
  best: number;
}

export interface UserProfile {
  uid: string;
  email?: string;
  name: string;
  photoURL?: string;
  customPhoto?: string;
  color?: string;
  avatar: string;
  isAdmin?: boolean;
  xp: number;
  stars?: number;
  unlockedThemes?: string[];
  unlockedAvatars?: string[];
  equippedTheme?: string;
  badges?: string[];
  stats?: UserStats;
}

export interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  curMin: number;
  nextMin: number;
  progress: number;
  isMax: boolean;
  xp: number;
}

export interface GameDefinition {
  id: GameType;
  name: string;
  emoji: string;
  hostPlays: boolean;
  timer: number;
  tag?: string;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface ShopTheme {
  id: string;
  name: string;
  price: number;
  desc: string;
  previewColor: string;
  tag: string;
}

export interface DesignAvatar {
  id: string;
  name: string;
  price: number;
  desc: string;
  svg: (size: number) => string;
  image?: string;
}

export interface AppConfig {
  timer: number;
  rounds: number;
  interludeEnabled: boolean;
  interludeFreq: number;
  finalEnabled: boolean;
}

export interface SavedGame {
  id: string;
  title: string;
  gameType: GameType;
  count: number;
  savedAt: number;
  questions?: Question[];
}

export interface SessionData {
  role: 'mj' | 'player';
  code: string;
  playerId?: string;
  name?: string;
  avatar?: string;
  hostPlays?: boolean;
  saveId?: string | null;
  title?: string;
}
