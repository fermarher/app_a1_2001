// firebase-sync.js — Cross-device sync via Firebase Auth + Firestore.
//
// Architecture:
//   • One Firestore document per user at users/{uid} holds the entire
//     bucket: { perQuestion, exams }.
//   • Google sign-in → Firebase Auth via signInWithCredential.
//   • On auth ready, subscribe to the user's doc (real-time updates) and
//     merge incoming snapshots into the local store.
//   • Local changes fire 'storechange' → debounced upload.
//   • The last-known remote payload is cached so an incoming snapshot we
//     produced ourselves doesn't trigger a redundant upload.
//
// Without FIREBASE_CONFIG the file becomes a no-op and the app works
// exactly as before (localStorage only).

(function () {
  let app = null;
  let auth = null;
  let db = null;
  let initialised = false;

  let unsubscribeDoc = null;          // firestore listener
  let uploadTimer = null;             // debounce handle
  let lastRemoteJSON = null;          // payload last seen from Firestore (avoid echo)
  let suppressLocalEvent = false;     // local change came from a remote import → don't upload

  function isConfigured() {
    return !!(window.FIREBASE_CONFIG && window.firebase);
  }

  function init() {
    if (initialised) return true;
    if (!isConfigured()) return false;
    try {
      app = window.firebase.initializeApp(window.FIREBASE_CONFIG);
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      initialised = true;
      // Watch auth state. When Firebase remembers a session across page
      // loads, this fires with the persisted user and we attach the
      // Firestore listener automatically.
      auth.onAuthStateChanged(handleAuthChange);
      return true;
    } catch (e) {
      console.warn('[firebase-sync] init failed:', e);
      return false;
    }
  }

  // ─── Auth bridge: Google ID token → Firebase Auth ────────────────────────
  async function signInWithGoogleCredential(idToken) {
    if (!init()) return null;
    try {
      const provider = window.firebase.auth.GoogleAuthProvider;
      const cred = provider.credential(idToken);
      const result = await auth.signInWithCredential(cred);
      return result.user;
    } catch (e) {
      console.warn('[firebase-sync] signInWithCredential failed:', e);
      return null;
    }
  }

  async function signOut() {
    if (!initialised || !auth) return;
    try { await auth.signOut(); } catch {}
  }

  function handleAuthChange(fbUser) {
    if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }
    lastRemoteJSON = null;
    if (!fbUser) return;

    // Subscribe to the user's doc. The first snapshot delivers persisted
    // data; subsequent snapshots reflect updates from other devices.
    const ref = db.collection('users').doc(fbUser.uid);
    unsubscribeDoc = ref.onSnapshot(
      { includeMetadataChanges: false },
      (snap) => onRemoteSnapshot(fbUser.uid, snap.exists ? snap.data() : null),
      (err) => console.warn('[firebase-sync] onSnapshot error:', err),
    );
  }

  function onRemoteSnapshot(uid, remote) {
    // Only act if Store still considers this uid the current user. If the
    // user signed out or switched accounts mid-flight, drop the snapshot.
    if (window.Store.userId() !== uid) return;

    const remoteBucket = normaliseBucket(remote);
    const remoteJSON = JSON.stringify(remoteBucket);
    if (remoteJSON === lastRemoteJSON) return; // we just wrote this — ignore echo
    lastRemoteJSON = remoteJSON;

    const local = window.Store.exportBucket();
    const merged = mergeBuckets(local, remoteBucket);
    const localJSON = JSON.stringify(local);
    const mergedJSON = JSON.stringify(merged);

    if (mergedJSON !== localJSON) {
      // Apply remote (or merged) into the store without re-triggering an upload.
      suppressLocalEvent = true;
      window.Store.importBucket(merged);
    }
    if (mergedJSON !== remoteJSON) {
      // Local had something the server lacked — push the merged view.
      uploadDebounced(merged);
    }
  }

  function normaliseBucket(raw) {
    if (!raw) return { perQuestion: {}, exams: [] };
    return {
      perQuestion: raw.perQuestion || {},
      exams: Array.isArray(raw.exams) ? raw.exams : [],
    };
  }

  function mergeBuckets(a, b) {
    const out = { perQuestion: {}, exams: [] };
    const keys = new Set([
      ...Object.keys(a.perQuestion || {}),
      ...Object.keys(b.perQuestion || {}),
    ]);
    for (const k of keys) {
      const left = a.perQuestion?.[k];
      const right = b.perQuestion?.[k];
      if (!left) out.perQuestion[k] = right;
      else if (!right) out.perQuestion[k] = left;
      else out.perQuestion[k] = (left.lastAt || '') >= (right.lastAt || '') ? left : right;
    }
    const byId = {};
    for (const e of [...(a.exams || []), ...(b.exams || [])]) {
      if (e && e.id) byId[e.id] = e;
    }
    out.exams = Object.values(byId)
      .sort((x, y) => (y.finishedAt || '').localeCompare(x.finishedAt || ''))
      .slice(0, 50);
    return out;
  }

  // ─── Upload (debounced) ──────────────────────────────────────────────────
  function uploadDebounced(bucket) {
    if (!initialised || !auth?.currentUser) return;
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(() => upload(bucket), 600);
  }

  async function upload(bucket) {
    if (!initialised || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    if (window.Store.userId() !== uid) return;          // user changed underneath us
    const payload = normaliseBucket(bucket);
    try {
      await db.collection('users').doc(uid).set(payload, { merge: false });
      lastRemoteJSON = JSON.stringify(payload);         // remember what we just wrote
    } catch (e) {
      console.warn('[firebase-sync] upload failed:', e);
    }
  }

  // Listen for local store changes and queue uploads. The same event also
  // fires when we import from remote — `suppressLocalEvent` guards that case.
  window.addEventListener('storechange', () => {
    if (!initialised || !auth?.currentUser) return;
    if (suppressLocalEvent) { suppressLocalEvent = false; return; }
    const user = window.Store.user();
    if (!user || user.guest) return;
    if (user.sub !== auth.currentUser.uid) return;      // mismatched user
    uploadDebounced(window.Store.exportBucket());
  });

  window.Sync = {
    init,
    isConfigured,
    signInWithGoogleCredential,
    signOut,
    isReady: () => initialised && !!auth?.currentUser,
    currentFirebaseUser: () => auth?.currentUser || null,
  };

  // Initialise on load. onAuthStateChanged will pick up persisted sessions.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
