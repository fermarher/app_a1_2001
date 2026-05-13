// config.js — runtime configuration.
//
// All identifiers below are PUBLIC client identifiers. None of them are
// secrets. Security comes from Firestore rules + OAuth authorized origins.
//
// ─── GOOGLE_CLIENT_ID ──────────────────────────────────────────────────────
// OAuth 2.0 Web client ID from Google Cloud Console.
// Setup:
//   1. https://console.cloud.google.com/ → APIs & Services → Credentials
//   2. "Create credentials" → "OAuth client ID" → type "Web application"
//   3. Authorized JavaScript origins (one per env):
//        https://fermarher.github.io
//        http://localhost:5173
//   4. Copy the "Client ID" (looks like 1234567890-abc...apps.googleusercontent.com)
// While this is empty, the login screen offers a "Continuar como invitado"
// fallback that stores progress locally without authentication.
window.GOOGLE_CLIENT_ID = '';

// ─── FIREBASE_CONFIG ───────────────────────────────────────────────────────
// Web app config from a Firebase project. Enables cross-device progress
// sync via Firestore. With this empty the app still works — it just keeps
// progress in localStorage on the current device.
//
// Setup:
//   1. https://console.firebase.google.com/ → "Add project" (or pick existing)
//   2. Build → Authentication → "Get started" → Sign-in method →
//      enable "Google" provider (uses the same OAuth client as above)
//   3. Build → Firestore Database → "Create database" → start in
//      production mode, pick the region closest to you (eu-west)
//   4. Replace Firestore rules (Rules tab) with:
//
//        rules_version = '2';
//        service cloud.firestore {
//          match /databases/{database}/documents {
//            match /users/{userId} {
//              allow read, write: if request.auth != null && request.auth.uid == userId;
//            }
//          }
//        }
//
//   5. Project settings (⚙) → General → "Your apps" → add a Web app (</>)
//   6. Copy the firebaseConfig object and paste its values below.
//   7. Add the Firebase auth domain to the OAuth client's Authorized origins
//      if it's different from your site (usually not necessary for popup mode).
window.FIREBASE_CONFIG = null;
// Example shape (uncomment and fill in to enable):
// window.FIREBASE_CONFIG = {
//   apiKey: 'AIzaSy…',
//   authDomain: 'opositar-ja.firebaseapp.com',
//   projectId: 'opositar-ja',
//   storageBucket: 'opositar-ja.appspot.com',
//   messagingSenderId: '1234567890',
//   appId: '1:1234567890:web:abc123',
// };
