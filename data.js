// data.js — derived topic metadata + zero-initialised user progress.
// The full question bank lives in syllabus.js (window.SYLLABUS).
//
// USER-PROGRESS DATA IS ZERO BY DEFAULT.
// A persistence layer (localStorage / backend) would replace the zero seeds
// below with the user's real history. Until then, every counter starts at 0
// and lists start empty — no fake "+19 pp" deltas or simulated sessions.

(function () {
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
    'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
    'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
    'XLI', 'XLII', 'XLIII', 'XLIV', 'XLV', 'XLVI', 'XLVII', 'XLVIII', 'XLIX', 'L',
    'LI', 'LII', 'LIII', 'LIV', 'LV', 'LVI', 'LVII', 'LVIII', 'LIX', 'LX',
    'LXI', 'LXII', 'LXIII', 'LXIV', 'LXV', 'LXVI', 'LXVII', 'LXVIII', 'LXIX', 'LXX'];

  const toTopic = (section, t) => ({
    id: `${section[0]}${t.num}`,            // c1, e12, …
    section,                                 // 'common' | 'specific'
    num: t.num,
    code: ROMAN[t.num] || String(t.num),
    title: t.title,
    count: t.questions.length,
    accuracy: 0,                             // ← all zero until the user studies
    answered: 0,                             // questions seen for this tema
  });

  window.TOPICS_COMMON = (window.SYLLABUS?.common || []).map(t => toTopic('common', t));
  window.TOPICS_SPECIFIC = (window.SYLLABUS?.specific || []).map(t => toTopic('specific', t));
  window.TOPICS = [...window.TOPICS_COMMON, ...window.TOPICS_SPECIFIC];

  window.getTema = (section, num) => {
    const list = section === 'common' ? window.SYLLABUS.common : window.SYLLABUS.specific;
    return list.find(t => t.num === num) || null;
  };

  window.getTopicMeta = (section, num) =>
    (section === 'common' ? window.TOPICS_COMMON : window.TOPICS_SPECIFIC).find(t => t.num === num);

  window.totalQuestions = () => window.TOPICS.reduce((s, t) => s + t.count, 0);

  // Ephemeral nav state — which tema/question Study should open with.
  window.appState = {
    studyTema: { section: 'specific', num: 1 },
    studyIdx: 0,
  };
  window.setStudyTema = (section, num) => {
    window.appState.studyTema = { section, num };
    window.appState.studyIdx = 0;
    window.dispatchEvent(new Event('appstate'));
  };
  window.setStudyIdx = (idx) => {
    window.appState.studyIdx = idx;
    window.dispatchEvent(new Event('appstate'));
  };
})();

// ─── User progress (all zero) ────────────────────────────────────────────────
window.STATS = {
  answered: 0,
  correct: 0,
  accuracy: 0,
  streakDays: 0,
  predictedGrade: null,         // null → display "—"
  totalQuestions: window.totalQuestions(),
  hoursStudied: 0,
  weekly: [],                   // empty until user has studied at least a week
  recentSessions: [],
  examsTaken: 0,
};

window.FAILED_QUESTIONS = [];

// Exam date — configurable. Set to an ISO date to enable the "X días para la
// oposición" countdown on the dashboard. Leave null to hide it.
window.EXAM_DATE = null;

// Now that TOPICS_* and STATS exist, ask the store to apply any saved progress
// from localStorage. This populates per-tema accuracy, the failed-questions
// list, the weekly sparkline, the streak, etc.
if (window.Store) window.Store.refreshDerived();

// Sample question used by the (mock) Exam in-progress screen — pick a real one
// from the bank so the screen has real content.
window.SAMPLE_QUESTION = (() => {
  const tema = window.getTema('specific', 22) || window.SYLLABUS.specific[0];
  return tema?.questions?.[0] || {
    prompt: '(sin preguntas cargadas)', options: [], correct: 'a', source: '',
  };
})();

// Exam navigator data — all questions start as pending. The Exam in-progress
// screen is currently a static prototype; once the real exam flow lands this
// will reflect actual progress.
window.EXAM_NAV = (() => {
  const arr = [];
  for (let i = 1; i <= 100; i++) arr.push({ n: i, state: 'pending' });
  return arr;
})();
