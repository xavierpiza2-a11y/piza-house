import { FUNNY_EMOJIS, randItem, ts } from './constants';
import { GameType, Question } from '../types';

export const DEFAULT_PROMPTS = {
  interlude: `[SEED:{seed}] Manche {round} terminée. Bonne réponse : "{answer}".
Joueurs ayant trouvé ({correct}/{total}) : {found}
Scores : {scores}
Leader : {leader} | Lanterne rouge : {loser}

Génère un commentaire COURT (1 phrase, 15 mots max). Direct et drôle.
JAMAIS "Quelle manche !" ou "Bien joué !".
Réponds UNIQUEMENT avec ce JSON :
{"comment":"ta phrase","emoji":"1 emoji"}`,
  finalScores: `[SEED:{seed}] Blind test terminé ! Classement :
{ranking}
Écart 1er/dernier : {ecart} pts

Commentaire global : 1 phrase (15 mots), résume la soirée avec humour.
Chaque joueur : 1 phrase courte selon son rang.
Réponds UNIQUEMENT avec ce JSON :
{"globalComment":"phrase","playerComments":{playerIds}}`,
};

export const DEFAULT_PROMPTS_QUIZ = {
  interlude: `[SEED:{seed}] Question {round} terminée. Bonne réponse : "{answer}".
Joueurs ayant trouvé ({correct}/{total}) : {found}
Scores : {scores}
Leader : {leader} | Lanterne rouge : {loser}

Génère un commentaire COURT (1 phrase, 15 mots max). Direct et drôle.
JAMAIS "Bonne question !" ou "Bien joué !".
Réponds UNIQUEMENT avec ce JSON :
{"comment":"ta phrase","emoji":"1 emoji"}`,
  finalScores: `[SEED:{seed}] Quiz terminé ! Classement :
{ranking}
Écart 1er/dernier : {ecart} pts

Commentaire global : 1 phrase (15 mots), résume la soirée avec humour.
Chaque joueur : 1 phrase courte selon son rang.
Réponds UNIQUEMENT avec ce JSON :
{"globalComment":"phrase","playerComments":{playerIds}}`,
};

export async function callClaude(prompt: string, options: { system?: string; max_tokens?: number; temperature?: number } = {}) {
  const {
    system = `Tu es Xav, le présentateur légendaire et hilarant d'une soirée jeux en famille.
Tu as un humour décapant, tu taquines les joueurs par leur prénom, tu fais des comparaisons absurdes.
Chaque commentaire est UNIQUE. Réponds TOUJOURS en JSON valide uniquement, sans backticks ni markdown.`,
    max_tokens = 1000,
    temperature = 1,
  } = options;

  try {
    const requestPayload = {
      model: 'claude-sonnet-4-6',
      max_tokens,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }],
    };

    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const data = await r.json();
    if (data.error) {
      console.error('Claude API error:', data.error);
      return null;
    }
    const text = data.content?.find((c: any) => c.type === 'text')?.text || '';
    if (!text) return null;
    let clean = text.trim();
    if (clean.startsWith('`')) {
      clean = clean.slice(clean.indexOf('\n') + 1);
    }
    const fenceEnd = clean.lastIndexOf('`');
    if (fenceEnd > 0 && clean.slice(fenceEnd - 2, fenceEnd + 1) === '```') {
      clean = clean.slice(0, fenceEnd - 2).trim();
    }
    const arrStart = clean.indexOf('[');
    const arrEnd = clean.lastIndexOf(']');
    if (arrStart > -1 && arrEnd > arrStart) {
      clean = clean.slice(arrStart, arrEnd + 1);
    } else {
      const objStart = clean.indexOf('{');
      const objEnd = clean.lastIndexOf('}');
      if (objStart > -1 && objEnd > objStart) {
        clean = clean.slice(objStart, objEnd + 1);
      }
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error('Claude Worker:', e);
    return null;
  }
}

