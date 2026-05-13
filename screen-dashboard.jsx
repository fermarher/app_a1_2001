// screen-dashboard.jsx — Home / dashboard (responsive)
//
// All user-progress markers come from window.STATS, which is zero-initialised
// in data.js. The dashboard intentionally shows zeros / empty states until
// real progress accumulates — no fake deltas, no fake sessions.

function Dashboard({ go }) {
  const mobile = useMobile();
  useStoreVersion();
  return mobile ? <DashboardMobile go={go} /> : <DashboardDesktop go={go} />;
}

// Days remaining until the configured exam date, or null if not set.
function daysUntilExam() {
  if (!window.EXAM_DATE) return null;
  const ms = new Date(window.EXAM_DATE).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

// "Lunes · 12 mayo" — localised eyebrow, no fake streak prefix.
function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function DashboardDesktop({ go }) {
  const days = daysUntilExam();
  const failedN = window.FAILED_QUESTIONS.length;
  const studied = window.STATS.answered > 0;

  return (
    <div style={{ padding: '36px clamp(24px, 5vw, 56px)' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 36, gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{todayLabel()}</div>
          <h1 className="serif" style={{ fontSize: 'clamp(36px, 4vw, 48px)', lineHeight: 1.05, margin: 0, fontWeight: 400 }}>
            Buenos días.<br/>
            <span style={{ color: 'var(--ink-2)' }}>
              {days != null ? `Quedan ${days} días para la oposición.` : 'Empieza por cualquier tema.'}
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => go('topics')}>
            <Icon name="search" size={14} /> Explorar temario
          </button>
          <button className="btn btn-primary" onClick={() => go('study')}>
            <Icon name="book" size={14} /> {studied ? 'Continuar estudio' : 'Empezar estudio'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 40,
      }}>
        {[
          { i: 'book',    t: 'Estudio',            sub: 'Por temas, sin tiempo',                meta: `${window.TOPICS.length} temas · ${window.totalQuestions().toLocaleString('es-ES')} preg.`, primary: true, key: 'study' },
          { i: 'refresh', t: 'Repaso de falladas', sub: 'Vuelve a las que aún no dominas',      meta: failedN ? `${failedN} pendientes` : 'Sin falladas todavía', key: 'review' },
          { i: 'timer',   t: 'Examen',             sub: '100 preguntas · 90 minutos',           meta: window.STATS.examsTaken ? `${window.STATS.examsTaken} simulacros` : 'Sin simulacros aún', key: 'exam' },
          { i: 'chart',   t: 'Estadísticas',       sub: 'Progreso, aciertos y predicción',      meta: window.STATS.predictedGrade != null ? `Nota estimada · ${window.STATS.predictedGrade}` : 'Sin datos aún', key: 'stats' },
        ].map(c => (
          <button key={c.t} className="card" onClick={() => go(c.key)} style={{
            padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 168,
            cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit',
            ...(c.primary ? { borderColor: 'var(--green)', background: 'linear-gradient(180deg, var(--green-tint) 0%, var(--card) 100%)' } : {}),
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4,
              background: c.primary ? 'var(--green)' : 'var(--paper-2)',
              color: c.primary ? '#f3f0e8' : 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={c.i} size={17} />
            </div>
            <div className="serif" style={{ fontSize: 23, letterSpacing: '-0.015em' }}>{c.t}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>{c.sub}</div>
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-sm mono">{c.meta}</span>
              <Icon name="arrow-r" size={14} color="var(--ink-3)" />
            </div>
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid', gap: 32,
        gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 className="serif" style={{ fontSize: 21, margin: 0, fontWeight: 500 }}>Específico · primeros 8 temas</h2>
            <button onClick={() => go('topics')} style={{
              all: 'unset', cursor: 'pointer', fontSize: 13, color: 'var(--green)', fontWeight: 500,
            }}>Ver los {window.TOPICS.length} temas →</button>
          </div>
          <div className="card" style={{ padding: '4px 0' }}>
            {window.TOPICS_SPECIFIC.slice(0, 8).map((t, i) => (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 80px 110px 56px',
                alignItems: 'center', gap: 16, padding: '12px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
              }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.code}</span>
                <span style={{ fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <span className="num" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t.count} preg.</span>
                <BarTrack value={t.accuracy} tone={t.accuracy < 0.65 ? 'var(--ochre)' : 'var(--green)'} />
                <span className="num" style={{ fontSize: 14.5, textAlign: 'right', color: t.answered ? 'var(--ink)' : 'var(--ink-3)' }}>
                  {t.answered ? `${Math.round(t.accuracy * 100)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="serif" style={{ fontSize: 21, margin: '0 0 14px', fontWeight: 500 }}>Esta semana</h2>
          <div className="card" style={{ padding: 18 }}>
            {window.STATS.weekly.length >= 2 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="label-sm">% aciertos · {window.STATS.weekly.length} semanas</span>
                </div>
                <Sparkline data={window.STATS.weekly} w={300} h={64} />
                <hr className="hr-soft" style={{ margin: '14px 0' }} />
              </>
            ) : (
              <div className="label-sm" style={{
                padding: '12px 4px 18px', textAlign: 'center', fontStyle: 'italic',
              }}>Aún sin progreso semanal.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Stat label="Preguntas respondidas" value={window.STATS.answered.toLocaleString('es-ES')} />
              <Stat label="Aciertos" value={window.STATS.answered ? `${Math.round(window.STATS.accuracy * 100)} %` : '—'} />
              <Stat label="Horas de estudio" value={`${window.STATS.hoursStudied} h`} />
              <Stat label="Nota estimada"
                value={window.STATS.predictedGrade != null ? String(window.STATS.predictedGrade).replace('.', ',') : '—'}
                tone={window.STATS.predictedGrade != null ? 'green' : undefined} />
            </div>
          </div>

          <h2 className="serif" style={{ fontSize: 21, margin: '28px 0 14px', fontWeight: 500 }}>Sesiones recientes</h2>
          <div className="card">
            {window.STATS.recentSessions.length === 0 ? (
              <div className="label-sm" style={{
                padding: 18, textAlign: 'center', fontStyle: 'italic',
              }}>Aún no hay sesiones registradas.</div>
            ) : window.STATS.recentSessions.slice(0, 4).map((s, i) => (
              <div key={i} style={{
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 14 }}>{s.topic}</div>
                  <div className="label-sm mono" style={{ marginTop: 2 }}>{s.date} · {s.mode}</div>
                </div>
                <div className="num" style={{ fontSize: 14.5 }}>{s.ok}/{s.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMobile({ go }) {
  const days = daysUntilExam();
  const failedN = window.FAILED_QUESTIONS.length;
  const studied = window.STATS.answered > 0;

  return (
    <div style={{ padding: '8px 20px 24px' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {todayLabel()}{days != null ? ` · ${days} d. restantes` : ''}
      </div>
      <h1 className="serif" style={{ fontSize: 30, margin: '0 0 6px', fontWeight: 400, lineHeight: 1.1 }}>
        Buenos días.
      </h1>
      <div style={{ color: 'var(--ink-2)', fontSize: 15.5, marginBottom: 22 }}>
        Empieza por cualquier tema del temario.
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => go('study')}
        style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}>
        <Icon name="book" size={15} /> {studied ? 'Continuar estudio' : 'Empezar estudio'}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { i: 'refresh',  t: 'Falladas', sub: String(failedN),                                           key: 'review' },
          { i: 'timer',    t: 'Examen',   sub: '90 min',                                                  key: 'exam' },
          { i: 'chart',    t: 'Stats',    sub: window.STATS.predictedGrade != null ? String(window.STATS.predictedGrade).replace('.', ',') : '—', key: 'stats' },
          { i: 'bookmark', t: 'Dudosas',  sub: '0',                                                       key: 'review' },
        ].map((c, i) => (
          <button key={i} className="card" onClick={() => go(c.key)} style={{
            padding: 16, display: 'flex', flexDirection: 'column', gap: 6,
            textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
          }}>
            <Icon name={c.i} size={18} color="var(--green)" />
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{c.t}</div>
            <div className="num" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{c.sub}</div>
          </button>
        ))}
      </div>

      <h2 className="serif" style={{ fontSize: 17, margin: '0 0 8px', fontWeight: 500 }}>Progreso semanal</h2>
      <div className="card" style={{ padding: 14, marginBottom: 22 }}>
        {window.STATS.weekly.length >= 2
          ? <Sparkline data={window.STATS.weekly} w={314} h={48} />
          : <div className="label-sm" style={{ padding: '8px 0', textAlign: 'center', fontStyle: 'italic' }}>
              Aún sin progreso registrado.
            </div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <div>
            <div className="label-sm">Aciertos</div>
            <div className="num serif" style={{ fontSize: 22 }}>
              {window.STATS.answered ? `${Math.round(window.STATS.accuracy * 100)} %` : '—'}
            </div>
          </div>
          <div>
            <div className="label-sm">Nota estimada</div>
            <div className="num serif" style={{ fontSize: 22, color: 'var(--green)' }}>
              {window.STATS.predictedGrade != null ? String(window.STATS.predictedGrade).replace('.', ',') : '—'}
            </div>
          </div>
          <div>
            <div className="label-sm">Racha</div>
            <div className="num serif" style={{ fontSize: 22 }}>
              {window.STATS.streakDays} d
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h2 className="serif" style={{ fontSize: 17, margin: 0, fontWeight: 500 }}>Específico · 4 temas</h2>
        <button onClick={() => go('topics')} style={{
          all: 'unset', cursor: 'pointer', fontSize: 12.5, color: 'var(--green)', fontWeight: 500,
        }}>Ver todos →</button>
      </div>
      <div className="card">
        {window.TOPICS_SPECIFIC.slice(0, 4).map((t, i) => (
          <div key={t.id} style={{
            padding: '14px 14px',
            borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>
                <span className="mono" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{t.code}</span>
                {t.title.split('(')[0].trim()}
              </span>
              <span className="num" style={{ fontSize: 14, color: t.answered ? 'var(--ink)' : 'var(--ink-3)' }}>
                {t.answered ? `${Math.round(t.accuracy * 100)}%` : '—'}
              </span>
            </div>
            <BarTrack value={t.accuracy} tone={t.accuracy < 0.65 ? 'var(--ochre)' : 'var(--green)'} />
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
