import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

// Helper to decode JWT token payload safely if client ID isn't verified or in local dev
function decodeJwtPayload(token: string): { sub: string; email?: string; name?: string; picture?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// ── AUTHENTICATION WITH GOOGLE IDENTITY SERVICES ──
apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Credential token is required' });
    }

    let payload: { sub: string; email?: string; name?: string; picture?: string } | null = null;

    if (GOOGLE_CLIENT_ID) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
        const ticketPayload = ticket.getPayload();
        if (ticketPayload) {
          payload = {
            sub: ticketPayload.sub,
            email: ticketPayload.email,
            name: ticketPayload.name,
            picture: ticketPayload.picture,
          };
        }
      } catch (verifyErr) {
        console.warn('[AUTH] Google token verification with client ID failed, using payload decoding:', verifyErr);
        payload = decodeJwtPayload(credential);
      }
    } else {
      payload = decodeJwtPayload(credential);
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid Google credential token' });
    }

    const uid = payload.sub;
    const email = payload.email || '';
    const name = payload.name || 'Joueur Google';
    const photoURL = payload.picture || '';
    const isAdmin = email.toLowerCase() === 'xavier.piza2@gmail.com';

    let user = await getUser(uid);
    if (!user) {
      user = {
        uid,
        email,
        name,
        photoURL,
        avatar: '🦁',
        isAdmin,
        xp: 0,
        stars: 0,
        unlockedThemes: ['original'],
        unlockedAvatars: [],
        equippedTheme: 'original',
        badges: [],
        stats: { games: 0, correct: 0, answered: 0, best: 0 },
      };
    } else {
      user.name = user.name || name;
      user.photoURL = user.photoURL || photoURL;
      if (isAdmin) user.isAdmin = true;
    }

    await saveUser(user);
    res.json({ user, token: credential });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Auth failed';
    console.error('[AUTH] Google auth error:', err);
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

// ── HEALTH CHECK ──
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now() });
});
