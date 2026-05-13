// screen-exam.jsx — Real timed exam.
//
// One random question per tema → ~105 questions total. Timer counts down from
// 90 minutes (adjusts to ~0.9 min per question). Scoring follows the official
// rule: acierto × 1, fallo × −0.33, blanco 0 — then rescaled to a /10 grade.
// Exam history is persisted via window.Store.

function Exam({ go }) {
  const mobile = useMobile();
  useStoreVersion();

  // Phase: start → in-progress → result. The exam state object owns the
  // sampled questions, answers, timer, and final score once finished.
  const [exam, setExam] = React.useState(null);
  const [phase, setPhase] = React.useState('start');

  const begin = () => {
    const generated = window.Store.generateExam();
    if (!generated.picks.length) return;
    setExam({
      ...generated,
      answers: {},                                     // { questionIndex: 'a'|'b'|'c'|'d' }
      flags: {},                                       // { questionIndex: true }
      current: 0,
      endsAt: Date.now() + generated.durationMin * 60_000,
      finishedAt: null,
      score: null,
    });
    setPhase('progress');
  };

  const finish = () => {
    setExam((prev) => {
      if (!prev) return prev;
      const result = scoreExam(prev);
      const record = {
        id: prev.id,
        startedAt: prev.startedAt,
        finishedAt: new Date().toISOString(),
        durationMin: prev.durationMin,
        total: prev.total,
        ...result,
      };
      window.Store.addExam(record);
      // Also feed individual answers into the question history so they update
      // tema accuracy + the failed-questions list.
      for (let i = 0; i < prev.picks.length; i++) {
        const pick = prev.picks[i];
        const ans = prev.answers[i];
        if (!ans) continue;
        const tema = window.getTema(pick.section, pick.num);
        const q = tema?.questions[pick.qIdx];
        if (!q) continue;
        window.Store.recordAnswer(pick.section, pick.num, pick.qIdx, ans, q.correct);
      }
      return { ...prev, ...record };
    });
    setPhase('result');
  };

  if (phase === 'start') {
    return mobile ? <ExamStartMobile onBegin={begin} /> : <ExamStartDesktop onBegin={begin} />;
  }
  if (phase === 'progress' && exam) {
    return mobile
      ? <ExamInProgressMobile exam={exam} setExam={setExam} onFinish={finish} go={go} />
      : <ExamInProgressDesktop exam={exam} setExam={setExam} onFinish={finish} go={go} />;
  }
  if (phase === 'result' && exam) {
    return mobile
      ? <ExamResultMobile exam={exam} onAgain={() => { setExam(null); setPhase('start'); }} go={go} />
      : <ExamResultDesktop exam={exam} onAgain={() => { setExam(null); setPhase('start'); }} go={go} />;
  }
  return null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────
function scoreExam(exam) {
  let ok = 0, ko = 0, blank = 0;
  for (let i = 0; i < exam.picks.length; i++) {
    const pick = exam.picks[i];
    const ans = exam.answers[i];
    const tema = window.getTema(pick.section, pick.num);
    const q = tema?.questions[pick.qIdx];
    if (!q) { blank += 1; continue; }
    if (!ans) blank += 1;
    else if (ans === q.correct) ok += 1;
    else ko += 1;
  }
  const total = exam.picks.length;
  const netPoints = ok - ko * 0.33;                          // raw with penalty
  const score = Math.max(0, Math.round((netPoints / total) * 10 * 100) / 100);
  return { ok, ko, blank, score, total };
}

// ─── Timer hook ───────────────────────────────────────────────────────────
function useCountdown(endsAt, onExpire) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!endsAt) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [endsAt]);
  const remaining = Math.max(0, endsAt - now);
  React.useEffect(() => {
    if (endsAt && remaining === 0 && onExpire) onExpire();
  }, [remaining === 0]);
  return remaining;
}

function fmtClock(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return { h, m, s };
}

