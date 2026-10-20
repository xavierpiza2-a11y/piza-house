import React, { useEffect, useState } from 'react';
import {
  ADMIN_EMAIL,
  AuthUser,
  CONFIG_REF,
  dbGet,
  dbOff,
  dbOn,
  dbRemove,
  dbSet,
  logoutUser,
  lsDel,
  lsGet,
  lsSet,
  onAuthStateChanged,
  SAVED_REF,
  STATS_REF,
  USERS_REF,
} from './lib/api';
import { AuthModal } from './components/AuthModal';
import {
  bgGameArcadeImg,
  bgGameBlindtestImg,
  bgGameQuizImg,
  bgMenuPizahouseImg,
} from './assets/images';
import {
  AppConfig,
  GameType,
  Player,
  Question,
  Room,
  SavedGame,
  SessionData,
  UserProfile,
} from './types';
import {
  BADGES,
  DESIGN_AVATARS,
  genCode,
  GAMES,
  levelFor,
  randAvatar,
  randomColor,
  ts,
} from './lib/constants';
import { playAudioEffect } from './lib/audio';
import { generateFinalComments, generateInterludeComment } from './lib/claude';
import { BottomNav, TabType } from './components/BottomNav';
import { Confetti } from './components/Confetti';
import { Soundboard } from './components/Soundboard';
import { UserProfileModal } from './components/UserProfileModal';
import { SavedGamesModal } from './components/SavedGamesModal';
import { DeezerModal } from './components/DeezerModal';
import { AdminPlayerModal } from './components/AdminPlayerModal';

// Screens
import { HomeScreen } from './components/screens/HomeScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { FriendsScreen } from './components/screens/FriendsScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { HostLobbyScreen } from './components/screens/HostLobbyScreen';
import { PlayerLobbyScreen } from './components/screens/PlayerLobbyScreen';
import { HostGameScreen } from './components/screens/HostGameScreen';
import { PlayerGameScreen } from './components/screens/PlayerGameScreen';
import { InterludeScreen } from './components/screens/InterludeScreen';
import { FinalScoresScreen } from './components/screens/FinalScoresScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { DeezerTrack } from './lib/deezer';

