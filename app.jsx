// app.jsx — App shell + routing
//
// Routes ("screens") rendered without page reload. URL hash kept in sync so
// reload + back/forward work. Sidebar on desktop; bottom tab bar on mobile.
// Screens that take over the whole viewport (Study, Exam) render full-bleed
// without the shell chrome — driven by `route.chrome`.

const ROUTES = {
  dashboard: { label: 'Inicio',              icon: 'book',     chrome: 'shell' },
  study:     { label: 'Estudio',             icon: 'book',     chrome: 'full' },
  review:    { label: 'Repaso',              icon: 'refresh',  chrome: 'shell' },
  exam:      { label: 'Examen',              icon: 'timer',    chrome: 'full' },
  stats:     { label: 'Estadísticas',        icon: 'chart',    chrome: 'shell' },
  topics:    { label: 'Temario',             icon: 'menu',     chrome: 'shell' },
};

const SCREEN = {
  dashboard: Dashboard,
  study:     Study,
  review:    Review,
  exam:      Exam,
  stats:     Stats,
  topics:    Topics,
};

function getInitialRoute() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  return ROUTES[h] ? h : 'dashboard';
}

function App() {
  const mobile = useMobile();
  const [route, setRoute] = React.useState(getInitialRoute);

  const go = React.useCallback((next) => {
    if (!ROUTES[next]) return;
    setRoute(next);
    if (location.hash !== `#/${next}`) location.hash = `#/${next}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  React.useEffect(() => {
    const onHash = () => {
      const h = (location.hash || '').replace(/^#\/?/, '');
      if (ROUTES[h]) setRoute(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const Screen = SCREEN[route];
  const chrome = ROUTES[route].chrome;

  // Full-bleed screens (Study, Exam) own their own header and exit via `go`.
  if (chrome === 'full') {
    return <Screen go={go} />;
  }

  return mobile
    ? <MobileShell route={route} go={go}><Screen go={go} /></MobileShell>
    : <DesktopShell route={route} go={go}><Screen go={go} /></DesktopShell>;
}

function DesktopShell({ route, go, children }) {
  // Sidebar nav primary modes shown in the design; "topics" links into the bloque grid.
  const items = [
    { k: 'study',  i: 'book',    t: 'Estudio' },
    { k: 'review', i: 'refresh', t: 'Repaso de falladas' },
    { k: 'exam',   i: 'timer',   t: 'Examen cronometrado' },
    { k: 'stats',  i: 'chart',   t: 'Estadísticas' },
  ];

  // The dashboard isn't in "Práctica" — it's the home, reachable through the wordmark.
  return (
    <div className="shell">
      <aside className="sidebar">
        <button onClick={() => go('dashboard')} style={{
          all: 'unset', cursor: 'pointer', padding: '2px 4px',
        }}>
          <Wordmark size={16} />
        </button>

        <div className="sidebar-group">
          <div className="eyebrow" style={{ marginBottom: 8, paddingLeft: 8 }}>Práctica</div>
          {items.map(it => (
            <button key={it.k} className={`sidebar-item${route === it.k ? ' active' : ''}`}
              onClick={() => go(it.k)}>
              <Icon name={it.i} size={16} />
              <span>{it.t}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-group">
          <div className="eyebrow" style={{ marginBottom: 8, paddingLeft: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Específico</span>
            <button onClick={() => go('topics')} style={{
              all: 'unset', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 10.5, letterSpacing: '0.12em',
            }}>VER ▸</button>
          </div>
          {window.TOPICS_SPECIFIC.slice(0, 6).map(t => (
            <button key={t.id} className="sidebar-sub"
              onClick={() => { window.setStudyTema(t.section, t.num); go('study'); }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', minWidth: 22 }}>{t.num}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title.split('.')[0]}
              </span>
            </button>
          ))}
          <button onClick={() => go('topics')} style={{
            all: 'unset', cursor: 'pointer', padding: '6px 8px',
            fontSize: 11.5, color: 'var(--ink-3)',
          }}>+{window.TOPICS_SPECIFIC.length - 6} temas específicos…</button>
        </div>

        <div style={{
          marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--rule)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--green-tint)',
            color: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 12,
          }}>·</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.2 }}>
            <div>Sesión local</div>
            <div className="label-sm">Convocatoria 2026</div>
          </div>
        </div>
      </aside>

      <main className="shell-main">{children}</main>
    </div>
  );
}

function MobileShell({ route, go, children }) {
  // Header title comes from route metadata. Dashboard uses no header to leave
  // room for the editorial "Buenos días, María." moment.
  const showHeader = route !== 'dashboard';
  const headerTitle = ROUTES[route].label;

  const tabs = [
    { k: 'dashboard', i: 'book',    t: 'Inicio' },
    { k: 'review',    i: 'refresh', t: 'Falladas' },
    { k: 'exam',      i: 'timer',   t: 'Examen' },
    { k: 'stats',     i: 'chart',   t: 'Stats' },
  ];

  return (
    <div>
      {showHeader ? (
        <div className="mobile-header">
          <button onClick={() => go('dashboard')} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
            <Icon name="arrow-l" size={18} color="var(--ink-2)" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{headerTitle}</span>
          <button style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
            <Icon name={route === 'stats' ? 'cog' : route === 'review' ? 'filter' : 'menu'} size={18} color="var(--ink-2)" />
          </button>
        </div>
      ) : (
        <div className="mobile-header" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <Wordmark size={14} />
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--green-tint)',
            color: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 14,
          }}>·</div>
        </div>
      )}

      <div className="mobile-content">{children}</div>

      <nav className="tab-bar">
        {tabs.map(t => (
          <button key={t.k} className={`tab${route === t.k ? ' active' : ''}`} onClick={() => go(t.k)}>
            <Icon name={t.i} size={20} />
            <span>{t.t}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
