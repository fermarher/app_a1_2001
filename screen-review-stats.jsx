// screen-review-stats.jsx — Review failed + Statistics, responsive.

function Review({ go }) {
  const mobile = useMobile();
  useStoreVersion();
  return mobile ? <ReviewMobile go={go} /> : <ReviewDesktop go={go} />;
}

function Stats({ go }) {
  const mobile = useMobile();
  useStoreVersion();
  return mobile ? <StatsMobile go={go} /> : <StatsDesktop go={go} />;
}

function ReviewDesktop({ go }) {
  const failed = window.FAILED_QUESTIONS;
  return (
    <div style={{ padding: 'clamp(32px, 4vw, 40px) clamp(24px, 5vw, 64px)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 32, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Repaso · {failed.length} {failed.length === 1 ? 'pregunta' : 'preguntas'} pendientes
          </div>
          <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', margin: 0, fontWeight: 400 }}>
            Preguntas falladas
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', maxWidth: 520, margin: '10px 0 0' }}>
            Aquellas que has respondido incorrectamente al menos una vez.
            Una pregunta sale del repaso tras dos aciertos consecutivos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={failed.length === 0}>
            <Icon name="filter" size={14} /> Filtrar
          </button>
          <button className="btn btn-primary" onClick={() => go('study')} disabled={failed.length === 0}>
            <Icon name="refresh" size={14} /> Repasar
          </button>
        </div>
      </div>

      {failed.length === 0 ? (
        <div className="card" style={{
          padding: 60, textAlign: 'center', color: 'var(--ink-2)',
        }}>
          <div className="serif" style={{ fontSize: 22, marginBottom: 8, color: 'var(--ink)' }}>
            Sin preguntas falladas todavía.
          </div>
          <div style={{ fontSize: 14, maxWidth: 420, margin: '0 auto 18px', lineHeight: 1.5 }}>
            Conforme estudies y respondas, las preguntas que falles aparecerán aquí
            para que las repases hasta dominarlas.
          </div>
          <button className="btn btn-primary" onClick={() => go('topics')}>
            <Icon name="book" size={14} /> Empezar por el temario
          </button>
        </div>
      ) : (
        <div className="card">
          <div style={{
            padding: '10px 20px', display: 'grid',
            gridTemplateColumns: '70px minmax(0, 1fr) 200px 130px 130px 80px',
            gap: 16, fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase',
            letterSpacing: '0.1em', borderBottom: '1px solid var(--rule)', fontFamily: 'var(--mono)',
          }}>
            <span>ID</span><span>Enunciado</span><span>Tema</span><span>Referencia</span>
            <span>Falladas</span><span></span>
          </div>
          {failed.map((q, i) => (
            <div key={q.id} style={{
              padding: '16px 20px', display: 'grid',
              gridTemplateColumns: '70px minmax(0, 1fr) 200px 130px 130px 80px',
              gap: 16, alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
            }}>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{q.id}</span>
              <span style={{
                fontSize: 13.5, lineHeight: 1.45,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{q.prompt}</span>
              <span className="label-sm">{q.topic}</span>
              <span className="mono label-sm">{q.ref}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {Array.from({ length: q.failedTimes }).map((_, j) => (
                  <span key={j} style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--terra)' }} />
                ))}
                <span className="num label-sm" style={{ marginLeft: 4 }}>{q.lastFailed}</span>
              </div>
              <button className="btn btn-sm" style={{ justifySelf: 'end' }}
                onClick={() => {
                  window.setStudyTema(q.section, q.temaNum);
                  window.setStudyIdx(q.qIdx || 0);
                  go('study');
                }}>
                Ver <Icon name="arrow-r" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsDesktop() {
  const [range, setRange] = React.useState('30');
  return (
    <div style={{ padding: 'clamp(32px, 4vw, 40px) clamp(24px, 5vw, 64px)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 32, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Análisis de rendimiento</div>
          <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', margin: 0, fontWeight: 400 }}>
            Estadísticas
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['7','7 días'], ['30','30 días'], ['90','90 días'], ['hist','Histórico']].map(([k, label]) => (
            <button key={k} onClick={() => setRange(k)} className={`tag ${range === k ? 'tag-green' : 'tag-outline'}`}
              style={{ cursor: 'pointer', border: range === k ? 0 : '1px solid var(--rule)', font: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 36,
      }}>
        <BigKPI label="Aciertos globales"
          value={window.STATS.answered ? `${Math.round(window.STATS.accuracy * 100)} %` : '—'} />
        <BigKPI label="Nota estimada examen"
          value={window.STATS.predictedGrade != null ? String(window.STATS.predictedGrade).replace('.', ',') : '—'}
          tone={window.STATS.predictedGrade != null ? 'green' : undefined}
          sub={window.STATS.predictedGrade != null ? 'sobre 10 · estimación' : 'Sin datos suficientes todavía.'} />
        <BigKPI label="Preguntas respondidas"
          value={window.STATS.answered.toLocaleString('es-ES')}
          sub={`de ${window.totalQuestions().toLocaleString('es-ES')} únicas`} />
        <BigKPI label="Horas de estudio" value={`${window.STATS.hoursStudied} h`} />
      </div>

      <div style={{
        display: 'grid', gap: 24, marginBottom: 36,
        gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
      }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <h2 className="serif" style={{ fontSize: 18, margin: 0, fontWeight: 500 }}>
              Evolución del % de aciertos
            </h2>
            <span className="label-sm">{window.STATS.weekly.length || 0} semanas</span>
          </div>
          {window.STATS.weekly.length >= 2
            ? <BigSparkline data={window.STATS.weekly} />
            : <div className="label-sm" style={{
                padding: '60px 0', textAlign: 'center', fontStyle: 'italic',
              }}>Necesitas al menos dos semanas de actividad para ver una evolución.</div>}
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h2 className="serif" style={{ fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>
            Predicción de nota
          </h2>
          <div className="serif num" style={{
            fontSize: 56, lineHeight: 1,
            color: window.STATS.predictedGrade != null ? 'var(--green)' : 'var(--ink-3)',
            letterSpacing: '-0.02em',
          }}>
            {window.STATS.predictedGrade != null
              ? String(window.STATS.predictedGrade).replace('.', ',')
              : '—'}
          </div>
          <div className="label-sm" style={{ marginTop: 6 }}>
            {window.STATS.predictedGrade != null ? 'Estimación basada en tu histórico.' : 'Sin datos todavía.'}
          </div>
          <hr className="hr-soft" style={{ margin: '18px 0' }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Nota de corte estimada para la oposición:{' '}
            <span className="num" style={{ color: 'var(--ink)' }}>6,50</span>.
            La predicción se calcula a partir de tu histórico de simulacros y respuestas
            individuales una vez tengas suficiente actividad.
          </div>
        </div>
      </div>

      <h2 className="serif" style={{ fontSize: 18, fontWeight: 500, margin: '0 0 16px' }}>
        Aciertos por tema · evolución mensual
      </h2>
      <div className="card" style={{ padding: '4px 0', overflow: 'auto' }}>
        <div style={{
          padding: '10px 20px', display: 'grid',
          gridTemplateColumns: '28px minmax(180px, 1.4fr) repeat(6, minmax(56px, 1fr)) 80px',
          gap: 12, fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontFamily: 'var(--mono)', borderBottom: '1px solid var(--rule)',
        }}>
          <span></span><span>Tema</span>
          {['m-5','m-4','m-3','m-2','m-1','Actual'].map(m => <span key={m} style={{ textAlign: 'center' }}>{m}</span>)}
          <span style={{ textAlign: 'right' }}>Tendencia</span>
        </div>
        {window.TOPICS_SPECIFIC.slice(0, 8).map((t, i) => (
          <div key={t.id} style={{
            padding: '12px 20px', display: 'grid',
            gridTemplateColumns: '28px minmax(180px, 1.4fr) repeat(6, minmax(56px, 1fr)) 80px',
            gap: 12, alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
          }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.code}</span>
            <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.title.split('(')[0].trim()}
            </span>
            {[0,1,2,3,4,5].map((j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  width: 36, height: 22, borderRadius: 3,
                  background: 'var(--paper-2)', color: 'var(--ink-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: 'var(--mono)',
                }}>—</span>
              </div>
            ))}
            <span className="num label-sm" style={{ textAlign: 'right' }}>—</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BigKPI({ label, value, delta, sub, tone }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="serif num" style={{
          fontSize: 42, letterSpacing: '-0.02em',
          color: tone === 'green' ? 'var(--green)' : 'var(--ink)',
        }}>{value}</span>
        <span className="num" style={{ fontSize: 12, color: 'var(--green)' }}>{delta}</span>
      </div>
      {sub && <div className="label-sm" style={{ marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function BigSparkline({ data }) {
  const w = 700, h = 200, pad = 30;
  const max = 1.0, min = 0.4;
  const stepX = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => `${pad + i*stepX},${h - pad - ((v - min) / (max - min)) * (h - pad*2)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {[0.5, 0.6, 0.7, 0.8, 0.9].map(y => {
        const yy = h - pad - ((y - min) / (max - min)) * (h - pad*2);
        return (
          <g key={y}>
            <line x1={pad} y1={yy} x2={w - pad} y2={yy} stroke="var(--rule-soft)" strokeWidth="1" />
            <text x={pad - 6} y={yy + 3} fontSize="10" textAnchor="end" fontFamily="var(--mono)" fill="var(--ink-3)">
              {Math.round(y*100)}%
            </text>
          </g>
        );
      })}
      <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i}
          cx={pad + i*stepX}
          cy={h - pad - ((v - min) / (max - min)) * (h - pad*2)}
          r={i === data.length - 1 ? 4 : 2.5}
          fill={i === data.length - 1 ? 'var(--green)' : 'var(--card)'}
          stroke="var(--green)" strokeWidth="1.5" />
      ))}
      {['12 sem','9 sem','6 sem','3 sem','Hoy'].map((label, i) => {
        const x = pad + i * ((w - pad*2) / 4);
        return (
          <text key={label} x={x} y={h - 8} fontSize="10" textAnchor="middle" fontFamily="var(--mono)" fill="var(--ink-3)">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function StatsMobile() {
  const hasGrade = window.STATS.predictedGrade != null;
  return (
    <div style={{ padding: '8px 20px 24px' }}>
      <div className="card" style={{
        padding: 20, marginBottom: 16,
        background: hasGrade ? 'linear-gradient(180deg, var(--green-tint), var(--card))' : 'var(--card)',
      }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Nota estimada</div>
        <div className="serif num" style={{
          fontSize: 64, lineHeight: 1,
          color: hasGrade ? 'var(--green)' : 'var(--ink-3)',
          letterSpacing: '-0.02em',
        }}>{hasGrade ? String(window.STATS.predictedGrade).replace('.', ',') : '—'}</div>
        <div className="label-sm" style={{ marginTop: 6 }}>
          {hasGrade ? 'Nota de corte 6,50' : 'Sin datos todavía.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          ['Aciertos',    window.STATS.answered ? `${Math.round(window.STATS.accuracy * 100)} %` : '—'],
          ['Respondidas', window.STATS.answered.toLocaleString('es-ES')],
          ['Racha',       `${window.STATS.streakDays} días`],
          ['Horas',       `${window.STATS.hoursStudied} h`],
        ].map(([l, v]) => (
          <div key={l} className="card" style={{ padding: 16 }}>
            <div className="label-sm">{l}</div>
            <div className="serif num" style={{ fontSize: 24 }}>{v}</div>
          </div>
        ))}
      </div>

      {window.STATS.weekly.length >= 2 && (
        <>
          <h2 className="serif" style={{ fontSize: 17, fontWeight: 500, margin: '0 0 8px' }}>
            Evolución · {window.STATS.weekly.length} sem.
          </h2>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <Sparkline data={window.STATS.weekly} w={314} h={70} />
          </div>
        </>
      )}

      <h2 className="serif" style={{ fontSize: 17, fontWeight: 500, margin: '0 0 8px' }}>
        Específico · primeros 8 temas
      </h2>
      <div className="card">
        {window.TOPICS_SPECIFIC.slice(0, 8).map((t, i) => (
          <div key={t.id} style={{ padding: '14px', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
              <span style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span className="mono" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{t.code}</span>
                {t.title.split('(')[0].trim()}
              </span>
              <span className="num" style={{ fontSize: 14, flexShrink: 0, color: t.answered ? 'var(--ink)' : 'var(--ink-3)' }}>
                {t.answered ? `${Math.round(t.accuracy*100)}%` : '—'}
              </span>
            </div>
            <BarTrack value={t.accuracy} tone={t.accuracy < 0.65 ? 'var(--ochre)' : 'var(--green)'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewMobile({ go }) {
  const failed = window.FAILED_QUESTIONS;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 20px 14px' }}>
        <h1 className="serif" style={{ fontSize: 30, margin: '4px 0 0', fontWeight: 400, lineHeight: 1.1 }}>
          {failed.length === 0
            ? <>Sin preguntas<br/>falladas todavía.</>
            : <>{failed.length} {failed.length === 1 ? 'pregunta' : 'preguntas'}<br/>por repasar</>}
        </h1>
      </div>

      {failed.length === 0 ? (
        <div style={{
          padding: '20px 20px 0', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55,
        }}>
          Conforme estudies, las preguntas que falles aparecerán aquí.
          <button className="btn btn-primary btn-lg" style={{
            width: '100%', justifyContent: 'center', marginTop: 24,
          }} onClick={() => go('topics')}>
            <Icon name="book" size={16} /> Empezar por el temario
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: '0 20px' }}>
            {failed.map((q, i) => (
              <div key={q.id} style={{
                padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="mono label-sm">{q.id}</span>
                  <span className="label-sm">{q.lastFailed}</span>
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.45, marginBottom: 8 }}>{q.prompt}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label-sm">{q.topic}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: q.failedTimes }).map((_, j) => (
                      <span key={j} style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--terra)' }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            position: 'sticky', bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
            padding: '12px 20px', borderTop: '1px solid var(--rule)',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            marginTop: 12,
          }}>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => go('study')}>
              <Icon name="refresh" size={16} /> Repasar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { Review, Stats });
