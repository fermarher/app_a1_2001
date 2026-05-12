// screen-exam.jsx — Timed exam (start → in-progress → result), responsive.

function Exam({ go }) {
  const [phase, setPhase] = React.useState('start'); // start | progress | result
  const mobile = useMobile();

  if (phase === 'start') {
    return mobile
      ? <ExamStartMobile onStart={() => setPhase('progress')} go={go} />
      : <ExamStartDesktop onStart={() => setPhase('progress')} go={go} />;
  }
  if (phase === 'progress') {
    return mobile
      ? <ExamMobile onFinish={() => setPhase('result')} go={go} />
      : <ExamInProgressDesktop onFinish={() => setPhase('result')} go={go} />;
  }
  return mobile
    ? <ExamResultMobile onAgain={() => setPhase('start')} go={go} />
    : <ExamResultDesktop onAgain={() => setPhase('start')} go={go} />;
}

function ExamStartDesktop({ onStart }) {
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
            100 preguntas.<br/>
            <span style={{ color: 'var(--ink-2)' }}>90 minutos.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 460, margin: '0 0 32px' }}>
            Formato oficial del primer ejercicio del proceso selectivo al Cuerpo Superior Facultativo,
            opción Arquitectura, de la Junta de Andalucía.
          </p>

          <div className="card" style={{ padding: 0, maxWidth: 480 }}>
            {[
              ['Distribución', '100 preguntas tipo test, 4 opciones'],
              ['Tiempo', '90 minutos en cuenta atrás'],
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
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              <Icon name="timer" size={15} /> Comenzar examen
            </button>
            <button className="btn btn-lg">Personalizar simulacro</button>
          </div>
          <div className="label-sm" style={{ marginTop: 14 }}>
            Una vez iniciado, el cronómetro no se detiene.
          </div>
        </div>

        <div>
          <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '0 0 14px' }}>
            Distribución por bloque
          </h2>
          <div className="card" style={{ padding: '4px 0' }}>
            {window.TOPICS_SPECIFIC.slice(0, 8).map((t, i) => {
              const w = [14, 8, 22, 18, 10, 12, 8, 8][i];
              return (
                <div key={t.id} style={{
                  padding: '12px 18px', display: 'grid', gridTemplateColumns: '28px 1fr 60px 40px', gap: 14,
                  alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
                }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.code}</span>
                  <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title.split('(')[0].trim()}</span>
                  <BarTrack value={w / 25} />
                  <span className="num" style={{ fontSize: 12, textAlign: 'right' }}>{w}</span>
                </div>
              );
            })}
          </div>
          <div className="label-sm" style={{ marginTop: 10, fontStyle: 'italic' }}>
            Muestra los 8 primeros temas específicos. El simulacro real cubre los {window.TOPICS.length} temas del temario.
          </div>

          <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '32px 0 14px' }}>
            Últimos simulacros
          </h2>
          <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--ink-2)' }}>
            <div className="label-sm" style={{ fontStyle: 'italic' }}>
              Aún no has realizado ningún simulacro.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamStartMobile({ onStart }) {
  return (
    <div style={{ padding: '8px 20px 24px' }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Simulacro · Convocatoria 2026</div>
      <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, margin: '0 0 16px', fontWeight: 400 }}>
        100 preguntas.<br/>
        <span style={{ color: 'var(--ink-2)' }}>90 minutos.</span>
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 24px' }}>
        Formato oficial del primer ejercicio del proceso selectivo, opción Arquitectura.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        {[
          ['Distribución', '100 preg. · 4 opciones'],
          ['Tiempo', '90 minutos'],
          ['Corrección', 'Acierto +1 · Fallo −0,33'],
          ['Nota de corte', '6,50'],
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
        onClick={onStart}>
        <Icon name="timer" size={16} /> Comenzar examen
      </button>
      <div className="label-sm" style={{ marginTop: 12, textAlign: 'center' }}>
        Una vez iniciado, el cronómetro no se detiene.
      </div>
    </div>
  );
}

function ExamInProgressDesktop({ onFinish }) {
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
          <Pill tone="outline">100 preguntas</Pill>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div className="label-sm">Tiempo restante</div>
          <div className="serif num" style={{ fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            00<span style={{ color: 'var(--ink-3)' }}>:</span>54<span style={{ color: 'var(--ink-3)' }}>:</span>12
          </div>
          <button className="btn btn-sm">Pausar</button>
          <button className="btn btn-sm btn-primary" onClick={onFinish}>Entregar examen</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', minHeight: 0 }}>
        <div style={{ overflow: 'auto', padding: '32px clamp(24px, 6vw, 80px)' }}>
          <div className="prose-narrow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span className="eyebrow">Pregunta 37 de 100</span>
              <span style={{ color: 'var(--ink-4)' }}>·</span>
              <span className="label-sm">Bloque III</span>
            </div>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1.45, margin: '0 0 28px', fontWeight: 400 }}>
              {window.SAMPLE_QUESTION.prompt}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {window.SAMPLE_QUESTION.options.map((opt, i) => (
                <div key={opt.id} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14, padding: '15px 18px',
                  border: `1px solid ${i === 2 ? 'var(--ink)' : 'var(--rule)'}`, borderRadius: 5,
                  background: 'var(--card)',
                }}>
                  <span className="mono" style={{
                    width: 24, height: 24, borderRadius: 3,
                    background: i === 2 ? 'var(--ink)' : 'var(--paper-2)',
                    color: i === 2 ? '#f3f0e8' : 'var(--ink-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 500,
                  }}>{opt.id}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{opt.text}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 24, padding: 14, background: 'var(--paper-2)', borderRadius: 5,
              fontSize: 12, color: 'var(--ink-2)', display: 'flex', justifyContent: 'space-between', gap: 12,
            }}>
              <span>En el examen no se muestra la respuesta hasta el final.</span>
              <span>−0,33 por fallo · 0 en blanco</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 10, flexWrap: 'wrap' }}>
              <button className="btn"><Icon name="arrow-l" size={13} /> Anterior</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn"><Icon name="flag" size={13} /> Marcar para revisar</button>
                <button className="btn btn-primary">Siguiente <Icon name="arrow-r" size={13} /></button>
              </div>
            </div>
          </div>
        </div>

        <aside style={{
          borderLeft: '1px solid var(--rule)', padding: 20, background: 'var(--paper)', overflow: 'auto',
        }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Navegador</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5, marginBottom: 18 }}>
            {window.EXAM_NAV.map(q => {
              let bg = 'var(--card)', color = 'var(--ink-2)', border = 'var(--rule)';
              if (q.state === 'answered') { bg = 'var(--ink)'; color = '#f3f0e8'; border = 'var(--ink)'; }
              if (q.state === 'current')  { bg = 'var(--green)'; color = '#f3f0e8'; border = 'var(--green)'; }
              if (q.state === 'flagged')  { bg = 'var(--ochre-tint)'; color = 'var(--ochre)'; border = 'var(--ochre)'; }
              return (
                <div key={q.n} style={{
                  height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 3, fontSize: 10.5, fontFamily: 'var(--mono)',
                  background: bg, color, border: `1px solid ${border}`,
                }}>{q.n}</div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <Legend tone="ink" label="Respondidas" count="36" />
            <Legend tone="green" label="Actual" count="1" />
            <Legend tone="ochre" label="Marcadas" count="3" />
            <Legend tone="outline" label="Pendientes" count="60" />
          </div>

          <hr className="hr-soft" style={{ margin: '0 0 18px' }} />

          <div className="eyebrow" style={{ marginBottom: 10 }}>Resumen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Stat label="Respondidas" value="36/100" />
            <Stat label="Marcadas" value="3" />
            <Stat label="Tiempo medio" value="58 s" />
            <Stat label="Tiempo / preg." value="54 s" />
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

function ExamResultDesktop({ onAgain, go }) {
  return (
    <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(24px, 5vw, 80px)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 36, gap: 14, flexWrap: 'wrap',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Simulacro · 11 mayo 2026</div>
          <h1 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 40px)', lineHeight: 1.05, margin: 0, fontWeight: 400 }}>
            Resultado del examen
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => go('review')}>
            <Icon name="book" size={14} /> Revisar preguntas
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
            fontSize: 'clamp(80px, 10vw, 112px)', lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--green)',
          }}>7,12</div>
          <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 8 }}>
            Sobre 10 · Corte estimado 6,50
          </div>
          <hr className="hr-soft" style={{ margin: '24px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Stat label="Aciertos" value="74" tone="green" />
            <Stat label="Fallos" value="17" />
            <Stat label="Blancos" value="9" />
          </div>
        </div>

        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20,
          }}>
            <KPI label="Tiempo empleado" value="84:21" sub="de 90:00" />
            <KPI label="Mejor bloque" value="Bloque II" sub="92% aciertos" />
            <KPI label="A mejorar" value="Bloque VI" sub="48% aciertos" tone="ochre" />
          </div>

          <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '0 0 14px' }}>
            Desglose por bloque
          </h2>
          <div className="card" style={{ padding: '4px 0' }}>
            {window.TOPICS_SPECIFIC.slice(0, 8).map((t, i) => {
              const ok = [12, 7, 14, 12, 7, 5, 6, 5][i];
              const total = [14, 8, 22, 18, 10, 12, 8, 8][i];
              const pct = ok / total;
              return (
                <div key={t.id} style={{
                  padding: '12px 18px', display: 'grid', gridTemplateColumns: '28px 1fr 70px 1fr 50px',
                  alignItems: 'center', gap: 14, borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
                }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.code}</span>
                  <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title.split('(')[0].trim()}</span>
                  <span className="num label-sm">{ok}/{total}</span>
                  <BarTrack value={pct} tone={pct < 0.55 ? 'var(--terra)' : pct < 0.7 ? 'var(--ochre)' : 'var(--green)'} />
                  <span className="num" style={{ fontSize: 13, textAlign: 'right' }}>{Math.round(pct * 100)}%</span>
                </div>
              );
            })}
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

