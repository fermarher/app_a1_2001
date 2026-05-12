// screen-topics.jsx — Temario picker (Común + Específico).
// Click a tema → set it as the active study tema, then route to Study.

function Topics({ go }) {
  const mobile = useMobile();
  const [tab, setTab] = React.useState('specific'); // 'common' | 'specific'
  const list = tab === 'common' ? window.TOPICS_COMMON : window.TOPICS_SPECIFIC;

  const open = (t) => {
    window.setStudyTema(t.section, t.num);
    go('study');
  };

  return (
    <div style={{ padding: mobile ? '8px 20px 24px' : 'clamp(32px, 4vw, 40px) clamp(24px, 5vw, 64px)' }}>
      <div style={{ marginBottom: mobile ? 20 : 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Programa · {window.TOPICS.length} temas · {window.totalQuestions().toLocaleString('es-ES')} preguntas
        </div>
        <h1 className="serif" style={{
          fontSize: mobile ? 30 : 'clamp(28px, 3.5vw, 36px)',
          margin: 0, fontWeight: 400, lineHeight: 1.1,
        }}>Temario</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', maxWidth: 600, margin: '10px 0 0' }}>
          Cuerpo Superior Facultativo, opción Arquitectura Superior (A1.2001) ·
          Resolución de 27 de mayo de 2024 (BOJA núm. 107).
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('common')}
          className={`tag ${tab === 'common' ? 'tag-green' : 'tag-outline'}`}
          style={{ cursor: 'pointer', font: 'inherit', border: tab === 'common' ? 0 : '1px solid var(--rule)' }}>
          Temario Común · {window.TOPICS_COMMON.length}
        </button>
        <button onClick={() => setTab('specific')}
          className={`tag ${tab === 'specific' ? 'tag-green' : 'tag-outline'}`}
          style={{ cursor: 'pointer', font: 'inherit', border: tab === 'specific' ? 0 : '1px solid var(--rule)' }}>
          Temario Específico · {window.TOPICS_SPECIFIC.length}
        </button>
      </div>

      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
      }}>
        {list.map(t => (
          <button key={t.id} onClick={() => open(t)} className="card" style={{
            padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
            cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit',
            transition: 'border-color .12s, background .12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink-3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--rule)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{
                  fontSize: 11, color: 'var(--green)', letterSpacing: '0.1em', marginBottom: 6,
                }}>
                  TEMA {t.num} · {tab === 'common' ? 'COMÚN' : 'ESPECÍFICO'}
                </div>
                <div className="serif" style={{ fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.35 }}>
                  {t.title}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="serif num" style={{
                  fontSize: 20,
                  color: t.answered
                    ? (t.accuracy < 0.65 ? 'var(--ochre)' : 'var(--green)')
                    : 'var(--ink-3)',
                }}>{t.answered ? `${Math.round(t.accuracy*100)}%` : '—'}</div>
                <div className="label-sm" style={{ fontSize: 11 }}>aciertos</div>
              </div>
            </div>
            <BarTrack value={t.accuracy} tone={t.accuracy < 0.65 ? 'var(--ochre)' : 'var(--green)'} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2,
              gap: 10, flexWrap: 'wrap',
            }}>
              <span className="label-sm">{t.count} preguntas</span>
              <span className="label-sm" style={{ color: 'var(--green)', fontWeight: 500 }}>
                Estudiar <Icon name="arrow-r" size={11} color="var(--green)" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Topics });
