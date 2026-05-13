// auth.js — Google Sign-In integration.
//
// Uses Google Identity Services (script loaded via index.html). When the user
// clicks the rendered Google button, Google returns a credential JWT. We
// decode it client-side to get the user's email/name/picture/sub and hand the
// result to window.Store.
//
// If window.GOOGLE_CLIENT_ID is empty (default), Google sign-in is disabled
// and the app falls back to a "guest" mode (still persisted locally).

(function () {
  const SUB_GUEST = null; // null => not authed; guest sessions use Store.userId === 'guest'

  function decodeJwt(token) {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  function waitForGoogle(maxMs = 5000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (window.google?.accounts?.id) return resolve(true);
        if (Date.now() - start > maxMs) return resolve(false);
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  let initialised = false;
  async function init() {
    if (initialised) return true;
    if (!window.GOOGLE_CLIENT_ID) return false;
    const ok = await waitForGoogle();
    if (!ok) return false;
    window.google.accounts.id.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    initialised = true;
    return true;
  }

  async function handleCredential(resp) {
    const payload = decodeJwt(resp.credential);
    if (!payload) return;

    // If Firebase is configured, exchange the Google ID token for a Firebase
    // session so Firestore sync can use auth.uid. The Firebase UID becomes
    // the canonical `sub` we store progress under — this way data follows
    // the user across devices once Firestore takes over.
    let sub = payload.sub;
    if (window.Sync && window.Sync.isConfigured()) {
      const fbUser = await window.Sync.signInWithGoogleCredential(resp.credential);
      if (fbUser?.uid) sub = fbUser.uid;
      else console.warn('[auth] Firebase sign-in returned no user; continuing with Google sub.');
    }

    window.Store.setUser({
      sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || null,
      iat: payload.iat || null,
    });
  }

  async function renderButton(container, opts = {}) {
    const ok = await init();
    if (!ok || !container) return false;
    window.google.accounts.id.renderButton(container, {
      type: opts.type || 'standard',
      theme: opts.theme || 'outline',
      size: opts.size || 'large',
      text: opts.text || 'signin_with',
      shape: opts.shape || 'rectangular',
      logo_alignment: 'left',
      width: opts.width || 280,
    });
    return true;
  }

  function signInAsGuest() {
    window.Store.setUser({
      sub: 'guest',
      email: null,
      name: 'Invitado',
      picture: null,
      iat: Math.floor(Date.now() / 1000),
      guest: true,
    });
  }

  function signOut() {
    if (window.google?.accounts?.id) {
      try { window.google.accounts.id.disableAutoSelect(); } catch {}
    }
    if (window.Sync) {
      try { window.Sync.signOut(); } catch {}
    }
    window.Store.clearUser();
  }

  window.Auth = { init, renderButton, signInAsGuest, signOut, isConfigured: () => !!window.GOOGLE_CLIENT_ID };
})();
