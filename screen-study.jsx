// screen-study.jsx — Study mode question screen (interactive, responsive).
// Reads window.appState.studyTema + studyIdx, navigates within the active tema.

function Study({ go }) {
  const mobile = useMobile();
  useStoreVersion();

  // Subscribe to global app-state changes (tema selection from Topics, idx changes from nav).
  const [_, forceRender] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const fn = () => forceRender();
    window.addEventListener('appstate', fn);
    return () => window.removeEventListener('appstate', fn);
  }, []);

  const { section, num } = window.appState.studyTema;
  const idx = window.appState.studyIdx;
  const tema = window.getTema(section, num);
  const meta = window.getTopicMeta(section, num);
  const q = tema?.questions[idx];

  const [selected, setSelected] = React.useState(null);
  const [revealed, setRevealed] = React.useState(false);

  // Doubt flag comes from the persisted question state so it survives reload.
  const qState = window.Store.questionState(section, num, idx);
  const doubt = !!qState?.marked;
  const setDoubt = (next) => {
    const value = typeof next === 'function' ? next(doubt) : next;
    window.Store.setMarked(section, num, idx, value);
  };

  // Reset interaction state when the question changes.
  React.useEffect(() => {
    setSelected(null); setRevealed(false);
  }, [section, num, idx]);

  if (!tema || !q) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <p>No hay preguntas disponibles para este tema.</p>
        <button className="btn" onClick={() => go('topics')}>Volver al temario</button>
      </div>
    );
  }

  const submit = () => {
    if (!selected || revealed) return;
    window.Store.recordAnswer(section, num, idx, selected, q.correct);
    setRevealed(true);
  };
  const next = () => {
    const ni = idx + 1 >= tema.questions.length ? 0 : idx + 1;
    window.setStudyIdx(ni);
  };
  const prev = () => {
    const ni = idx - 1 < 0 ? tema.questions.length - 1 : idx - 1;
    window.setStudyIdx(ni);
  };

  const optionState = (id) => {
    const isSelected = selected === id;
    const isCorrect = revealed && id === q.correct;
    const isWrongPick = revealed && isSelected && id !== q.correct;
    let bg = 'var(--card)', border = 'var(--rule)', badgeBg = 'var(--paper-2)', badgeColor = 'var(--ink-2)';
    if (isSelected && !revealed) { border = 'var(--ink)'; badgeBg = 'var(--ink)'; badgeColor = '#f3f0e8'; }
    if (isCorrect) { border = 'var(--green)'; bg = 'var(--green-tint)'; badgeBg = 'var(--green)'; badgeColor = '#f3f0e8'; }
    if (isWrongPick) { border = 'var(--terra)'; bg = 'var(--terra-tint)'; badgeBg = 'var(--terra)'; badgeColor = '#fff'; }
    return { bg, border, badgeBg, badgeColor, isSelected, isCorrect, isWrongPick };
  };

  // Keyboard shortcuts (desktop only).
  React.useEffect(() => {
    if (mobile) return;
    const onKey = (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      if (e.key >= '1' && e.key <= '4' && !revealed) {
        setSelected(['a','b','c','d'][parseInt(e.key, 10) - 1]);
      } else if (e.key === 'Enter') {
        if (!revealed) submit(); else next();
      } else if (e.key === 'f' || e.key === 'F') {
        setDoubt(d => !d);
      } else if (e.key === 'ArrowRight') { next(); }
      else if (e.key === 'ArrowLeft') { prev(); }
      else if (e.key === 'Escape') { go('dashboard'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobile, revealed, selected, idx, section, num]);

  const ctx = {
    q, tema, meta, section, num, idx,
    state: { selected, revealed, doubt },
    actions: { setSelected, setDoubt, submit, next, prev, go, jumpTo: (i) => window.setStudyIdx(i) },
    optionState,
  };
  return mobile ? <StudyMobile {...ctx} /> : <StudyDesktop {...ctx} />;
}

function StudyDesktop({ q, tema, meta, section, idx, state, actions, optionState }) {
  const { selected, revealed, doubt } = state;
  const { setSelected, setDoubt, submit, next, prev, go, jumpTo } = actions;
  const total = tema.questions.length;
  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        height: 56, borderBottom: '1px solid var(--rule)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--paper)', flexShrink: 0, gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span style={{ fontSize: 13 }}>Modo estudio</span>
          <Pill tone="green">
            {section === 'common' ? 'Común' : 'Específico'} · Tema {meta.num}
          </Pill>
          <span className="label-sm" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380,
          }}>{meta.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="num label-sm">{idx + 1} / {total}</span>
            <div style={{ width: 160, height: 3, background: 'var(--paper-2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)' }} />
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => go('topics')}>
            <Icon name="menu" size={13} /> Cambiar tema
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => go('dashboard')}>
            <Icon name="x" size={13} /> Salir
          </button>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', minHeight: 0,
      }}>
        <div style={{ overflow: 'auto', padding: '40px clamp(24px, 6vw, 80px)' }}>
          <div className="prose-narrow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <span className="eyebrow">Pregunta {idx + 1}</span>
              <span style={{ color: 'var(--ink-4)' }}>·</span>
              {q.source && <Pill tone="outline">{q.source}</Pill>}
              {doubt && <Pill tone="ochre"><Icon name="bookmark" size={10} /> Dudosa</Pill>}
            </div>

            <p className="serif" style={{
              fontSize: 26, lineHeight: 1.4, margin: '0 0 32px', fontWeight: 400, color: 'var(--ink)',
            }}>{q.prompt}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map(opt => {
                const s = optionState(opt.id);
                return (
                  <button key={opt.id} onClick={() => !revealed && setSelected(opt.id)} style={{
                    all: 'unset', cursor: revealed ? 'default' : 'pointer',
                    display: 'grid', gridTemplateColumns: '32px 1fr 20px', gap: 14, padding: '16px 18px',
                    border: `1px solid ${s.border}`, borderRadius: 5, background: s.bg,
                    transition: 'all .15s', alignItems: 'flex-start',
                  }}>
                    <span className="mono" style={{
                      width: 24, height: 24, borderRadius: 3, background: s.badgeBg, color: s.badgeColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
                    }}>{opt.id}</span>
                    <span style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--ink)' }}>{opt.text}</span>
                    {s.isCorrect && <Icon name="check" size={16} color="var(--green)" />}
                    {s.isWrongPick && <Icon name="x" size={16} color="var(--terra)" />}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div style={{
                marginTop: 28, padding: 24, background: 'var(--paper-2)', borderRadius: 5,
                borderLeft: '3px solid var(--green)',
              }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  Respuesta correcta · {q.correct.toUpperCase()}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: 'var(--ink)' }}>
                  {q.options.find(o => o.id === q.correct)?.text}
                </p>
                {q.source && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontSize: 12, color: 'var(--ink-2)' }}>
                    <Icon name="book" size={12} /> <span className="mono">{q.source}</span>
                  </div>
                )}
              </div>
            )}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32,
              paddingTop: 20, borderTop: '1px solid var(--rule-soft)', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" onClick={prev}>
                  <Icon name="arrow-l" size={13} /> Anterior
                </button>
                <button className={`btn btn-sm ${doubt ? '' : 'btn-ghost'}`} onClick={() => setDoubt(d => !d)}>
                  <Icon name="bookmark" size={13} /> {doubt ? 'Marcada como dudosa' : 'Marcar dudosa'}
                </button>
              </div>
              {!revealed ? (
                <button className="btn btn-primary btn-lg" disabled={!selected} onClick={submit}>
                  Comprobar respuesta <Icon name="arrow-r" size={14} />
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={next}>
                  Siguiente pregunta <Icon name="arrow-r" size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <aside style={{
          borderLeft: '1px solid var(--rule)', padding: 24, background: 'var(--paper)', overflow: 'auto',
        }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Tema actual</div>
          <div style={{ marginBottom: 22 }}>
            <div className="label-sm" style={{ marginBottom: 6 }}>
              {section === 'common' ? 'Común' : 'Específico'} · Tema {meta.num}
            </div>
            <div className="serif" style={{ fontSize: 15, lineHeight: 1.35 }}>{meta.title}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <Stat label="Pregunta" value={`${idx + 1}/${total}`} />
            <Stat label="Acierto" value={`${Math.round(meta.accuracy * 100)} %`}
              tone={meta.accuracy >= 0.65 ? 'green' : undefined} />
          </div>

          <hr className="hr-soft" style={{ margin: '0 0 18px' }} />

          <div className="eyebrow" style={{ marginBottom: 12 }}>Atajos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
            {[
              ['1 – 4', 'seleccionar respuesta'],
              ['↵', 'comprobar / siguiente'],
              ['← →', 'pregunta anterior / siguiente'],
              ['F', 'marcar dudosa'],
              ['Esc', 'salir'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="mono" style={{
                  background: 'var(--card)', border: '1px solid var(--rule)',
                  padding: '1px 7px', borderRadius: 3, color: 'var(--ink)', fontSize: 11,
                }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          <hr className="hr-soft" style={{ margin: '20px 0' }} />

          <div className="eyebrow" style={{ marginBottom: 12 }}>Saltar a pregunta</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {tema.questions.slice(0, 36).map((_, i) => (
              <button key={i} onClick={() => jumpTo(i)} style={{
                all: 'unset', cursor: 'pointer', textAlign: 'center',
                fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 0', borderRadius: 3,
                background: i === idx ? 'var(--green)' : 'var(--card)',
                color: i === idx ? '#f3f0e8' : 'var(--ink-2)',
                border: `1px solid ${i === idx ? 'var(--green)' : 'var(--rule)'}`,
              }}>{i + 1}</button>
            ))}
          </div>
          {tema.questions.length > 36 && (
            <div className="label-sm" style={{ marginTop: 8, fontSize: 11 }}>
              y {tema.questions.length - 36} más…
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StudyMobile({ q, tema, meta, section, idx, state, actions, optionState }) {
  const { selected, revealed, doubt } = state;
  const { setSelected, setDoubt, submit, next, go } = actions;
  const total = tema.questions.length;
  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        padding: '12px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 5,
      }}>
        <button onClick={() => go('dashboard')} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
          <Icon name="x" size={20} color="var(--ink-2)" />
        </button>
        <div style={{ flex: 1, margin: '0 16px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span className="eyebrow" style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
            }}>
              {section === 'common' ? 'Común' : 'Esp.'} {meta.num}
            </span>
            <span className="num label-sm">{idx + 1}/{total}</span>
          </div>
          <div style={{ width: '100%', height: 2, background: 'var(--paper-2)', borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)' }} />
          </div>
        </div>
        <button onClick={() => setDoubt(d => !d)} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
          <Icon name="bookmark" size={18} color={doubt ? 'var(--ochre)' : 'var(--ink-2)'} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {q.source && <Pill tone="outline">{q.source}</Pill>}
        </div>
        <p className="serif" style={{ fontSize: 20, lineHeight: 1.4, margin: '0 0 20px', fontWeight: 400 }}>
          {q.prompt}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map(opt => {
            const s = optionState(opt.id);
            return (
              <button key={opt.id} onClick={() => !revealed && setSelected(opt.id)} style={{
                all: 'unset', cursor: revealed ? 'default' : 'pointer',
                display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, padding: '14px 14px',
                border: `1px solid ${s.border}`, borderRadius: 5, background: s.bg,
              }}>
                <span className="mono" style={{
                  width: 24, height: 24, borderRadius: 3, background: s.badgeBg, color: s.badgeColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500,
                }}>{opt.id}</span>
                <span style={{ fontSize: 15, lineHeight: 1.45 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div style={{
            marginTop: 16, padding: 14, background: 'var(--paper-2)', borderRadius: 5,
            borderLeft: '2px solid var(--green)',
          }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Respuesta correcta · {q.correct.toUpperCase()}
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {q.options.find(o => o.id === q.correct)?.text}
            </p>
            {q.source && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)' }} className="mono">{q.source}</div>
            )}
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--rule)', background: 'var(--card)',
        display: 'flex', gap: 10, alignItems: 'center',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button className="btn btn-sm" style={{ padding: 10 }} onClick={actions.prev}>
          <Icon name="arrow-l" size={14} />
        </button>
        <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}
          onClick={revealed ? next : submit} disabled={!revealed && !selected}>
          {revealed ? 'Siguiente pregunta' : 'Comprobar'} <Icon name="arrow-r" size={15} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Study });
