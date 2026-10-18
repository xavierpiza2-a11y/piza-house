import fs from 'fs';
import path from 'path';
import { AppConfig, Room, SavedGame, UserProfile } from '../types';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const SAVED_FILE = path.join(DATA_DIR, 'saved.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// Memory queues for atomic sequential file writes per file
const writeLocks: Record<string, Promise<void>> = {};

function enqueueWrite(filePath: string, writeFn: () => Promise<void>): Promise<void> {
  const currentLock = writeLocks[filePath] || Promise.resolve();
  const nextLock = currentLock.then(writeFn).catch((err) => {
    console.error(`Error writing file ${filePath}:`, err);
  });
  writeLocks[filePath] = nextLock;
  return nextLock;
}

async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  await enqueueWrite(filePath, async () => {
    const tmpFile = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tmpFile, jsonStr, 'utf-8');
    await fs.promises.rename(tmpFile, filePath);
  });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    if (!content.trim()) return fallback;
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

// Initial default configuration
const DEFAULT_CONFIG: { config: AppConfig; prompts: Record<string, string> } = {
  config: {
    timer: 20,
    rounds: 10,
    interludeEnabled: true,
    interludeFreq: 3,
    finalEnabled: true,
  },
  prompts: {
    interlude: `[SEED:{seed}] Manches jouées: {round}/{totalRounds}. Classement actuel:\n{podium}\n\nDonne un commentaire court, drôle et percutant de 2 phrases maximum pour animer la partie.`,
    final: `La partie est terminée ! Voici les scores définitifs :\n{ranking}\n\nDonne un commentaire final festif et un mot amusant pour le vainqueur.`,
  },
};

export async function initDatabase(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    await atomicWriteJson(USERS_FILE, {});
  }
  if (!fs.existsSync(ROOMS_FILE)) {
    await atomicWriteJson(ROOMS_FILE, {});
  }
  if (!fs.existsSync(SAVED_FILE)) {
    await atomicWriteJson(SAVED_FILE, {});
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    await atomicWriteJson(CONFIG_FILE, DEFAULT_CONFIG);
  }
  if (!fs.existsSync(STATS_FILE)) {
    await atomicWriteJson(STATS_FILE, { totalGames: 0, totalAnswers: 0, updatedAt: Date.now() });
  }
  console.log(`[DB] Local JSON database initialized at ${DATA_DIR}`);
}

// Users
export async function getAllUsers(): Promise<Record<string, UserProfile>> {
  return readJsonFile<Record<string, UserProfile>>(USERS_FILE, {});
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const users = await getAllUsers();
  return users[uid] || null;
}

export async function saveUser(profile: UserProfile): Promise<UserProfile> {
  const users = await getAllUsers();
  const existing = users[profile.uid] || {};
  const updated: UserProfile = {
    ...existing,
    ...profile,
  };
  users[profile.uid] = updated;
  await atomicWriteJson(USERS_FILE, users);
  return updated;
}

export async function deleteUser(uid: string): Promise<boolean> {
  const users = await getAllUsers();
  if (!users[uid]) return false;
  delete users[uid];
  await atomicWriteJson(USERS_FILE, users);
  return true;
}

// Rooms
export async function getAllRooms(): Promise<Record<string, Room>> {
  return readJsonFile<Record<string, Room>>(ROOMS_FILE, {});
}

export async function getRoom(code: string): Promise<Room | null> {
  const rooms = await getAllRooms();
  return rooms[code.toUpperCase()] || null;
}

export async function saveRoom(code: string, room: Room): Promise<Room> {
  const normalized = code.toUpperCase();
  const rooms = await getAllRooms();
  rooms[normalized] = room;
  await atomicWriteJson(ROOMS_FILE, rooms);
  return room;
}

export async function deleteRoom(code: string): Promise<boolean> {
  const normalized = code.toUpperCase();
  const rooms = await getAllRooms();
  if (!rooms[normalized]) return false;
  delete rooms[normalized];
  await atomicWriteJson(ROOMS_FILE, rooms);
  return true;
}

// Saved Games
export async function getAllSavedGames(): Promise<Record<string, SavedGame>> {
  return readJsonFile<Record<string, SavedGame>>(SAVED_FILE, {});
}

export async function saveSavedGame(id: string, game: SavedGame): Promise<SavedGame> {
  const saved = await getAllSavedGames();
  saved[id] = game;
  await atomicWriteJson(SAVED_FILE, saved);
  return game;
}

export async function deleteSavedGame(id: string): Promise<boolean> {
  const saved = await getAllSavedGames();
  if (!saved[id]) return false;
  delete saved[id];
  await atomicWriteJson(SAVED_FILE, saved);
  return true;
}

// Config & Prompts
export async function getAppConfig(): Promise<{ config: AppConfig; prompts: Record<string, string> }> {
  return readJsonFile(CONFIG_FILE, DEFAULT_CONFIG);
}

export async function saveAppConfig(newConfig: { config?: Partial<AppConfig>; prompts?: Record<string, string> }): Promise<{ config: AppConfig; prompts: Record<string, string> }> {
  const current = await getAppConfig();
  const merged = {
    config: {
      ...current.config,
      ...(newConfig.config || {}),
    },
    prompts: {
      ...current.prompts,
      ...(newConfig.prompts || {}),
    },
  };
  await atomicWriteJson(CONFIG_FILE, merged);
  return merged;
}

// Stats
export async function incrementStats(games = 0, answers = 0): Promise<void> {
  const stats = await readJsonFile<{ totalGames: number; totalAnswers: number; updatedAt: number }>(STATS_FILE, { totalGames: 0, totalAnswers: 0, updatedAt: Date.now() });
  stats.totalGames += games;
  stats.totalAnswers += answers;
  stats.updatedAt = Date.now();
  await atomicWriteJson(STATS_FILE, stats);
}

export { DATA_DIR, UPLOADS_DIR };
