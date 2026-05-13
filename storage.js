// storage.js — localStorage persistence + derived stats.
//
// Persists the user's profile + per-question history under a single
// localStorage key. Progress is namespaced by user id (the Google `sub` for
// authenticated users, `'guest'` otherwise), so multiple accounts on the same
// browser don't collide.
//
// All progress fields on window.TOPICS_* and window.STATS are RECOMPUTED from
// `perQuestion` on every change, so derived numbers never go stale.

(function () {
  const KEY = 'opositar:v1';

  // ─── State (in-memory; flushed to localStorage on every change) ────────────
  const empty = () => ({
    user: null,          // { sub, email, name, picture, iat } or null
    progress: {},        // userId → { perQuestion, exams }
  });
  let state = empty();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...empty(), ...parsed };
      }
    } catch { /* corrupt → ignore */ }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('[storage] save failed:', e); }
  }

  // ─── User identity ─────────────────────────────────────────────────────────
  function user() { return state.user; }
  function userId() { return state.user?.sub || 'guest'; }
  function isAuthed() { return !!state.user; }
  function setUser(u) {
    state.user = u;
    // First-time upgrade from guest → authenticated: if the user has been
    // using the app as a guest and now logs in for the first time, carry
    // their progress over so they don't lose it. Only happens when the new
    // user's bucket is empty — repeated logins don't re-merge.
    if (u && !u.guest && state.progress.guest) {
      const guest = state.progress.guest;
      const target = state.progress[u.sub];
      const guestHasData = (guest.perQuestion && Object.keys(guest.perQuestion).length) || (guest.exams && guest.exams.length);
      const targetEmpty = !target || ((!target.perQuestion || !Object.keys(target.perQuestion).length) && (!target.exams || !target.exams.length));
      if (guestHasData && targetEmpty) {
        state.progress[u.sub] = {
          perQuestion: { ...(guest.perQuestion || {}) },
          exams: [...(guest.exams || [])],
        };
        delete state.progress.guest;
      }
    }
    save();
    refreshDerived();
    fire('user');
  }
  function clearUser() {
    state.user = null;
    save();
    refreshDerived();
    fire('user');
  }

  function ensureBucket() {
    const id = userId();
    if (!state.progress[id]) {
      state.progress[id] = { perQuestion: {}, exams: [] };
    }
    return state.progress[id];
  }

  // Key format: c12-3  =  Común tema 12, question index 3.
  // e12-3  =  Específico tema 12, question index 3.
  function qKey(section, num, qIdx) {
    const letter = section === 'common' ? 'c' : 'e';
    return `${letter}${num}-${qIdx}`;
  }

  // ─── Record an answer ──────────────────────────────────────────────────────
  function recordAnswer(section, num, qIdx, optId, correctId) {
    const bucket = ensureBucket();
    const k = qKey(section, num, qIdx);
    const correct = optId === correctId;
    const cur = bucket.perQuestion[k] || { attempts: 0, correctStreak: 0, wrongStreak: 0 };
    cur.attempts += 1;
    cur.lastAnswer = optId;
    cur.lastCorrect = correct;
    cur.lastAt = new Date().toISOString();
    if (correct) {
      cur.correctStreak = (cur.correctStreak || 0) + 1;
      cur.wrongStreak = 0;
    } else {
      cur.wrongStreak = (cur.wrongStreak || 0) + 1;
      cur.correctStreak = 0;
    }
    bucket.perQuestion[k] = cur;
    save();
    refreshDerived();
    fire('answer');
  }

  function setMarked(section, num, qIdx, marked) {
    const bucket = ensureBucket();
    const k = qKey(section, num, qIdx);
    const cur = bucket.perQuestion[k] || { attempts: 0, correctStreak: 0, wrongStreak: 0 };
    cur.marked = !!marked;
    bucket.perQuestion[k] = cur;
    save();
    refreshDerived();
    fire('marked');
  }

  function questionState(section, num, qIdx) {
    const bucket = ensureBucket();
    return bucket.perQuestion[qKey(section, num, qIdx)] || null;
  }

  // ─── Exam history ──────────────────────────────────────────────────────────
  function addExam(record) {
    const bucket = ensureBucket();
    bucket.exams.unshift(record);
    bucket.exams = bucket.exams.slice(0, 50);
    save();
    refreshDerived();
    fire('exam');
  }
  function exams() { return ensureBucket().exams; }

  // ─── Bucket I/O (used by firebase-sync.js) ────────────────────────────────
  // Returns a plain object snapshot of the current user's bucket. Mutations
  // to the returned object do NOT affect the store; treat as immutable.
  function exportBucket() {
    const b = ensureBucket();
    return JSON.parse(JSON.stringify({
      perQuestion: b.perQuestion || {},
      exams: b.exams || [],
    }));
  }

  // Replace the current user's bucket. Used after a remote merge.
  // Fires 'storechange' with kind='remote' so the UI re-renders. Callers
  // that don't want this to bounce back as an upload should set their own
  // suppression flag before invoking (see firebase-sync.js).
  function importBucket(bucket) {
    state.progress[userId()] = {
      perQuestion: bucket.perQuestion || {},
      exams: Array.isArray(bucket.exams) ? bucket.exams : [],
    };
    save();
    refreshDerived();
    fire('remote');
  }

  // ─── Derived state ─────────────────────────────────────────────────────────
  function refreshDerived() {
    const bucket = ensureBucket();
    const Q = bucket.perQuestion;

    // Per-tema aggregates
    const byTema = {};
    let answered = 0, correct = 0;
    for (const k of Object.keys(Q)) {
      const v = Q[k];
      if (!v.attempts) continue;
      const m = k.match(/^([ce])(\d+)-(\d+)$/);
      if (!m) continue;
      const section = m[1] === 'c' ? 'common' : 'specific';
      const num = parseInt(m[2], 10);
      const teKey = `${section}-${num}`;
      if (!byTema[teKey]) byTema[teKey] = { answered: 0, correct: 0 };
      byTema[teKey].answered += 1;
      if (v.lastCorrect) byTema[teKey].correct += 1;
      answered += 1;
      if (v.lastCorrect) correct += 1;
    }

    // Apply to TOPICS_*
    for (const t of window.TOPICS_COMMON || []) {
      const b = byTema[`common-${t.num}`];
      t.answered = b?.answered || 0;
      t.accuracy = b?.answered ? b.correct / b.answered : 0;
    }
    for (const t of window.TOPICS_SPECIFIC || []) {
      const b = byTema[`specific-${t.num}`];
      t.answered = b?.answered || 0;
      t.accuracy = b?.answered ? b.correct / b.answered : 0;
    }

    // Aggregate STATS
    window.STATS.answered = answered;
    window.STATS.correct = correct;
    window.STATS.accuracy = answered ? correct / answered : 0;
    window.STATS.examsTaken = bucket.exams.length;
    window.STATS.predictedGrade = predictGrade(answered, correct, bucket.exams);
    window.STATS.streakDays = computeStreak(Q);
    window.STATS.weekly = recentWeeklyAccuracy(Q, 12);

    // Failed-questions list (one-shot derived)
    window.FAILED_QUESTIONS = Object.keys(Q)
      .filter((k) => Q[k].lastCorrect === false)
      .map((k) => {
        const m = k.match(/^([ce])(\d+)-(\d+)$/);
        if (!m) return null;
        const section = m[1] === 'c' ? 'common' : 'specific';
        const num = parseInt(m[2], 10);
        const qIdx = parseInt(m[3], 10);
        const tema = window.getTema(section, num);
        const meta = window.getTopicMeta(section, num);
        const origQ = tema?.questions?.[qIdx];
        if (!origQ || !meta) return null;
        const v = Q[k];
        const label = m[1] === 'c' ? 'C' : 'E';
        return {
          id: `${label}${num}·${qIdx + 1}`,
          section, temaNum: num, qIdx,
          topic: `${section === 'common' ? 'Común' : 'Específico'} ${meta.code} · ${meta.title.split('.')[0].slice(0, 48)}`,
          ref: (origQ.source || '').replace(/\sPregunta\s/, ' P.'),
          prompt: origQ.prompt,
          failedTimes: v.wrongStreak || 1,
          lastFailed: relativeDate(v.lastAt),
          lastAt: v.lastAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.failedTimes - a.failedTimes || (b.lastAt > a.lastAt ? 1 : -1));
  }

  function predictGrade(answered, correct, exams) {
    // If we have at least one full simulacro, use the average of its score.
    if (exams.length > 0) {
      const avg = exams.slice(0, 5).reduce((s, e) => s + (e.score || 0), 0) / Math.min(5, exams.length);
      return Math.round(avg * 100) / 100;
    }
    // Otherwise derive a rough estimate from raw accuracy IF we have enough data.
    if (answered < 30) return null;
    const a = correct / answered;
    const grade = (a - (1 - a) * 0.33) * 10;
    return Math.max(0, Math.min(10, Math.round(grade * 10) / 10));
  }

  function dayKey(iso) {
    return iso ? iso.slice(0, 10) : null;
  }

  function computeStreak(Q) {
    const days = new Set();
    for (const k of Object.keys(Q)) {
      const d = dayKey(Q[k].lastAt);
      if (d) days.add(d);
    }
    if (days.size === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
      if (days.has(d)) streak += 1;
      else if (i === 0) continue; // tolerate "no activity today yet" only for today
      else break;
    }
    return streak;
  }

  function recentWeeklyAccuracy(Q, weeks) {
    // Bin attempts by ISO week (last `weeks` weeks). Returns ratio per week.
    const bins = new Array(weeks).fill(null).map(() => ({ a: 0, c: 0 }));
    const now = Date.now();
    for (const k of Object.keys(Q)) {
      const v = Q[k];
      if (!v.lastAt) continue;
      const ageDays = (now - Date.parse(v.lastAt)) / 86400000;
      const w = Math.floor(ageDays / 7);
      if (w < 0 || w >= weeks) continue;
      const idx = weeks - 1 - w;
      bins[idx].a += 1;
      if (v.lastCorrect) bins[idx].c += 1;
    }
    const out = bins.map(b => b.a ? b.c / b.a : null);
    // Trim leading nulls so chart starts at first active week
    while (out.length && out[0] === null) out.shift();
    // Replace remaining nulls with previous value
    let last = 0.5;
    return out.map(v => (v === null ? last : (last = v)));
  }

  function relativeDate(iso) {
    if (!iso) return '';
    const ms = Date.now() - Date.parse(iso);
    const d = Math.floor(ms / 86400000);
    if (d <= 0) return 'hoy';
    if (d === 1) return 'ayer';
    if (d < 7) return `hace ${d} días`;
    if (d < 30) return `hace ${Math.floor(d / 7)} sem.`;
    return `hace ${Math.floor(d / 30)} meses`;
  }

  // ─── Pub-sub ───────────────────────────────────────────────────────────────
  function fire(kind) {
    window.dispatchEvent(new CustomEvent('storechange', { detail: { kind } }));
  }

  // ─── Generate a random exam: one question per tema (105 total) ─────────────
  function generateExam() {
    const all = [...(window.TOPICS_COMMON || []), ...(window.TOPICS_SPECIFIC || [])];
    const picks = [];
    for (const t of all) {
      const tema = window.getTema(t.section, t.num);
      if (!tema || !tema.questions.length) continue;
      const qIdx = Math.floor(Math.random() * tema.questions.length);
      picks.push({ section: t.section, num: t.num, qIdx, code: t.code });
    }
    // Shuffle order
    for (let i = picks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [picks[i], picks[j]] = [picks[j], picks[i]];
    }
    return {
      id: 'sim-' + Date.now(),
      startedAt: new Date().toISOString(),
      durationMin: Math.max(60, Math.round(picks.length * 0.9)), // ~54s per question
      total: picks.length,
      picks,
    };
  }

  // ─── Boot ──────────────────────────────────────────────────────────────────
  window.Store = {
    load, save,
    user, userId, isAuthed, setUser, clearUser,
    recordAnswer, setMarked, questionState,
    addExam, exams,
    exportBucket, importBucket,
    refreshDerived, generateExam,
  };

  load();
})();