function ExamMobile({ onFinish }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 5,
      }}>
        <button onClick={onFinish} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
          <Icon name="x" size={18} color="var(--ink-2)" />
        </button>
        <div className="serif num" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
          00<span style={{ color: 'var(--ink-3)' }}>:</span>54<span style={{ color: 'var(--ink-3)' }}>:</span>12
        </div>
        <Icon name="menu" size={20} color="var(--ink-2)" />
      </div>

      <div style={{ padding: '12px 20px 6px', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="eyebrow">Pregunta 37 / 100</span>
          <span className="label-sm">36 respondidas</span>
        </div>
        <div style={{ height: 2, background: 'var(--paper-2)', borderRadius: 2 }}>
          <div style={{ width: '37%', height: '100%', background: 'var(--green)' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px' }}>
        <p className="serif" style={{ fontSize: 19, lineHeight: 1.4, margin: '0 0 16px' }}>
          {window.SAMPLE_QUESTION.prompt}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {window.SAMPLE_QUESTION.options.map((opt, i) => (
            <div key={opt.id} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, padding: '14px 14px',
              border: `1px solid ${i === 2 ? 'var(--ink)' : 'var(--rule)'}`, borderRadius: 5,
              background: 'var(--card)',
            }}>
              <span className="mono" style={{
                width: 24, height: 24, borderRadius: 3,
                background: i === 2 ? 'var(--ink)' : 'var(--paper-2)',
                color: i === 2 ? '#f3f0e8' : 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 500,
              }}>{opt.id}</span>
              <span style={{ fontSize: 15, lineHeight: 1.45 }}>{opt.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--rule)', background: 'var(--card)',
        display: 'flex', gap: 8,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button className="btn" style={{ padding: 12 }}><Icon name="arrow-l" size={15} /></button>
        <button className="btn"><Icon name="flag" size={14} /></button>
        <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
          Siguiente <Icon name="arrow-r" size={15} />
        </button>
      </div>
    </div>
  );
}

function ExamResultMobile({ onAgain, go }) {
  return (
    <div style={{ padding: '12px 20px 24px' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Simulacro · 11 mayo</div>
      <h1 className="serif" style={{ fontSize: 28, margin: '0 0 18px', fontWeight: 400 }}>
        Resultado
      </h1>

      <div className="card" style={{
        padding: 24, marginBottom: 16, background: 'linear-gradient(180deg, var(--green-tint), var(--card))',
      }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Nota final</div>
        <div className="serif num" style={{
          fontSize: 80, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--green)',
        }}>7,12</div>
        <div className="label-sm" style={{ marginTop: 8 }}>Sobre 10 · Corte 6,50</div>
        <hr className="hr-soft" style={{ margin: '20px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <Stat label="Aciertos" value="74" tone="green" />
          <Stat label="Fallos" value="17" />
          <Stat label="Blancos" value="9" />
        </div>
      </div>

      <h2 className="serif" style={{ fontSize: 17, margin: '0 0 8px', fontWeight: 500 }}>Por bloque</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        {window.TOPICS_SPECIFIC.slice(0, 8).map((t, i) => {
          const ok = [12, 7, 14, 12, 7, 5, 6, 5][i];
          const total = [14, 8, 22, 18, 10, 12, 8, 8][i];
          const pct = ok / total;
          return (
            <div key={t.id} style={{
              padding: '14px', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>
                  <span className="mono" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{t.code}</span>
                  {t.title.split('(')[0].trim()}
                </span>
                <span className="num" style={{ fontSize: 13 }}>{ok}/{total}</span>
              </div>
              <BarTrack value={pct} tone={pct < 0.55 ? 'var(--terra)' : pct < 0.7 ? 'var(--ochre)' : 'var(--green)'} />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('review')}>
          Revisar
        </button>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onAgain}>
          Nuevo simulacro
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Exam });
