// app.jsx — App shell + routing + auth gate.
//
// On first paint we check window.Store.user(). If absent, the entire app is
// gated behind a sign-in screen (Google or guest fallback). Once signed in,
// the shell renders normally.

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
  useStoreVersion();
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

  // Auth gate: until we have a user (real or guest), the rest of the app stays
  // hidden. This also avoids leaking another user's progress on shared devices.
  if (!window.Store.isAuthed()) {
    return <LoginScreen />;
  }

  const Screen = SCREEN[route];
  const chrome = ROUTES[route].chrome;
  if (chrome === 'full') return <Screen go={go} />;

  return mobile
    ? <MobileShell route={route} go={go}><Screen go={go} /></MobileShell>
    : <DesktopShell route={route} go={go}><Screen go={go} /></DesktopShell>;
}

// ─── Login / sign-in screen ───────────────────────────────────────────────
function LoginScreen() {
  const btnRef = React.useRef(null);
  const [googleReady, setGoogleReady] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.Auth.isConfigured()) return;
      const ok = await window.Auth.renderButton(btnRef.current);
      if (cancelled) return;
      setGoogleReady(ok);
      if (!ok) setError('No se pudo cargar el botón de Google. Comprueba la conexión.');
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', background: 'var(--paper)',
    }}>
      <div style={{
        maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={26} />
          <span className="serif" style={{ fontSize: 22, letterSpacing: '-0.02em', fontWeight: 500 }}>
            Opositar<span style={{ color: 'var(--green)' }}>·</span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 14, letterSpacing: '0.12em',
              textTransform: 'uppercase', marginLeft: 4, color: 'var(--ink-2)',
            }}>JA</span>
          </span>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Cuerpo Superior Facultativo · A1.2001</div>
          <h1 className="serif" style={{
            fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: 1.1, margin: 0, fontWeight: 400,
          }}>
            Inicia sesión para<br/>guardar tu progreso.
          </h1>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>
          Tus respuestas, preguntas falladas y simulacros se guardan en este
          navegador, vinculados a la cuenta con la que entres.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {window.Auth.isConfigured() ? (
            <>
              <div ref={btnRef} style={{ minHeight: 44 }} />
              {!googleReady && !error && (
                <div className="label-sm">Cargando inicio de sesión de Google…</div>
              )}
              {error && (
                <div className="label-sm" style={{ color: 'var(--terra)' }}>{error}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                <hr className="hr-soft" style={{ flex: 1 }} />
                <span className="label-sm" style={{ fontSize: 11.5 }}>O BIEN</span>
                <hr className="hr-soft" style={{ flex: 1 }} />
              </div>
            </>
          ) : (
            <div className="card" style={{
              padding: 14, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)',
              background: 'var(--paper-2)',
            }}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: 'var(--ink)' }}>
                Inicio de sesión con Google pendiente de configurar.
              </div>
              Sigue las instrucciones en <span className="mono">config.js</span> /
              README para añadir tu <span className="mono">GOOGLE_CLIENT_ID</span>.
              Mientras tanto puedes usar el modo invitado:
            </div>
          )}

          <button className="btn btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => window.Auth.signInAsGuest()}>
            <Icon name="arrow-r" size={14} /> Continuar como invitado
          </button>
        </div>

        <div className="label-sm" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          El modo invitado guarda tu progreso solo en este navegador. Si
          inicias sesión con Google, el progreso queda vinculado a tu cuenta
          (y separado por usuario en el mismo dispositivo).
        </div>
      </div>
    </div>
  );
}

// ─── Profile widget (sidebar + mobile header) ─────────────────────────────
function ProfileBadge({ compact }) {
  const user = window.Store.user();
  if (!user) return null;
  const initial = (user.name || user.email || '·').slice(0, 1).toUpperCase();
  if (compact) {
    // Mobile: just the avatar; tap to sign out.
    return (
      <button onClick={() => window.confirm('¿Cerrar sesión?') && window.Auth.signOut()} style={{
        all: 'unset', cursor: 'pointer',
        width: 32, height: 32, borderRadius: '50%',
        background: user.picture ? `center/cover no-repeat url(${user.picture})` : 'var(--green-tint)',
        color: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 14,
      }}>{user.picture ? '' : initial}</button>
    );
  }
  // Desktop: avatar + name + sign-out icon.
  return (
    <div style={{
      paddingTop: 16, borderTop: '1px solid var(--rule)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: user.picture ? `center/cover no-repeat url(${user.picture})` : 'var(--green-tint)',
        color: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 12, flexShrink: 0,
      }}>{user.picture ? '' : initial}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.2, minWidth: 0, flex: 1 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name || user.email || 'Invitado'}
        </div>
        <div className="label-sm">{user.guest ? 'Modo invitado' : 'Convocatoria 2026'}</div>
      </div>
      <button onClick={() => window.confirm('¿Cerrar sesión?') && window.Auth.signOut()}
        title="Cerrar sesión" style={{
          all: 'unset', cursor: 'pointer', color: 'var(--ink-3)', padding: 4,
        }}>
        <Icon name="arrow-r" size={14} />
      </button>
    </div>
  );
}

function DesktopShell({ route, go, children }) {
  const items = [
    { k: 'study',  i: 'book',    t: 'Estudio' },
    { k: 'review', i: 'refresh', t: 'Repaso de falladas' },
    { k: 'exam',   i: 'timer',   t: 'Examen cronometrado' },
    { k: 'stats',  i: 'chart',   t: 'Estadísticas' },
  ];

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
          <div className="eyebrow" style={{
            marginBottom: 8, paddingLeft: 8, display: 'flex', justifyContent: 'space-between',
          }}>
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

        <div style={{ marginTop: 'auto' }}>
          <ProfileBadge />
        </div>
      </aside>

      <main className="shell-main">{children}</main>
    </div>
  );
}

function MobileShell({ route, go, children }) {
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
          <ProfileBadge compact />
        </div>
      ) : (
        <div className="mobile-header" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <Wordmark size={14} />
          <ProfileBadge compact />
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
