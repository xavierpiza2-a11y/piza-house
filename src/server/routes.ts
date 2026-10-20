import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import {
  deleteRoom,
  deleteSavedGame,
  deleteUser,
  getAllRooms,
  getAllSavedGames,
  getAllUsers,
  getAppConfig,
  getRoom,
  getUser,
  saveAppConfig,
  saveRoom,
  saveSavedGame,
  saveUser,
  UPLOADS_DIR,
} from './db';
import { addSseClient, broadcastToRoom } from './sse';
import { Answer, Player, Room, UserProfile } from '../types';

export const apiRouter = Router();

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.VITE_ADMIN_EMAIL ||
  'xavier.piza2@gmail.com'
).toLowerCase().trim();

// Multer storage for profile photos in data/uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// ── AUTHENTICATION INTERNE PAR EMAIL (SANS GOOGLE) ──
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Une adresse email valide est requise.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Identifiant déterministe basé sur l'adresse email
    const uid = 'u_' + Buffer.from(cleanEmail).toString('base64').replace(/=/g, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
    const isAdmin = cleanEmail === ADMIN_EMAIL;

    let user = await getUser(uid);
    if (!user) {
      // Création de compte automatique
      user = {
        uid,
        email: cleanEmail,
        name: (name && String(name).trim()) || cleanEmail.split('@')[0],
        photoURL: '',
        avatar: avatar || 'avatar_rockstar',
        isAdmin,
        xp: 0,
        stars: 50,
        unlockedAvatars: ['avatar_rockstar'],
        badges: [],
        stats: { games: 0, correct: 0, answered: 0, best: 0 },
      };
    } else {
      if (name && String(name).trim()) {
        user.name = String(name).trim();
      }
      if (avatar) {
        user.avatar = avatar;
      }
      user.isAdmin = isAdmin;
    }

    await saveUser(user);
    res.json({ user, token: `token_${uid}_${Date.now()}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Échec de connexion';
    console.error('[AUTH] Internal login error:', err);
    res.status(500).json({ error: message });
  }
});

// ── USERS ──
apiRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(Object.values(users));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

apiRouter.get('/users/:uid', async (req: Request, res: Response) => {
  try {
    const uid = getParam(req.params.uid);
    const user = await getUser(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

apiRouter.put('/users/:uid', async (req: Request, res: Response) => {
  try {
    const uid = getParam(req.params.uid);
    const updated = await saveUser({
      ...req.body,
      uid,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

apiRouter.delete('/users/:uid', async (req: Request, res: Response) => {
  try {
    const uid = getParam(req.params.uid);
    const ok = await deleteUser(uid);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

apiRouter.post('/users/:uid/upload-photo', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }
    const photoUrl = `/api/uploads/${req.file.filename}`;
    const uid = getParam(req.params.uid);
    const user = await getUser(uid);
    if (user) {
      user.customPhoto = photoUrl;
      await saveUser(user);
    }
    res.json({ photoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

// ── ROOMS & SERVER-SENT EVENTS (SSE) ──
apiRouter.get('/rooms', async (_req: Request, res: Response) => {
  try {
    const rooms = await getAllRooms();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

apiRouter.get('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code);
    const room = await getRoom(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get room' });
  }
});

apiRouter.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { code, room } = req.body;
    if (!code || !room) {
      return res.status(400).json({ error: 'Code and room data required' });
    }
    const saved = await saveRoom(code, room);
    broadcastToRoom(code, 'room:update', saved);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

apiRouter.put('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code).toUpperCase();
    const existing = await getRoom(code);
    const updatedRoom: Room = {
      ...(existing || {}),
      ...req.body,
    };
    await saveRoom(code, updatedRoom);
    broadcastToRoom(code, 'room:update', updatedRoom);
    res.json(updatedRoom);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room' });
  }
});

apiRouter.delete('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code).toUpperCase();
    const ok = await deleteRoom(code);
    broadcastToRoom(code, 'room:deleted', { code });
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

apiRouter.post('/rooms/:code/join', async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code).toUpperCase();
    const player: Player = req.body;
    if (!player || !player.id) {
      return res.status(400).json({ error: 'Player data with id required' });
    }
    const room = await getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (!room.players) room.players = {};
    room.players[player.id] = player;
    await saveRoom(code, room);
    broadcastToRoom(code, 'room:update', room);
    broadcastToRoom(code, 'player:joined', { player });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

apiRouter.post('/rooms/:code/answer', async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code).toUpperCase();
    const { playerId, round, answer } = req.body as { playerId: string; round: number; answer: Answer };
    const room = await getRoom(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (!room.answers) room.answers = {};
    if (!room.answers[round]) room.answers[round] = {};
    room.answers[round][playerId] = answer;

    if (!room.scores) room.scores = {};
    room.scores[playerId] = (room.scores[playerId] || 0) + (answer.points || 0);

    await saveRoom(code, room);
    broadcastToRoom(code, 'room:update', room);
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

apiRouter.post('/rooms/:code/sfx', async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code).toUpperCase();
    const { sound } = req.body;
    const sfxData = { sound, ts: Date.now(), id: Math.random().toString(36).substring(2, 7) };
    const room = await getRoom(code);
    if (room) {
      room.sfxTrigger = sfxData;
      await saveRoom(code, room);
    }
    broadcastToRoom(code, 'sfx:trigger', sfxData);
    broadcastToRoom(code, 'room:update', room);
    res.json({ success: true, sfx: sfxData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger sound' });
  }
});

// SSE Stream
apiRouter.get('/rooms/:code/stream', async (req: Request, res: Response) => {
  const code = getParam(req.params.code).toUpperCase();
  const room = await getRoom(code);
  const cleanup = addSseClient(code, res, room);
  req.on('close', cleanup);
});

// ── SAVED GAMES ──
apiRouter.get('/saved', async (_req: Request, res: Response) => {
  try {
    const saved = await getAllSavedGames();
    res.json(Object.values(saved));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved games' });
  }
});

apiRouter.post('/saved', async (req: Request, res: Response) => {
  try {
    const game = req.body;
    if (!game || !game.id) return res.status(400).json({ error: 'Invalid game data' });
    const saved = await saveSavedGame(game.id, game);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save game' });
  }
});

apiRouter.delete('/saved/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const ok = await deleteSavedGame(id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete saved game' });
  }
});

// ── APP CONFIG & PROMPTS ──
apiRouter.get('/config', async (_req: Request, res: Response) => {
  try {
    const config = await getAppConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get config' });
  }
});

apiRouter.put('/config', async (req: Request, res: Response) => {
  try {
    const updated = await saveAppConfig(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// ── DEEZER MUSIC SEARCH PROXY (NO JSONP BUG) ──
apiRouter.get('/music/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ data: [] });
    const targetUrl = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15`;
    const resp = await fetch(targetUrl);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Deezer API error' });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[DEEZER] Music search proxy error:', err);
    res.status(500).json({ error: 'Failed to proxy Deezer search' });
  }
});

// ── CLAUDE / ANTHROPIC AI GENERATION PROXY ──
apiRouter.post('/claude', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: "Clé ANTHROPIC_API_KEY non configurée. Définissez-la dans votre fichier .env pour activer la génération IA.",
      });
    }

    // Appel direct sécurisé à l'API Anthropic
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    console.error('[CLAUDE] Generation proxy error:', err);
    res.status(500).json({ error: err.message || 'Échec de la communication avec l\'API Anthropic' });
  }
});

// ── HEALTH CHECK ──
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now() });
});