// ─── Start screens ─────────────────────────────────────────────────────────
function ExamStartDesktop({ onBegin }) {
  const exams = window.Store.exams();
  const numTemas = window.TOPICS.length;
  return (
    <div style={{ padding: 'clamp(32px, 5vw, 64px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Examen cronometrado</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'clamp(40px, 6vw, 80px)' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Simulacro · Convocatoria 2026</div>
          <h1 className="serif" style={{
            fontSize: 'clamp(42px, 5vw, 56px)', lineHeight: 1, margin: '0 0 24px',
            fontWeight: 400, letterSpacing: '-0.02em',
          }}>
            {numTemas} preguntas.<br/>
            <span style={{ color: 'var(--ink-2)' }}>Una por tema.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 480, margin: '0 0 32px' }}>
            El simulacro selecciona una pregunta al azar de cada uno de los {numTemas} temas
            (35 común + 70 específico) y las baraja. La corrección sigue la regla oficial:
            aciertos × 1, errores × −0,33, blancos 0.
          </p>

          <div className="card" style={{ padding: 0, maxWidth: 480 }}>
            {[
              ['Preguntas', `${numTemas} (una por tema, orden aleatorio)`],
              ['Tiempo', `${Math.max(60, Math.round(numTemas * 0.9))} minutos en cuenta atrás`],
              ['Corrección', 'Aciertos × 1 · Errores −0,33 · Blancos 0'],
              ['Nota de corte estimada', '6,50 (último año: 6,82)'],
            ].map(([k, v], i) => (
              <div key={k} style={{
                padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)', alignItems: 'center', gap: 14,
              }}>
                <span className="label-sm">{k}</span>
                <span style={{ fontSize: 13.5, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={onBegin}>
              <Icon name="timer" size={15} /> Comenzar examen
            </button>
          </div>
          <div className="label-sm" style={{ marginTop: 14 }}>
            Una vez iniciado, el cronómetro no se detiene.
          </div>
        </div>

        <div>
          <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '0 0 14px' }}>
            Distribución por bloque
          </h2>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div className="label-sm" style={{ marginBottom: 4 }}>
              35 preguntas del temario Común · 70 del Específico.
            </div>
            <div className="label-sm">
              Cada tema aporta exactamente una pregunta seleccionada al azar.
            </div>
          </div>

          <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '32px 0 14px' }}>
            Últimos simulacros
          </h2>
          {exams.length === 0 ? (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--ink-2)' }}>
              <div className="label-sm" style={{ fontStyle: 'italic' }}>
                Aún no has realizado ningún simulacro.
              </div>
            </div>
          ) : (
            <div className="card">
              {exams.slice(0, 5).map((s, i) => (
                <div key={s.id} style={{
                  padding: '14px 18px', display: 'grid', gridTemplateColumns: '70px 1fr 70px', gap: 14,
                  alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
                }}>
                  <span className="label-sm mono">{new Date(s.finishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  <span className="label-sm">✓ {s.ok} · ✗ {s.ko} · — {s.blank}</span>
                  <span className="num serif" style={{
                    fontSize: 18, textAlign: 'right',
                    color: s.score >= 6.5 ? 'var(--green)' : 'var(--ink)',
                  }}>{s.score.toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamStartMobile({ onBegin }) {
  const numTemas = window.TOPICS.length;
  return (
    <div style={{ padding: '8px 20px 24px' }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Simulacro · Convocatoria 2026</div>
      <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, margin: '0 0 16px', fontWeight: 400 }}>
        {numTemas} preguntas.<br/>
        <span style={{ color: 'var(--ink-2)' }}>Una por tema.</span>
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 24px' }}>
        Una pregunta al azar de cada uno de los {numTemas} temas, mezcladas.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        {[
          ['Preguntas',  `${numTemas} (una por tema)`],
          ['Tiempo',     `${Math.max(60, Math.round(numTemas * 0.9))} min`],
          ['Corrección', 'Acierto +1 · Fallo −0,33'],
          ['Corte',      '6,50'],
        ].map(([k, v], i) => (
          <div key={k} style={{
            padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
            borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)', alignItems: 'center', gap: 12,
          }}>
            <span className="label-sm">{k}</span>
            <span style={{ fontSize: 14, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
        onClick={onBegin}>
        <Icon name="timer" size={16} /> Comenzar examen
      </button>
      <div className="label-sm" style={{ marginTop: 12, textAlign: 'center' }}>
        Una vez iniciado, el cronómetro no se detiene.
      </div>
    </div>
  );
}

// ─── In-progress screens ───────────────────────────────────────────────────
function useCurrentQuestion(exam) {
  const pick = exam.picks[exam.current];
  const tema = window.getTema(pick.section, pick.num);
  const meta = window.getTopicMeta(pick.section, pick.num);
  const q = tema?.questions[pick.qIdx];
  return { pick, tema, meta, q };
}

function ExamInProgressDesktop({ exam, setExam, onFinish, go }) {
  const { q, meta, pick } = useCurrentQuestion(exam);
  const remaining = useCountdown(exam.endsAt, onFinish);
  const { h, m, s } = fmtClock(remaining);
  const total = exam.picks.length;
  const answered = Object.keys(exam.answers).length;
  const flagged = Object.keys(exam.flags).length;

  const setAnswer = (optId) => setExam((p) => ({ ...p, answers: { ...p.answers, [p.current]: optId } }));
  const toggleFlag = () => setExam((p) => {
    const next = { ...p.flags };
    if (next[p.current]) delete next[p.current]; else next[p.current] = true;
    return { ...p, flags: next };
  });
  const goTo = (i) => setExam((p) => ({ ...p, current: Math.max(0, Math.min(total - 1, i)) }));

  const onConfirmExit = () => {
    if (window.confirm('¿Salir y entregar examen? Las respuestas marcadas se corregirán.')) onFinish();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        padding: '14px 28px', borderBottom: '1px solid var(--rule)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--paper)', flexShrink: 0, gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Logo size={18} />
          <span className="serif" style={{ fontSize: 15 }}>Simulacro completo</span>
          <Pill tone="outline">{total} preguntas</Pill>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div className="label-sm">Tiempo restante</div>
          <div className="serif num" style={{ fontSize: 26, color: remaining < 5 * 60_000 ? 'var(--terra)' : 'var(--ink)', letterSpacing: '-0.01em' }}>
            {h}<span style={{ color: 'var(--ink-3)' }}>:</span>{m}<span style={{ color: 'var(--ink-3)' }}>:</span>{s}
          </div>
          <button className="btn btn-sm btn-primary" onClick={onConfirmExit}>Entregar examen</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', minHeight: 0 }}>
        <div style={{ overflow: 'auto', padding: '32px clamp(24px, 6vw, 80px)' }}>
          <div className="prose-narrow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
              <span className="eyebrow">Pregunta {exam.current + 1} de {total}</span>
              <span style={{ color: 'var(--ink-4)' }}>·</span>
              <Pill tone="outline">{pick.section === 'common' ? 'Común' : 'Esp.'} {meta.code}</Pill>
              {exam.flags[exam.current] && <Pill tone="ochre"><Icon name="flag" size={10} /> Marcada</Pill>}
            </div>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1.45, margin: '0 0 28px', fontWeight: 400 }}>
              {q?.prompt}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(q?.options || []).map((opt) => {
                const picked = exam.answers[exam.current] === opt.id;
                return (
                  <button key={opt.id} onClick={() => setAnswer(opt.id)} style={{
                    all: 'unset', cursor: 'pointer',
                    display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14, padding: '15px 18px',
                    border: `1px solid ${picked ? 'var(--ink)' : 'var(--rule)'}`, borderRadius: 5,
                    background: 'var(--card)',
                  }}>
                    <span className="mono" style={{
                      width: 24, height: 24, borderRadius: 3,
                      background: picked ? 'var(--ink)' : 'var(--paper-2)',
                      color: picked ? '#f3f0e8' : 'var(--ink-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 500,
                    }}>{opt.id}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5 }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>
            <div style={{
              marginTop: 24, padding: 14, background: 'var(--paper-2)', borderRadius: 5,
              fontSize: 12, color: 'var(--ink-2)', display: 'flex', justifyContent: 'space-between', gap: 12,
            }}>
              <span>En el examen no se muestra la respuesta hasta el final.</span>
              <span>−0,33 por fallo · 0 en blanco</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => goTo(exam.current - 1)} disabled={exam.current === 0}>
                <Icon name="arrow-l" size={13} /> Anterior
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={toggleFlag}>
                  <Icon name="flag" size={13} /> {exam.flags[exam.current] ? 'Desmarcar' : 'Marcar para revisar'}
                </button>
                <button className="btn btn-primary"
                  onClick={() => exam.current === total - 1 ? onConfirmExit() : goTo(exam.current + 1)}>
                  {exam.current === total - 1 ? 'Finalizar' : 'Siguiente'} <Icon name="arrow-r" size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside style={{
          borderLeft: '1px solid var(--rule)', padding: 20, background: 'var(--paper)', overflow: 'auto',
        }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Navegador</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5, marginBottom: 18 }}>
            {exam.picks.map((_, i) => {
              const isAnswered = exam.answers[i] != null;
              const isFlag = !!exam.flags[i];
              const isCur = i === exam.current;
              let bg = 'var(--card)', color = 'var(--ink-2)', border = 'var(--rule)';
              if (isAnswered) { bg = 'var(--ink)'; color = '#f3f0e8'; border = 'var(--ink)'; }
              if (isFlag)     { bg = 'var(--ochre-tint)'; color = 'var(--ochre)'; border = 'var(--ochre)'; }
              if (isCur)      { bg = 'var(--green)'; color = '#f3f0e8'; border = 'var(--green)'; }
              return (
                <button key={i} onClick={() => goTo(i)} style={{
                  all: 'unset', cursor: 'pointer',
                  height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 3, fontSize: 10.5, fontFamily: 'var(--mono)',
                  background: bg, color, border: `1px solid ${border}`,
                }}>{i + 1}</button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <Legend tone="ink" label="Respondidas" count={String(answered)} />
            <Legend tone="green" label="Actual" count="1" />
            <Legend tone="ochre" label="Marcadas" count={String(flagged)} />
            <Legend tone="outline" label="Pendientes" count={String(total - answered)} />
          </div>

          <hr className="hr-soft" style={{ margin: '0 0 18px' }} />

          <div className="eyebrow" style={{ marginBottom: 10 }}>Resumen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Stat label="Respondidas" value={`${answered}/${total}`} />
            <Stat label="Marcadas" value={String(flagged)} />
            <Stat label="Tema" value={meta ? `${pick.section === 'common' ? 'C' : 'E'} ${meta.code}` : '—'} />
            <Stat label="Restante" value={`${m}:${s}`} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Legend({ tone, label, count }) {
  const map = {
    ink: { bg: 'var(--ink)', border: 'var(--ink)' },
    green: { bg: 'var(--green)', border: 'var(--green)' },
    ochre: { bg: 'var(--ochre-tint)', border: 'var(--ochre)' },
    outline: { bg: 'var(--card)', border: 'var(--rule)' },
  }[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 12, height: 12, background: map.bg, border: `1px solid ${map.border}`, borderRadius: 2 }} />
        <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{label}</span>
      </div>
      <span className="num label-sm">{count}</span>
    </div>
  );
}

function ExamInProgressMobile({ exam, setExam, onFinish }) {
  const { q, meta, pick } = useCurrentQuestion(exam);
  const remaining = useCountdown(exam.endsAt, onFinish);
  const { h, m, s } = fmtClock(remaining);
  const total = exam.picks.length;
  const answered = Object.keys(exam.answers).length;

  const setAnswer = (optId) => setExam((p) => ({ ...p, answers: { ...p.answers, [p.current]: optId } }));
  const goTo = (i) => setExam((p) => ({ ...p, current: Math.max(0, Math.min(total - 1, i)) }));
  const toggleFlag = () => setExam((p) => {
    const next = { ...p.flags };
    if (next[p.current]) delete next[p.current]; else next[p.current] = true;
    return { ...p, flags: next };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 5,
      }}>
        <button onClick={() => { if (window.confirm('¿Entregar examen?')) onFinish(); }}
          style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
          <Icon name="x" size={18} color="var(--ink-2)" />
        </button>
        <div className="serif num" style={{ fontSize: 20, letterSpacing: '-0.01em',
          color: remaining < 5 * 60_000 ? 'var(--terra)' : 'var(--ink)' }}>
          {h}<span style={{ color: 'var(--ink-3)' }}>:</span>{m}<span style={{ color: 'var(--ink-3)' }}>:</span>{s}
        </div>
        <button onClick={toggleFlag} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
          <Icon name="flag" size={18} color={exam.flags[exam.current] ? 'var(--ochre)' : 'var(--ink-2)'} />
        </button>
      </div>

      <div style={{ padding: '12px 20px 6px', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="eyebrow">Pregunta {exam.current + 1} / {total}</span>
          <span className="label-sm">{answered} respondidas</span>
        </div>
        <div style={{ height: 2, background: 'var(--paper-2)', borderRadius: 2 }}>
          <div style={{ width: `${((exam.current + 1) / total) * 100}%`, height: '100%', background: 'var(--green)' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <Pill tone="outline">{pick.section === 'common' ? 'Común' : 'Esp.'} {meta?.code}</Pill>
        </div>
        <p className="serif" style={{ fontSize: 19, lineHeight: 1.4, margin: '0 0 16px' }}>
          {q?.prompt}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(q?.options || []).map((opt) => {
            const picked = exam.answers[exam.current] === opt.id;
            return (
              <button key={opt.id} onClick={() => setAnswer(opt.id)} style={{
                all: 'unset', cursor: 'pointer',
                display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, padding: '14px 14px',
                border: `1px solid ${picked ? 'var(--ink)' : 'var(--rule)'}`, borderRadius: 5,
                background: 'var(--card)',
              }}>
                <span className="mono" style={{
                  width: 24, height: 24, borderRadius: 3,
                  background: picked ? 'var(--ink)' : 'var(--paper-2)',
                  color: picked ? '#f3f0e8' : 'var(--ink-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 500,
                }}>{opt.id}</span>
                <span style={{ fontSize: 15, lineHeight: 1.45 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--rule)', background: 'var(--card)',
        display: 'flex', gap: 8,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button className="btn" style={{ padding: 12 }} onClick={() => goTo(exam.current - 1)}
          disabled={exam.current === 0}>
          <Icon name="arrow-l" size={15} />
        </button>
        <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => exam.current === total - 1
            ? (window.confirm('¿Entregar examen?') && onFinish())
            : goTo(exam.current + 1)}>
          {exam.current === total - 1 ? 'Finalizar' : 'Siguiente'} <Icon name="arrow-r" size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Result screens ────────────────────────────────────────────────────────
function ExamResultDesktop({ exam, onAgain, go }) {
  const elapsed = (Date.parse(exam.finishedAt) - Date.parse(exam.startedAt)) / 1000;
  const elapsedMin = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`;

  // Per-section breakdown (one row per Roman section heading: Común / Específico).
  // For deeper insight users can click into Stats / Repaso.
  const okBySection = { common: 0, specific: 0 };
  const koBySection = { common: 0, specific: 0 };
  for (let i = 0; i < exam.picks.length; i++) {
    const pick = exam.picks[i];
    const ans = exam.answers[i];
    if (!ans) continue;
    const tema = window.getTema(pick.section, pick.num);
    const q = tema?.questions[pick.qIdx];
    if (!q) continue;
    if (ans === q.correct) okBySection[pick.section] += 1;
    else koBySection[pick.section] += 1;
  }
  const totalCommon = exam.picks.filter(p => p.section === 'common').length;
  const totalSpec = exam.picks.filter(p => p.section === 'specific').length;

  return (
    <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(24px, 5vw, 80px)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 36, gap: 14, flexWrap: 'wrap',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Simulacro · {new Date(exam.finishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 40px)', lineHeight: 1.05, margin: 0, fontWeight: 400 }}>
            Resultado del examen
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => go('review')}>
            <Icon name="book" size={14} /> Ver falladas
          </button>
          <button className="btn btn-primary" onClick={onAgain}>Nuevo simulacro</button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2fr)', gap: 32, marginBottom: 36,
      }}>
        <div className="card" style={{
          padding: 36, background: 'linear-gradient(180deg, var(--green-tint), var(--card))',
        }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Nota final</div>
          <div className="serif num" style={{
            fontSize: 'clamp(80px, 10vw, 112px)', lineHeight: 1, letterSpacing: '-0.04em',
            color: exam.score >= 6.5 ? 'var(--green)' : 'var(--ink)',
          }}>{exam.score.toFixed(2).replace('.', ',')}</div>
          <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 8 }}>
            Sobre 10 · Corte estimado 6,50
          </div>
          <hr className="hr-soft" style={{ margin: '24px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Stat label="Aciertos" value={String(exam.ok)} tone="green" />
            <Stat label="Fallos" value={String(exam.ko)} />
            <Stat label="Blancos" value={String(exam.blank)} />
          </div>
        </div>

        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20,
          }}>
            <KPI label="Tiempo empleado" value={elapsedMin} sub={`de ${String(exam.durationMin).padStart(2, '0')}:00`} />
            <KPI label="Aciertos Común"
              value={`${okBySection.common}/${totalCommon}`}
              sub={`${totalCommon ? Math.round(okBySection.common / totalCommon * 100) : 0}%`} />
            <KPI label="Aciertos Específico"
              value={`${okBySection.specific}/${totalSpec}`}
              sub={`${totalSpec ? Math.round(okBySection.specific / totalSpec * 100) : 0}%`} />
          </div>

          <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '0 0 14px' }}>
            Preguntas falladas
          </h2>
          <div className="card" style={{ padding: 22, textAlign: 'center' }}>
            <div className="label-sm" style={{ marginBottom: 12 }}>
              {exam.ko === 0
                ? 'Sin fallos en este simulacro.'
                : `${exam.ko} ${exam.ko === 1 ? 'pregunta fallada' : 'preguntas falladas'} añadidas a tu Repaso.`}
            </div>
            {exam.ko > 0 && (
              <button className="btn btn-primary" onClick={() => go('review')}>
                Repasarlas <Icon name="arrow-r" size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, tone }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="label-sm">{label}</div>
      <div className="serif num" style={{
        fontSize: 22, margin: '4px 0 2px', color: tone === 'ochre' ? 'var(--ochre)' : 'var(--ink)',
      }}>{value}</div>
      <div className="label-sm" style={{ color: 'var(--ink-3)' }}>{sub}</div>
    </div>
  );
}

function ExamResultMobile({ exam, onAgain, go }) {
  return (
    <div style={{ padding: '12px 20px 24px' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Simulacro · {new Date(exam.finishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
      </div>
      <h1 className="serif" style={{ fontSize: 28, margin: '0 0 18px', fontWeight: 400 }}>
        Resultado
      </h1>

      <div className="card" style={{
        padding: 24, marginBottom: 16, background: 'linear-gradient(180deg, var(--green-tint), var(--card))',
      }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Nota final</div>
        <div className="serif num" style={{
          fontSize: 80, lineHeight: 1, letterSpacing: '-0.04em',
          color: exam.score >= 6.5 ? 'var(--green)' : 'var(--ink)',
        }}>{exam.score.toFixed(2).replace('.', ',')}</div>
        <div className="label-sm" style={{ marginTop: 8 }}>Sobre 10 · Corte 6,50</div>
        <hr className="hr-soft" style={{ margin: '20px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <Stat label="Aciertos" value={String(exam.ok)} tone="green" />
          <Stat label="Fallos" value={String(exam.ko)} />
          <Stat label="Blancos" value={String(exam.blank)} />
        </div>
      </div>

      {exam.ko > 0 && (
        <div className="card" style={{ padding: 18, marginBottom: 20, textAlign: 'center' }}>
          <div className="label-sm" style={{ marginBottom: 10 }}>
            {exam.ko} {exam.ko === 1 ? 'pregunta fallada' : 'preguntas falladas'} añadidas a tu Repaso.
          </div>
          <button className="btn btn-primary" onClick={() => go('review')}>
            Repasarlas <Icon name="arrow-r" size={13} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('stats')}>
          Ver estadísticas
        </button>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onAgain}>
          Nuevo simulacro
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Exam });