export async function generateQuestions(
  gameType: GameType,
  theme: string,
  count: number = 10,
  diff: string = 'facile'
): Promise<Question[]> {
  const seed = Math.random().toString(36).slice(2, 8);
  const isQuiz = gameType === 'quiz';
  const isSpeed = gameType === 'speed';
  const isSurvie = gameType === 'survie';
  const isIntrus = gameType === 'intrus';
  const isBlitz = gameType === 'blitz';
  const isArcade = isSpeed || isSurvie || isIntrus || isBlitz;
  const isQuizLike = isQuiz || isArcade;

  let prompt = '';
  let system = '';

  if (isIntrus) {
    prompt = `[SEED:${seed}]
Génère exactement ${count} questions pour le jeu "L'Intrus". Thème : "${theme}". Difficulté : ${diff}.
Dans chaque question, 3 choix sont des mots/termes qui appartiennent au thème, et 1 seul choix est L'INTRUS (le piège hors-sujet).
Le but du joueur est de repérer et cliquer sur L'INTRUS parmi 4 mots !
Pour chaque question :
- "question" : Le thème du groupe (ex: "Films de Disney — Trouve l'intrus !" ou "Capitales du monde — Quel est l'intrus ?")
- "answer" : L'INTRUS exact (la seule mauvaise réponse/le seul mot intrus)
- "choices" : tableau de 3 mots/termes VRAIS qui appartiennent bien au groupe
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown.
Format : [{"question":"...","answer":"L'intrus","choices":["MotVrai1","MotVrai2","MotVrai3"]},...]`;
    system = "Tu es un générateur de quiz d'intrus. Tu réponds UNIQUEMENT avec un tableau JSON valide.";
  } else if (isQuizLike) {
    let modeInstruction = '';
    if (isSpeed) modeInstruction = 'Questions très courtes et percutantes, idéales pour un chrono de 5s.';
    if (isSurvie) modeInstruction = 'Questions à difficulté progressive avec des pièges pour le mode Mort Subite.';
    if (isBlitz) modeInstruction = 'Questions stimulantes et variées pour enchaîner les combos.';

    const diffQ: Record<string, string> = {
      facile: 'Questions faciles, grand public.',
      moyen: 'Difficulté moyenne, bonne culture générale.',
      difficile: 'Questions difficiles, pointues.',
    };
    prompt = `[SEED:${seed}]
Génère exactement ${count} questions de quiz. Thème : "${theme}". Difficulté : ${diff}. ${diffQ[diff] || ''} ${modeInstruction}
Pour chaque question :
- "question" : l'énoncé
- "answer" : la bonne réponse, courte et précise
- "choices" : tableau de 3 MAUVAISES réponses (sans la bonne), plausibles
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown.
Format : [{"question":"...","answer":"...","choices":["Faux1","Faux2","Faux3"]},...]
Génère exactement ${count} objets.`;
    system = 'Tu es un générateur de questions de quiz. Tu réponds UNIQUEMENT avec un tableau JSON valide.';
  } else {
    const diffB: Record<string, string> = {
      facile: 'Uniquement des hits très connus.',
      moyen: 'Mélange de hits connus et de titres moins évidents.',
      difficile: 'Chansons moins connues, faces B.',
    };
    prompt = `[SEED:${seed}]
Génère exactement ${count} questions pour un blind test musical. Thème : "${theme}". Difficulté : ${diff}. ${diffB[diff] || ''}
Pour chaque question :
- "artist" : nom exact de l'artiste (bonne réponse)
- "title" : titre exact de la chanson
- "choices" : tableau de 3 MAUVAISES réponses (sans la bonne), variées et amusantes
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown.
Format : [{"artist":"Nom","title":"Titre","choices":["Faux1","Faux2","Faux3"]},...]
Génère exactement ${count} objets.`;
    system =
      'Tu es un générateur de questions de blind test musical. Tu réponds UNIQUEMENT avec un tableau JSON valide, sans texte, sans markdown, sans backticks.';
  }

  const result = await callClaude(prompt, { system, max_tokens: 4000, temperature: 0.9 });
  if (!Array.isArray(result) || !result.length) {
    throw new Error('Réponse invalide de l\'IA');
  }

  return result.slice(0, count).map((q: any) => {
    const pos = Math.floor(Math.random() * 4);
    const choices = [...(q.choices || ['???', '???', '???'])];
    while (choices.length < 3) choices.push('???');

    if (isQuizLike) {
      choices.splice(pos, 0, q.answer);
      return {
        id: ts() + Math.random(),
        url: '',
        title: q.question || '',
        choices,
        answer: pos,
      };
    }
    choices.splice(pos, 0, q.artist);
    return {
      id: ts() + Math.random(),
      url: '',
      title: q.title || '',
      choices,
      answer: pos,
    };
  });
}

export async function generateInterludeComment(
  roundNum: number,
  scores: Record<string, number>,
  players: { id: string; name: string }[],
  correctAnswer: string,
  answeredCorrectly: string[],
  gameType: GameType,
  promptTemplate?: string
) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const leader = sorted[0];
  const loser = sorted[sorted.length - 1];
  const nbCorrect = answeredCorrectly.length;
  const seed = Math.random().toString(36).slice(2, 6);
  const tpl = promptTemplate || (gameType === 'quiz' ? DEFAULT_PROMPTS_QUIZ.interlude : DEFAULT_PROMPTS.interlude);

  const built = tpl
    .replace(/\{seed\}/g, seed)
    .replace(/\{round\}/g, String(roundNum))
    .replace(/\{answer\}/g, correctAnswer)
    .replace(/\{correct\}/g, String(nbCorrect))
    .replace(/\{total\}/g, String(players.length))
    .replace(/\{found\}/g, answeredCorrectly.join(', ') || 'absolument personne 💀')
    .replace(/\{scores\}/g, sorted.map((p) => `${p.name} ${scores[p.id] || 0}pts`).join(' | '))
    .replace(/\{leader\}/g, leader?.name || '?')
    .replace(/\{loser\}/g, loser?.name || '?');

  const res = await callClaude(built);
  if (res?.comment) return res;
  return {
    comment: `${correctAnswer}… ${
      nbCorrect === 0 ? "et personne n'a trouvé. La honte va durer." : 'Bien vu à ceux qui ont su !'
    }`,
    emoji: randItem(FUNNY_EMOJIS),
  };
}

export async function generateFinalComments(
  players: { id: string; name: string }[],
  scores: Record<string, number>,
  gameType: GameType,
  promptTemplate?: string
) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const seed = Math.random().toString(36).slice(2, 6);
  const ecart =
    sorted.length > 1 ? (scores[sorted[0].id] || 0) - (scores[sorted[sorted.length - 1].id] || 0) : 0;
  const tpl = promptTemplate || (gameType === 'quiz' ? DEFAULT_PROMPTS_QUIZ.finalScores : DEFAULT_PROMPTS.finalScores);

  const built = tpl
    .replace(/\{seed\}/g, seed)
    .replace(
      /\{ranking\}/g,
      sorted.map((p, i) => `${i + 1}. ${p.name} : ${scores[p.id] || 0} pts`).join('\n')
    )
    .replace(/\{ecart\}/g, String(ecart))
    .replace(
      /\{playerIds\}/g,
      '{' + sorted.map((p) => `"${p.id}":"commentaire pour ${p.name}"`).join(',') + '}'
    );

  return await callClaude(built);
}