export const App: React.FC = () => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [guest, setGuest] = useState<{ id: string; name: string; avatar: string }>({
    id: 'p' + ts(),
    name: '',
    avatar: randAvatar(),
  });

  // App Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [screen, setScreen] = useState<string>('home');

  // Room state
  const [isMJ, setIsMJ] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameType, setGameType] = useState<GameType>('blindtest');
  const [saveId, setSaveId] = useState<string | null>(null);

  // Setup state
  const [setupQuestions, setSetupQuestions] = useState<Question[]>([
    { id: ts() + Math.random(), url: '', title: '', choices: ['', '', '', ''], answer: 0 },
  ]);

  // Session
  const [session, setSession] = useState<SessionData | null>(null);

  // Modals & FX
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [deezerModalOpen, setDeezerModalOpen] = useState(false);
  const [deezerQIndex, setDeezerQIndex] = useState(0);
  const [adminPlayerModalOpen, setAdminPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<UserProfile | null>(null);
  const [xpToastHtml, setXpToastHtml] = useState<string>('');
  const [lastSfxId, setLastSfxId] = useState<string>('');

  // 1. Initialize guest identity
  useEffect(() => {
    let g = lsGet<{ id: string; name: string; avatar: string }>('bt:guest');
    if (!g || !g.id) {
      g = { id: 'p' + ts() + Math.random().toString(36).slice(2, 6), name: '', avatar: randAvatar() };
      lsSet('bt:guest', g);
    }
    setGuest(g);
  }, []);

  // 2. Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        const existing = await dbGet<UserProfile>(`${USERS_REF}/${user.uid}`);
        const userEmail = (user.email || '').toLowerCase().trim();
        const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase().trim();

        if (!existing) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: userEmail,
            name: user.displayName || userEmail.split('@')[0] || 'Joueur',
            photoURL: user.photoURL || '',
            customPhoto: '',
            color: isAdmin ? '#F5C518' : randomColor(),
            avatar: 'avatar_rockstar',
            isAdmin,
            xp: 0,
            stars: 50,
            unlockedAvatars: ['avatar_rockstar'],
            badges: [],
            stats: { games: 0, correct: 0, answered: 0, best: 0 },
          };
          await dbSet(`${USERS_REF}/${user.uid}`, newProfile);
          setProfile(newProfile);
        } else {
          if (existing.isAdmin !== isAdmin) {
            existing.isAdmin = isAdmin;
            await dbSet(`${USERS_REF}/${user.uid}/isAdmin`, isAdmin);
          }
          if (existing.xp === undefined) {
            existing.xp = 0;
            await dbSet(`${USERS_REF}/${user.uid}/xp`, 0);
          }
          if (existing.stars === undefined) {
            existing.stars = 0;
            await dbSet(`${USERS_REF}/${user.uid}/stars`, 0);
          }
          if (!existing.badges) {
            existing.badges = [];
            await dbSet(`${USERS_REF}/${user.uid}/badges`, []);
          }
          setProfile(existing);
        }
        await dbSet(`${STATS_REF}/lastLogin`, {
          name: existing?.name || user.displayName || 'Utilisateur',
          at: ts(),
        });
      } else {
        setCurrentUser(null);
        setProfile(null);
      }

      // Check session for reconnection
      const storedSession = lsGet<SessionData>('bt:session');
      if (storedSession) {
        const r = await dbGet<Room>(`rooms/${storedSession.code}`);
        if (r && r.phase !== 'scores') {
          setSession(storedSession);
        } else {
          lsDel('bt:session');
          setSession(null);
        }
      }
    });

    return () => unsub();
  }, []);

  const myIdentity = () => {
    if (currentUser && profile) {
      return {
        id: 'u' + currentUser.uid,
        name: profile.name,
        avatar: profile.avatar || 'avatar_rockstar',
        color: profile.color || '#F5C518',
        photoURL: profile.customPhoto || profile.photoURL || '',
        connected: true,
        lvl: levelFor(profile.xp).icon,
        stars: profile.stars || 0,
      };
    }
    return {
      id: guest.id,
      name: guest.name || 'Invité',
      avatar: guest.avatar || 'avatar_rockstar',
      color: '#1A1A2E',
      photoURL: '',
      connected: false,
      guest: true,
      stars: 0,
    };
  };

  const ensureName = (): boolean => {
    const idn = myIdentity();
    if (idn.connected) return true;
    if (idn.name && idn.name !== 'Invité') return true;
    const n = prompt('Choisis ton pseudo :', '');
    if (!n || !n.trim()) return false;
    const updated = { ...guest, name: n.trim().slice(0, 20) };
    setGuest(updated);
    lsSet('bt:guest', updated);
    return true;
  };

  const playerFromIdentity = (nameOverride?: string): Player => {
    const idn = myIdentity();
    return {
      id: idn.id,
      name: nameOverride || idn.name,
      avatar: idn.avatar,
      color: idn.color,
      photoURL: idn.photoURL,
      guest: !idn.connected,
      lvl: idn.connected ? idn.lvl : '',
    };
  };

  // 3. Room real-time watcher
  useEffect(() => {
    if (!roomCode) return;
    const ref = dbOn<Room>(`rooms/${roomCode}`, async (fresh) => {
      if (!fresh) return;

      // Realtime sound effect sync
      if (fresh.sfxTrigger && fresh.sfxTrigger.id !== lastSfxId) {
        setLastSfxId(fresh.sfxTrigger.id);
        playAudioEffect(fresh.sfxTrigger.sound);
      }

      setRoom(fresh);

      // Handle phase changes & interlude generation
      if (fresh.phase === 'interlude' && isMJ && !fresh.interludeComment) {
        const roundIdx = fresh.interludeRound !== undefined ? fresh.interludeRound : fresh.currentQ;
        const q = fresh.questions[roundIdx];
        const playersList = Object.values(fresh.players || {});
        const answers = fresh.answers?.[roundIdx] || {};
        const correctAnswer = q?.choices[q.answer] || '';
        const answeredCorrectly = playersList
          .filter((p) => answers[p.id]?.choice === q?.answer)
          .map((p) => p.name);

        const cfg = await dbGet<any>(`${CONFIG_REF}/prompts/${fresh.gameType}`);
        const customPrompt = cfg?.interlude;

        const result = await generateInterludeComment(
          roundIdx + 1,
          fresh.scores || {},
          playersList,
          correctAnswer,
          answeredCorrectly,
          fresh.gameType,
          customPrompt
        );

        await dbSet(`rooms/${roomCode}/interludeComment`, {
          emoji: result?.emoji || '🎵',
          comment: result?.comment || `Bonne réponse : ${correctAnswer} !`,
          round: roundIdx,
        });
      }

      // Handle final scores & commentary
      if (fresh.phase === 'scores' && isMJ && !fresh.finalComments) {
        setConfettiTrigger(Date.now());
        const playersList = Object.values(fresh.players || {});
        const cfg = await dbGet<any>(`${CONFIG_REF}/prompts/${fresh.gameType}`);
        const customPrompt = cfg?.finalScores;

        const result = await generateFinalComments(
          playersList,
          fresh.scores || {},
          fresh.gameType,
          customPrompt
        );

        const fbGlobal = [
          'Quelle soirée ! Les neurones ont chauffé 🔥',
          "Certains ont brillé, d'autres… ont participé 😅",
          'La famille unie dans la défaite… et la victoire ! 🎉',
        ];
        const fbPlayer = [
          '🏆 Champion incontesté !',
          '😤 Pas loin du podium…',
          '😅 Y a du boulot !',
          '🐢 La lenteur a ses charmes…',
        ];

        const globalComment = result?.globalComment || fbGlobal[Math.floor(Math.random() * fbGlobal.length)];
        const playerComments: Record<string, string> = {};
        const sorted = [...playersList].sort((a, b) => (fresh.scores?.[b.id] || 0) - (fresh.scores?.[a.id] || 0));
        sorted.forEach((p, i) => {
          playerComments[p.id] = result?.playerComments?.[p.id] || fbPlayer[Math.min(i, fbPlayer.length - 1)];
        });

        await dbSet(`rooms/${roomCode}/finalComments`, {
          globalComment,
          playerComments,
        });
      }

      // Calculate XP on scores screen for connected user
      if (fresh.phase === 'scores') {
        setConfettiTrigger(Date.now());
        awardXP(fresh);
      }
    });

    return () => {
      dbOff(ref);
    };
  }, [roomCode, isMJ, lastSfxId]);

  // Award XP and badges on game end
  const awardXP = async (freshRoom: Room) => {
    if (!currentUser || !profile || !roomCode) return;
    const myId = 'u' + currentUser.uid;
    const key = `bt:xp:${roomCode}`;
    if (lsGet(key)) return;

    const playersList = Object.values(freshRoom.players || {});
    if (!playersList.find((p) => p.id === myId)) return;

    const sorted = [...playersList].sort((a, b) => (freshRoom.scores?.[b.id] || 0) - (freshRoom.scores?.[a.id] || 0));

    let earned = 0;
    let correct = 0;
    let answered = 0;
    let fastCount = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    const nQ = freshRoom.questions.length;

    for (let i = 0; i < nQ; i++) {
      const a = freshRoom.answers?.[i]?.[myId];
      if (a) {
        answered++;
        earned += 5;
        if (a.choice === freshRoom.questions[i].answer) {
          correct++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          const timeTaken = a.time || 0;
          if (timeTaken > 0 && timeTaken < 3) {
            fastCount++;
            earned += 15;
          } else if (timeTaken > 0 && timeTaken < 5) {
            earned += 12;
          } else {
            earned += 10;
          }
        } else {
          currentStreak = 0;
        }
      } else {
        currentStreak = 0;
      }
    }

    const rank = sorted.findIndex((p) => p.id === myId);
    if (rank === 0) earned += 50;
    else if (rank === 1) earned += 30;
    else if (rank === 2) earned += 20;

    let earnedStars = 0;
    earnedStars += fastCount * 3;
    if (maxStreak >= 10) earnedStars += 40;
    else if (maxStreak >= 5) earnedStars += 20;
    else if (maxStreak >= 3) earnedStars += 8;

    if (rank === 0) earnedStars += 30;
    else if (rank === 1) earnedStars += 20;
    else if (rank === 2) earnedStars += 10;
    else earnedStars += 5;

    if (earned <= 0 && earnedStars <= 0) {
      lsSet(key, true);
      return;
    }

    const prevLvl = levelFor(profile.xp).level;
    const newXP = (profile.xp || 0) + earned;
    const newStars = (profile.stars || 0) + earnedStars;

    const st = profile.stats || { games: 0, correct: 0, answered: 0, best: 0 };
    st.games = (st.games || 0) + 1;
    st.correct = (st.correct || 0) + correct;
    st.answered = (st.answered || 0) + answered;
    st.best = Math.max(st.best || 0, freshRoom.scores?.[myId] || 0);

    await dbSet(`${USERS_REF}/${currentUser.uid}/xp`, newXP);
    await dbSet(`${USERS_REF}/${currentUser.uid}/stars`, newStars);
    await dbSet(`${USERS_REF}/${currentUser.uid}/stats`, st);

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXP,
      stars: newStars,
      stats: st,
    };
    setProfile(updatedProfile);
    lsSet(key, true);

    let fastestTime = 99;
    for (let i = 0; i < nQ; i++) {
      const a = freshRoom.answers?.[i]?.[myId];
      if (a && a.time != null && a.time > 0 && a.time < fastestTime) {
        fastestTime = a.time;
      }
    }

    const unlockedSet = new Set(updatedProfile.badges || []);
    const initialBadgeCount = unlockedSet.size;

    const nowHour = new Date().getHours();
    if (nowHour >= 22 || nowHour < 6) unlockedSet.add('night_owl');
    if (nowHour >= 6 && nowHour < 9) unlockedSet.add('early_bird');
    if (rank === 0) unlockedSet.add('victory_1');
    if (rank >= 0 && rank <= 2) unlockedSet.add('podium_3');
    if (answered > 0 && correct === answered && answered >= 3) unlockedSet.add('perfect_game');
    if (maxStreak >= 3) unlockedSet.add('streak_3');
    if (maxStreak >= 5) unlockedSet.add('streak_5');
    if (maxStreak >= 10) unlockedSet.add('streak_10');
    if (fastestTime > 0 && fastestTime < 2) unlockedSet.add('fast_draw');
    if (fastCount >= 3) unlockedSet.add('speed_demon');
    if ((freshRoom.scores?.[myId] || 0) >= 800) unlockedSet.add('score_800');
    if ((freshRoom.scores?.[myId] || 0) >= 950) unlockedSet.add('score_950');

    if (st.games >= 1) unlockedSet.add('first_game');
    if (st.games >= 10) unlockedSet.add('veteran_10');
    if (st.games >= 50) unlockedSet.add('veteran_50');
    if (st.correct >= 50) unlockedSet.add('correct_50');
    if (st.correct >= 200) unlockedSet.add('correct_200');
    if (newStars >= 50) unlockedSet.add('star_collector_50');
    if (newStars >= 300) unlockedSet.add('star_collector_300');

    const newLvl = levelFor(newXP);
    if (newLvl.level >= 10) unlockedSet.add('level_10');
    if (newLvl.level >= 25) unlockedSet.add('level_25');

    let badgeToast = '';
    if (unlockedSet.size > initialBadgeCount) {
      const updatedBadges = Array.from(unlockedSet);
      updatedProfile.badges = updatedBadges;
      await dbSet(`${USERS_REF}/${currentUser.uid}/badges`, updatedBadges);
      const diff = unlockedSet.size - initialBadgeCount;
      badgeToast = `<div class="xp-toast badge-toast">🏆 ${
        diff === 1 ? 'Nouveau Badge Débloqué !' : `${diff} Nouveaux Badges Débloqués !`
      }</div>`;
    }

    const baseToast = `<div class="xp-toast">✨ +${earned} XP · ⭐ +${earnedStars} Étoiles${
      newLvl.level > prevLvl ? ` · Niveau ${newLvl.level} ${newLvl.icon} !` : ''
    }</div>`;
    setXpToastHtml(baseToast + badgeToast);
  };

  // User Login / Signup
  const handleOpenLogin = () => {
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setProfile(null);
    setCurrentTab('home');
    setScreen('home');
  };

  // Open Host / Setup
  const handleOpenHost = (gType: GameType) => {
    setGameType(gType);
    setSaveId(null);
    setSetupQuestions([
      { id: ts() + Math.random(), url: '', title: '', choices: ['', '', '', ''], answer: 0 },
    ]);
    setScreen('setup');
  };

  // Launch Host Game
  const handleLaunchGame = async (title: string, questions: Question[]) => {
    if (!ensureName()) return;
    const def = GAMES[gameType] || GAMES.blindtest;
    const code = genCode();
    const idn = myIdentity();
    const hostPlayer = playerFromIdentity();

    const newRoom: Room = {
      title,
      gameType,
      hostPlays: def.hostPlays,
      hostId: idn.id,
      questions,
      phase: 'lobby',
      currentQ: 0,
      players: def.hostPlays ? { [idn.id]: hostPlayer } : {},
      answers: {},
      scores: {},
      musicStartedAt: null,
      createdAt: ts(),
      interludeComment: null,
      finalComments: null,
    };

    await dbSet(`rooms/${code}`, newRoom);
    setIsMJ(true);
    setRoomCode(code);
    setRoom(newRoom);
    if (def.hostPlays) setPlayer(hostPlayer);
    else setPlayer(null);

    const sess: SessionData = {
      role: 'mj',
      code,
      playerId: idn.id,
      hostPlays: def.hostPlays,
      saveId,
      title,
    };
    lsSet('bt:session', sess);
    setSession(sess);
    setScreen('game');
  };

  const handleSaveGame = async (title: string, questions: Question[]) => {
    const id = saveId || 's' + ts();
    setSaveId(id);
    const saved: SavedGame = {
      id,
      title,
      gameType,
      count: questions.length,
      savedAt: ts(),
      questions,
    };
    await dbSet(`${SAVED_REF}/${id}`, saved);
  };

  // Join Room
  const handleJoinRoom = async (name: string, code: string) => {
    const r = await dbGet<Room>(`rooms/${code}`);
    if (!r) {
      alert('Salle introuvable. Vérifie le code !');
      return;
    }
    if (r.phase === 'scores') {
      setIsMJ(false);
      setRoomCode(code);
      setRoom(r);
      setPlayer(null);
      setScreen('game');
      return;
    }

    const idn = myIdentity();
    const playerData: Player = {
      id: idn.id,
      name,
      avatar: idn.avatar,
      color: idn.color,
      photoURL: idn.photoURL,
      guest: !idn.connected,
      lvl: idn.connected ? idn.lvl : '',
    };

    await dbSet(`rooms/${code}/players/${idn.id}`, playerData);
    setIsMJ(false);
    setRoomCode(code);
    setGameType(r.gameType || 'blindtest');
    setPlayer(playerData);
    setRoom({ ...r, players: { ...(r.players || {}), [idn.id]: playerData } });

    const sess: SessionData = {
      role: 'player',
      code,
      playerId: idn.id,
      name,
      avatar: playerData.avatar,
      title: r.title,
    };
    lsSet('bt:session', sess);
    setSession(sess);
    setScreen('game');
  };

  // Reconnection
  const handleReconnect = async () => {
    if (!session) return;
    const r = await dbGet<Room>(`rooms/${session.code}`);
    if (!r || r.phase === 'scores') {
      lsDel('bt:session');
      setSession(null);
      alert('Cette partie est déjà terminée.');
      return;
    }
    setRoomCode(session.code);
    setRoom(r);
    setGameType(r.gameType || 'blindtest');

    if (session.role === 'mj') {
      setIsMJ(true);
      setSaveId(session.saveId || null);
      if (r.hostPlays) {
        setPlayer(r.players?.[session.playerId || ''] || playerFromIdentity());
      }
    } else {
      setIsMJ(false);
      const existing = r.players?.[session.playerId || ''];
      const p: Player = {
        id: session.playerId || 'p' + ts(),
        name: session.name || 'Joueur',
        avatar: existing?.avatar || session.avatar || '🎵',
        guest: existing?.guest,
        photoURL: existing?.photoURL || '',
        color: existing?.color,
      };
      setPlayer(p);
      if (!existing && session.playerId) {
        await dbSet(`rooms/${session.code}/players/${session.playerId}`, p);
      }
    }
    setScreen('game');
  };

  const handleDismissReconnect = () => {
    lsDel('bt:session');
    setSession(null);
  };

  // Game Engine Actions
  const handleStartGame = async () => {
    if (!room || !roomCode) return;
    const playersList = Object.values(room.players || {});
    if (!playersList.length) {
      alert("Attends qu'au moins un joueur rejoigne la salle !");
      return;
    }

    const updated: Room = {
      ...room,
      phase: 'music',
      currentQ: 0,
      answers: {},
      scores: {},
      musicStartedAt: ts(),
    };
    await dbSet(`rooms/${roomCode}`, updated);
    setRoom(updated);
  };

  const handleQuitRoom = async () => {
    if (!confirm('Fermer la salle ?')) return;
    if (roomCode) {
      await dbRemove(`rooms/${roomCode}`);
    }
    lsDel('bt:session');
    setSession(null);
    setRoomCode(null);
    setRoom(null);
    setIsMJ(false);
    setPlayer(null);
    setScreen('home');
  };

  const handleStopRound = async () => {
    if (!roomCode) return;
    await dbSet(`rooms/${roomCode}/phase`, 'reveal');
  };

  const handleNextRound = async () => {
    if (!room || !roomCode) return;
    const nextQ = room.currentQ + 1;
    const isLast = nextQ >= room.questions.length;
    if (isLast) {
      await dbSet(`rooms/${roomCode}/phase`, 'scores');
      return;
    }

    const cfg = (await dbGet<AppConfig>(CONFIG_REF)) || {
      timer: 20,
      rounds: 10,
      interludeEnabled: true,
      interludeFreq: 3,
      finalEnabled: true,
    };
    const freq = cfg.interludeFreq || 3;
    const interludeActive = cfg.interludeEnabled !== false;
    const isFreqRound = nextQ % freq === 0;

    if (interludeActive && isFreqRound) {
      const updated: Room = {
        ...room,
        phase: 'interlude',
        interludeRound: room.currentQ,
        interludeComment: null,
      };
      await dbSet(`rooms/${roomCode}`, updated);
      setRoom(updated);
    } else {
      const updated: Room = {
        ...room,
        phase: 'music',
        currentQ: nextQ,
        musicStartedAt: ts(),
      };
      await dbSet(`rooms/${roomCode}`, updated);
      setRoom(updated);
    }
  };

  const handleInterludeContinue = async () => {
    if (!room || !roomCode) return;
    const nextQ = (room.interludeRound !== undefined ? room.interludeRound : room.currentQ) + 1;
    const updated: Room = {
      ...room,
      phase: 'music',
      currentQ: nextQ,
      musicStartedAt: ts(),
    };
    await dbSet(`rooms/${roomCode}`, updated);
    setRoom(updated);
  };

  const handleAnswer = async (choiceIndex: number) => {
    if (!room || !roomCode || !player) return;
    const maxTime = GAMES[room.gameType]?.timer || 20;
    const left = Math.max(0, maxTime - (ts() - (room.musicStartedAt || 0)) / 1000);
    if (left <= 0 || room.answers?.[room.currentQ]?.[player.id]) return;

    const currentQuestion = room.questions[room.currentQ];
    const isCorrect = choiceIndex === currentQuestion.answer;

    let pts = 0;
    if (isCorrect) {
      let base = Math.max(50, Math.round(1000 * (left / maxTime)));
      if (room.gameType === 'speed') {
        base = base * 2;
      } else if (room.gameType === 'blitz') {
        let streak = 0;
        for (let i = 0; i < room.currentQ; i++) {
          const ans = room.answers?.[i]?.[player.id];
          const q = room.questions[i];
          if (ans && q && ans.choice === q.answer) streak++;
          else streak = 0;
        }
        const mult = streak >= 3 ? 3 : streak >= 1 ? 2 : 1;
        base = base * mult;
      }
      pts = base;
    }

    await dbSet(`rooms/${roomCode}/answers/${room.currentQ}/${player.id}`, {
      choice: choiceIndex,
      points: pts,
      time: maxTime - left,
      ts: ts(),
    });
    const currentScore = room.scores?.[player.id] || 0;
    await dbSet(`rooms/${roomCode}/scores/${player.id}`, currentScore + pts);
  };

  // Shop avatar purchase / equip
  const handleBuyAvatar = async (id: string) => {
    if (!currentUser || !profile) {
      setAuthModalOpen(true);
      return;
    }
    const userStars = profile.stars || 0;
    const item = DESIGN_AVATARS[id];
    if (!item) return;

    const unlockedAvatars = profile.unlockedAvatars || ['avatar_rockstar'];
    const isUnlocked = unlockedAvatars.includes(id);

    if (isUnlocked) {
      await dbSet(`${USERS_REF}/${currentUser.uid}/avatar`, id);
      const updated = { ...profile, avatar: id };
      setProfile(updated);
      return;
    }

    if (userStars < item.price) {
      return;
    }

    const newStars = userStars - item.price;
    const newUnlocked = [...unlockedAvatars, id];
    await dbSet(`${USERS_REF}/${currentUser.uid}/unlockedAvatars`, newUnlocked);
    await dbSet(`${USERS_REF}/${currentUser.uid}/avatar`, id);
    await dbSet(`${USERS_REF}/${currentUser.uid}/stars`, newStars);
    const updated = { ...profile, unlockedAvatars: newUnlocked, avatar: id, stars: newStars };
    setProfile(updated);
    setConfettiTrigger(Date.now());
  };

  // Deezer select
  const handleDeezerTrackSelected = (tk: DeezerTrack) => {
    const next = [...setupQuestions];
    next[deezerQIndex] = {
      ...next[deezerQIndex],
      url: `https://www.deezer.com/track/${tk.id}`,
    };
    setSetupQuestions(next);
  };

  // Admin save player
  const handleAdminSavePlayer = async (updated: UserProfile) => {
    await dbSet(`${USERS_REF}/${updated.uid}/xp`, updated.xp);
    await dbSet(`${USERS_REF}/${updated.uid}/stars`, updated.stars);
    await dbSet(`${USERS_REF}/${updated.uid}/unlockedAvatars`, updated.unlockedAvatars);
    await dbSet(`${USERS_REF}/${updated.uid}/badges`, updated.badges);

    if (currentUser && updated.uid === currentUser.uid) {
      setProfile(updated);
    }
  };

  // Render content based on screen / tabs
  const renderCurrentScreen = () => {
    // If inside an active game room
    if (screen === 'game' && room) {
      const pureMJ = isMJ && !room.hostPlays;

      if (room.phase === 'lobby') {
        if (isMJ) {
          return (
            <HostLobbyScreen
              room={room}
              roomCode={roomCode!}
              onStartGame={handleStartGame}
              onQuitRoom={handleQuitRoom}
            />
          );
        }
        return <PlayerLobbyScreen room={room} player={player || playerFromIdentity()} />;
      }

      if (room.phase === 'music' || room.phase === 'reveal') {
        if (pureMJ) {
          return (
            <HostGameScreen
              room={room}
              roomCode={roomCode!}
              onStopRound={handleStopRound}
              onNextRound={handleNextRound}
            />
          );
        }
        return (
          <PlayerGameScreen
            room={room}
            player={player || playerFromIdentity()}
            isHostPlaying={isMJ && room.hostPlays}
            onAnswer={handleAnswer}
            onHostReveal={handleStopRound}
            onHostNextRound={handleNextRound}
            onOpenSoundboard={() => setSoundboardOpen(true)}
          />
        );
      }

      if (room.phase === 'interlude') {
        return (
          <InterludeScreen
            room={room}
            isHost={isMJ}
            onContinue={handleInterludeContinue}
          />
        );
      }

      if (room.phase === 'scores') {
        return (
          <FinalScoresScreen
            room={room}
            isHost={isMJ}
            xpToastHtml={xpToastHtml}
            onRestart={() => handleOpenHost(gameType)}
            onHome={() => {
              lsDel('bt:session');
              setSession(null);
              setRoomCode(null);
              setRoom(null);
              setIsMJ(false);
              setPlayer(null);
              setScreen('home');
              setCurrentTab('home');
            }}
          />
        );
      }
    }

    // Setup screen
    if (screen === 'setup') {
      return (
        <SetupScreen
          gameType={gameType}
          onBack={() => {
            setScreen('home');
            setCurrentTab('home');
          }}
          onLaunchGame={handleLaunchGame}
          onSaveGame={handleSaveGame}
          onOpenSavedModal={() => setSavedModalOpen(true)}
          onOpenDeezerModal={(qIdx) => {
            setDeezerQIndex(qIdx);
            setDeezerModalOpen(true);
          }}
          questions={setupQuestions}
          onQuestionsChange={setSetupQuestions}
        />
      );
    }

    // Admin Screen (Restricted strictly to configured ADMIN_EMAIL)
    if (screen === 'admin') {
      if (!profile?.isAdmin) {
        return null;
      }
      return (
        <AdminScreen
          currentProfile={profile}
          onBack={() => {
            setScreen('home');
            setCurrentTab('profile');
          }}
          onEditPlayer={(p) => {
            setEditingPlayer(p);
            setAdminPlayerModalOpen(true);
          }}
        />
      );
    }

    // Main shell tabs
    switch (currentTab) {
      case 'leaderboard':
        return (
          <LeaderboardScreen
            currentUid={currentUser?.uid}
            onOpenLogin={handleOpenLogin}
          />
        );
      case 'friends':
        return <FriendsScreen />;
      case 'shop':
        return (
          <ShopScreen
            profile={profile}
            onOpenLogin={handleOpenLogin}
            onBuyAvatar={handleBuyAvatar}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            onOpenLogin={handleOpenLogin}
            onOpenEditProfile={() => setUserProfileModalOpen(true)}
            onOpenAdmin={() => {
              if (profile?.isAdmin) setScreen('admin');
            }}
            onLogout={handleLogout}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            profile={profile}
            guestName={guest.name}
            guestAvatar={guest.avatar}
            onOpenProfile={() => {
              if (profile) setCurrentTab('profile');
              else setUserProfileModalOpen(true);
            }}
            onOpenLogin={handleOpenLogin}
            onOpenHost={handleOpenHost}
            onJoinRoom={handleJoinRoom}
            session={session}
            onReconnect={handleReconnect}
            onDismissReconnect={handleDismissReconnect}
          />
        );
    }
  };

  const isNavVisible = screen === 'home' && ['home', 'leaderboard', 'friends', 'shop', 'profile'].includes(currentTab);

  // Background selection: Menu screens vs. Specific in-game launched
  const isGameLaunched = screen === 'game' && !!room && ['music', 'round', 'reveal', 'interlude', 'scores'].includes(room.phase);

  let currentBgImage = bgMenuPizahouseImg;
  if (isGameLaunched && room) {
    const activeType = room.gameType || gameType;
    if (activeType === 'blindtest') {
      currentBgImage = bgGameBlindtestImg;
    } else if (activeType === 'quiz') {
      currentBgImage = bgGameQuizImg;
    } else {
      currentBgImage = bgGameArcadeImg;
    }
  }

  return (
    <>
      {/* Background layer for all menu screens and specific game launched */}
      <div
        className="app-bg-layer"
        style={{
          backgroundImage: `url(${currentBgImage})`,
        }}
      />

      <Confetti trigger={confettiTrigger} />

      {renderCurrentScreen()}

      <BottomNav
        currentTab={currentTab}
        onChangeTab={(t) => {
          setScreen('home');
          setCurrentTab(t);
        }}
        isVisible={isNavVisible}
      />

      {/* Floating Soundboard Modal */}
      <Soundboard
        roomCode={roomCode}
        isOpen={soundboardOpen}
        onClose={() => setSoundboardOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        user={currentUser}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
        }}
      />

      {/* Native Internal Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(updated) => {
          setProfile(updated);
        }}
      />

      {/* Saved Games Modal */}
      <SavedGamesModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        onLoadGame={(g) => {
          setGameType(g.gameType || 'blindtest');
          setSaveId(g.id);
          setSetupQuestions(g.questions || []);
          setScreen('setup');
        }}
      />

      {/* Deezer Search Modal */}
      <DeezerModal
        isOpen={deezerModalOpen}
        initialQuery={setupQuestions[deezerQIndex]?.choices[setupQuestions[deezerQIndex]?.answer] || ''}
        onClose={() => setDeezerModalOpen(false)}
        onSelectTrack={handleDeezerTrackSelected}
      />

      {/* Admin Edit Player Modal */}
      <AdminPlayerModal
        isOpen={adminPlayerModalOpen}
        onClose={() => {
          setAdminPlayerModalOpen(false);
          setEditingPlayer(null);
        }}
        player={editingPlayer}
        onSave={handleAdminSavePlayer}
      />
    </>
  );
};
