// components.jsx — shared UI primitives + tiny hooks

function Logo({ size = 18, color = 'var(--green)' }) {
  // Abstract Andalusian arch glyph (semicircle on stem) — original mark.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 21V12a8 8 0 1 1 16 0v9" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="6" x2="12" y2="14" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function Wordmark({ size = 16, tone = 'var(--ink)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Logo size={size + 2} />
      <span className="serif" style={{
        fontSize: size, letterSpacing: '-0.02em', color: tone, fontWeight: 500,
      }}>
        Opositar<span style={{ color: 'var(--green)' }}>·</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: size - 5, letterSpacing: '0.12em',
          textTransform: 'uppercase', marginLeft: 4, color: 'var(--ink-2)',
        }}>JA</span>
      </span>
    </div>
  );
}

function Icon({ name, size = 16, stroke = 1.6, color = 'currentColor' }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (name) {
    case 'book':       return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/></svg>;
    case 'refresh':    return <svg {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 20v-4h4"/></svg>;
    case 'timer':      return <svg {...p}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/><path d="M12 2v3"/></svg>;
    case 'chart':      return <svg {...p}><path d="M3 21h18"/><path d="M6 17V10"/><path d="M11 17V6"/><path d="M16 17v-8"/><path d="M21 17v-5"/></svg>;
    case 'flag':       return <svg {...p}><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>;
    case 'check':      return <svg {...p}><path d="M5 12l4 4 10-10"/></svg>;
    case 'x':          return <svg {...p}><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>;
    case 'arrow-r':    return <svg {...p}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>;
    case 'arrow-l':    return <svg {...p}><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>;
    case 'search':     return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'filter':     return <svg {...p}><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>;
    case 'dot':        return <svg {...p}><circle cx="12" cy="12" r="3" fill={color}/></svg>;
    case 'menu':       return <svg {...p}><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>;
    case 'cog':        return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.8a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.5a7 7 0 0 0-2.1 1.2l-2.4-.8-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.8c.6.5 1.3.9 2.1 1.2L10 21h4l.4-2.5c.8-.3 1.5-.7 2.1-1.2l2.4.8 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>;
    case 'bookmark':   return <svg {...p}><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>;
    case 'spark':      return <svg {...p}><path d="M3 17l5-6 4 4 8-10"/></svg>;
    default: return null;
  }
}

function Pill({ children, tone = 'default' }) {
  const cls = 'tag' + (
    tone === 'green' ? ' tag-green' :
    tone === 'ochre' ? ' tag-ochre' :
    tone === 'terra' ? ' tag-terra' :
    tone === 'outline' ? ' tag-outline' : ''
  );
  return <span className={cls}>{children}</span>;
}

function BarTrack({ value, tone = 'var(--green)' }) {
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: tone }} />
    </div>
  );
}

function Sparkline({ data, w = 240, h = 60, stroke = 'var(--green)' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 8) - 4}`).join(' ');
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points={area} fill="var(--green-tint)" opacity="0.7" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i}
          cx={i * stepX}
          cy={h - ((v - min) / range) * (h - 8) - 4}
          r={i === data.length - 1 ? 3 : 1.5}
          fill={stroke} />
      ))}
    </svg>
  );
}

// Shared little stat cell used across multiple screens.
function Stat({ label, value, tone }) {
  return (
    <div>
      <div className="label-sm" style={{ marginBottom: 4 }}>{label}</div>
      <div className="serif num" style={{
        fontSize: 26,
        color: tone === 'green' ? 'var(--green)' : 'var(--ink)',
      }}>{value}</div>
    </div>
  );
}

// useMobile — true when viewport is below the desktop breakpoint.
function useMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches : false
  );
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);
  return isMobile;
}

Object.assign(window, { Logo, Wordmark, Icon, Pill, BarTrack, Sparkline, Stat, useMobile });
