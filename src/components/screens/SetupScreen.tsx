import React, { useState } from 'react';
import { GameType, Question } from '../../types';
import { GAMES, ts } from '../../lib/constants';
import { generateQuestions } from '../../lib/claude';
import { extractDeezerTrackId } from '../../lib/deezer';

interface SetupScreenProps {
  gameType: GameType;
  onBack: () => void;
  onLaunchGame: (title: string, questions: Question[]) => Promise<void>;
  onSaveGame: (title: string, questions: Question[]) => Promise<void>;
  onOpenSavedModal: () => void;
  onOpenDeezerModal: (questionIndex: number) => void;
  questions: Question[];
  onQuestionsChange: (qs: Question[]) => void;
}

const LOADING_MSGS = [
  'Xav fouille ses archives… 🎵',
  'Xav choisit les pièges vicieux… 😈',
  'Xav calibre la difficulté… 🎯',
  'Xav prépare les fausses pistes… 🤪',
  'Xav finalise… 🎶',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  gameType,
  onBack,
  onLaunchGame,
  onSaveGame,
  onOpenSavedModal,
  onOpenDeezerModal,
  questions,
  onQuestionsChange,
}) => {
  const g = GAMES[gameType] || GAMES.blindtest;
  const isQuiz = gameType === 'quiz';
  const isSpeed = gameType === 'speed';
  const isSurvie = gameType === 'survie';
  const isIntrus = gameType === 'intrus';
  const isBlitz = gameType === 'blitz';
  const isArcade = isSpeed || isSurvie || isIntrus || isBlitz;
  const isQuizLike = isQuiz || isArcade;

  const [title, setTitle] = useState(`${g.name} Piza-House`);
  const [theme, setTheme] = useState('');
  const [diff, setDiff] = useState('facile');
  const [count, setCount] = useState(10);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  let placeholder = 'Ex : variété FR 80s, Pop 2010…';
  if (isSpeed) placeholder = 'Ex : Hits 2020, Cinéma, Drapeaux, Marvel…';
  else if (isSurvie) placeholder = 'Ex : Science, Années 90, Gaming, Géographie…';
  else if (isIntrus) placeholder = 'Ex : Disney, Marques, Capitales, Gastronomie…';
  else if (isBlitz) placeholder = 'Ex : Pop Culture, Séries TV, Animaux, Histoire…';
  else if (isQuiz) placeholder = 'Ex : Histoire de France, Cinéma, Géo…';

  const handleAiGenerate = async () => {
    if (!theme.trim()) return;
    setLoadingAi(true);
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MSGS.length);
    }, 2000);

    try {
      const generated = await generateQuestions(gameType, theme.trim(), count, diff);
      setTitle(theme.trim().charAt(0).toUpperCase() + theme.trim().slice(1));
      if (isQuizLike) {
        await onLaunchGame(
          theme.trim().charAt(0).toUpperCase() + theme.trim().slice(1),
          generated
        );
      } else {
        onQuestionsChange(generated);
      }
    } catch (err) {
      alert('Erreur lors de la génération avec l\'IA. Vérifie ta connexion ou réessaie.');
      console.error(err);
    } finally {
      clearInterval(interval);
      setLoadingAi(false);
    }
  };

  const handleSave = async () => {
    if (!questions.length) {
      alert('Ajoute au moins une manche !');
      return;
    }
    await onSaveGame(title, questions);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLaunchManual = async () => {
    const valid = questions.filter(
      (q) => q.url.trim() && extractDeezerTrackId(q.url) && q.choices.every((c) => c.trim())
    );
    if (!valid.length) {
      alert('Ajoute au moins une manche valide (lien Deezer + 4 artistes) !');
      return;
    }
    await onLaunchGame(title, valid);
  };

  const addManualQuestion = () => {
    const newQ: Question = {
      id: ts() + Math.random(),
      url: '',
      title: '',
      choices: ['', '', '', ''],
      answer: 0,
    };
    onQuestionsChange([...questions, newQ]);
  };

  const deleteQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  const updateQuestionUrl = (index: number, url: string) => {
    const next = [...questions];
    next[index] = { ...next[index], url };
    onQuestionsChange(next);
  };

  const updateChoice = (qIdx: number, cIdx: number, val: string) => {
    const next = [...questions];
    const choices = [...next[qIdx].choices];
    choices[cIdx] = val;
    next[qIdx] = { ...next[qIdx], choices };
    onQuestionsChange(next);
  };

  const setCorrectAnswer = (qIdx: number, cIdx: number) => {
    const next = [...questions];
    next[qIdx] = { ...next[qIdx], answer: cIdx };
    onQuestionsChange(next);
  };

  const L = ['A', 'B', 'C', 'D'];

  return (
    <div className="wrap">
      <div className="setup-head">
        <button type="button" className="btn-back" onClick={onBack}>
          ←
        </button>
        <h2>
          {g.emoji} Nouveau {g.name}
        </h2>
      </div>

      <div className="flex gap-2 mb-3.5">
        <input
          className="inp mb-0 flex-1"
          placeholder="Nom de la partie"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="button"
          title="Parties enregistrées"
          className="btn-deezer rounded-xl px-4"
          onClick={onOpenSavedModal}
        >
          📂
        </button>
        {!isQuizLike && (
          <button
            type="button"
            title="Sauvegarder"
            className="btn-deezer rounded-xl px-4"
            onClick={handleSave}
          >
            {saveSuccess ? '✅' : '💾'}
          </button>
        )}
      </div>

      {/* AI Panel */}
      <div className="ai-panel">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✨</span>
          <div className="font-extrabold text-sm">Générer avec l'IA (Xav)</div>
        </div>

        <div className="lbl">Thème</div>
        <input
          className="inp"
          placeholder={placeholder}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAiGenerate();
          }}
        />

        <div className="grid grid-cols-1 gap-3.5 mb-3.5">
          <div>
            <div className="lbl">Difficulté</div>
            <div className="pill-row">
              <button
                type="button"
                className={`pill ${diff === 'facile' ? 'active' : ''}`}
                onClick={() => setDiff('facile')}
              >
                😊 Facile
              </button>
              <button
                type="button"
                className={`pill ${diff === 'moyen' ? 'active' : ''}`}
                onClick={() => setDiff('moyen')}
              >
                🎯 Moyen
              </button>
              <button
                type="button"
                className={`pill ${diff === 'difficile' ? 'active' : ''}`}
                onClick={() => setDiff('difficile')}
              >
                🔥 Difficile
              </button>
            </div>
          </div>

          <div>
            <div className="lbl">{isQuizLike ? 'Questions' : 'Manches'}</div>
            <div className="pill-row">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pill ${count === n ? 'active' : ''}`}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingAi ? (
          <div className="text-center py-4">
            <span className="spin-icon">⏳</span>
            <div className="text-xs text-white/70 mt-2 font-bold">
              {LOADING_MSGS[loadingMsgIdx]}
            </div>
          </div>
        ) : isQuizLike ? (
          <button
            type="button"
            className="btn btn-primary mb-0"
            onClick={handleAiGenerate}
          >
            ✨ Créer la partie
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary mb-0"
            onClick={handleAiGenerate}
          >
            ✨ Générer les manches
          </button>
        )}
      </div>

      {/* Manual questions (Blind test) */}
      {!isQuizLike && (
        <div>
          <div className="divider">ou ajoute à la main</div>

          <div className="setup-questions">
            {questions.map((q, i) => {
              const trackId = extractDeezerTrackId(q.url);
              return (
                <div key={q.id || i} className="q-card">
                  <div className="q-head">
                    <span className="q-num">
                      🎵 Manche {i + 1}
                      {q.title ? ` — ${q.title}` : ''}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="q-del"
                        onClick={() => deleteQuestion(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="deezer-row">
                    <input
                      className="inp mb-0 flex-1"
                      placeholder="🔗 Lien Deezer"
                      value={q.url}
                      onChange={(e) => updateQuestionUrl(i, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-deezer"
                      onClick={() => onOpenDeezerModal(i)}
                    >
                      🔍
                    </button>
                  </div>

                  {q.url && trackId ? (
                    <div className="deezer-wrap">
                      <iframe
                        title={`Deezer player ${i + 1}`}
                        scrolling="no"
                        frameBorder="0"
                        allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"
                        src={`https://widget.deezer.com/widget/dark/track/${trackId}`}
                        style={{ width: '100%', height: '80px', borderRadius: '12px' }}
                      />
                    </div>
                  ) : q.url ? (
                    <div className="deezer-warn">⚠️ URL invalide</div>
                  ) : null}

                  <p className="text-[11px] text-white/70 font-bold mb-2">
                    ✅ = bonne réponse
                  </p>

                  {q.choices.map((c, ci) => (
                    <div key={ci} className="choice-row">
                      <button
                        type="button"
                        className={`choice-mark ${q.answer === ci ? 'correct' : ''}`}
                        onClick={() => setCorrectAnswer(i, ci)}
                      >
                        {q.answer === ci ? '✅' : L[ci]}
                      </button>
                      <input
                        className="inp mb-0 flex-1 min-w-0"
                        placeholder={`Artiste ${ci + 1}`}
                        value={c}
                        onChange={(e) => updateChoice(i, ci, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addManualQuestion}
          >
            ➕ Ajouter une manche
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={handleLaunchManual}
          >
            🚀 Ouvrir la salle !
          </button>
        </div>
      )}
    </div>
  );
};
