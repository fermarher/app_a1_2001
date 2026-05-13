# Opositar · JA

App de preguntas tipo test para preparar la oposición al **Cuerpo Superior
Facultativo, opción Arquitectura Superior (A1.2001)** de la Junta de Andalucía
(Resolución de 27 de mayo de 2024 · BOJA núm. 107).

Banco actual: **105 temas** (35 Común + 70 Específico) · **2 562 preguntas**
clasificadas por tema, con referencia a la procedencia de cada pregunta.

## Funcionalidades

- **Modo estudio** — sin tiempo, por tema. Pulsa una respuesta y *Comprobar*
  para ver la respuesta correcta y su referencia normativa.
- **Temario** — los 105 temas en dos pestañas (Común / Específico), con título
  completo, número de preguntas por tema y porcentaje de aciertos.
- **Repaso de falladas** — listado de las preguntas falladas con su contador
  de reincidencia (vacío al empezar).
- **Examen cronometrado** — prototipo del formato oficial (100 preguntas ·
  90 min · corrección con descuento por fallo).
- **Estadísticas** — KPIs globales, evolución semanal del porcentaje de
  aciertos y predicción de nota.
- **Diseño responsive** — sidebar en escritorio, tab bar en móvil. Sin marcos
  decorativos: la app se adapta al viewport real.
- **Atajos de teclado** en modo estudio: `1`–`4` seleccionar respuesta, `↵`
  comprobar/siguiente, `← →` navegar entre preguntas, `F` marcar dudosa,
  `Esc` salir.

## Estructura del proyecto

```
.
├── index.html             ← punto de entrada (carga React + Babel standalone)
├── styles.css             ← tokens de diseño (verde institucional · papel cálido)
├── syllabus.js            ← banco completo (1.3 MB) generado a partir del docx
├── data.js                ← metadatos de temas + estado de progreso (a 0)
├── config.js              ← runtime config (GOOGLE_CLIENT_ID, FIREBASE_CONFIG)
├── storage.js             ← persistencia localStorage + stats derivadas
├── auth.js                ← Google Sign-In + modo invitado
├── firebase-sync.js       ← sync con Firestore (cross-device)
├── components.jsx         ← primitivas: Logo, Icon, Pill, BarTrack, Sparkline…
├── screen-dashboard.jsx
├── screen-topics.jsx
├── screen-study.jsx
├── screen-exam.jsx
├── screen-review-stats.jsx
└── app.jsx                ← shell, sidebar/tab-bar, routing (hash) + login gate
```

Cada `.jsx` se transpila en el navegador con
[Babel standalone](https://babeljs.io/docs/babel-standalone) — sin paso de
build. Las dependencias (React 18, Babel, las fuentes de Google) se cargan
desde CDN.

## Ejecución local

Cualquier servidor estático sirve. Ejemplos:

```bash
# Python (incluido en macOS)
python3 -m http.server 5173

# Node
npx serve .
```

Después abre <http://localhost:5173>.

## Sistema visual

- **Tipografía** — Source Serif 4 (display) · IBM Plex Sans (UI) · IBM Plex
  Mono (datos).
- **Color** — verde institucional `#2B5F3F`, papel cálido `#FAF7F2`, ocre
  `#B08436` para *dudosa*, terracota `#A04A36` para fallo.
- **Acento andaluz** — solo en una franja muy fina (top de algunas
  pantallas), sin elementos decorativos.

## Login y persistencia

La app está **gatada por un login**. Hay dos modos de entrar:

### 1. Google Sign-In (recomendado)

Sigue estos pasos una sola vez para activar el inicio de sesión con Google:

1. Crea (o reutiliza) un proyecto en
   [Google Cloud Console](https://console.cloud.google.com/).
2. *APIs & Services* → *OAuth consent screen*:
   - User type: **External**
   - Rellena nombre de app, email de soporte y email del desarrollador.
   - En *Test users* añade tu propio Gmail mientras la app esté en modo
     "Testing" (o publícala para uso general).
3. *APIs & Services* → *Credentials* → **Create credentials** →
   **OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `https://fermarher.github.io`
     - `http://localhost:5173` (o el puerto que uses en local)
4. Copia el *Client ID* (formato `…apps.googleusercontent.com`) y pégalo en
   [`config.js`](config.js):

   ```js
   window.GOOGLE_CLIENT_ID = '1234567890-abc…apps.googleusercontent.com';
   ```

5. Sube el cambio. Al recargar la app aparecerá el botón "Iniciar sesión con
   Google" en la pantalla de bienvenida.

### 2. Modo invitado

Si no quieres configurar OAuth (o como fallback), la pantalla de login
incluye *"Continuar como invitado"*. El progreso se guarda igualmente en
`localStorage`, pero queda anclado a ese navegador y se mezcla con cualquier
otro invitado que use el mismo dispositivo.

### ¿Dónde se guarda el progreso?

Por defecto todo va a `localStorage` bajo la clave `opositar:v1`, dividido
por `userId`:

- Usuario autenticado → `userId = sub` (Firebase UID si Firestore está
  activo; en su defecto, el `sub` del JWT de Google).
- Invitado → `userId = 'guest'`.

Cuando un invitado inicia sesión con Google por primera vez, su progreso
"guest" se migra automáticamente a la cuenta nueva (solo si la cuenta no
tenía datos previos).

## Sincronización entre dispositivos (Firestore — opcional)

Si configuras Firebase, el progreso se sincroniza en tiempo real entre todos
los dispositivos donde inicies sesión con la misma cuenta de Google. Sin
configuración el modo local sigue funcionando igual.

### Setup

1. **Crea un proyecto Firebase**: <https://console.firebase.google.com/> →
   *Add project*. Puedes reutilizar el mismo proyecto donde creaste el
   OAuth Client ID (más fácil) o uno separado.

2. **Habilita Authentication**:
   *Build → Authentication → Get started → Sign-in method* → habilita
   **Google**. Si tu OAuth Client ID está en el mismo proyecto Firebase lo
   reconoce automáticamente; si está en otro, copia el Web client ID +
   secret (Firebase lo pedirá).

3. **Crea Firestore Database**:
   *Build → Firestore Database → Create database*.
   - Empezar en **modo producción** (rules lockdown por defecto).
   - Elige una región cercana (p. ej. `eur3` o `europe-west1`).

4. **Pega las reglas de seguridad** (pestaña *Rules*):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

   Estas reglas garantizan que cada usuario solo puede leer/escribir su
   propio documento (`users/{su_uid}`), nunca el de otra persona.

5. **Registra la web app**:
   *Project settings (⚙) → General → Your apps → Add app (</>)*.
   Copia el objeto `firebaseConfig` que Firebase muestra al final.

6. **Pega los valores en [`config.js`](config.js)**:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: 'AIzaSy…',
     authDomain: 'opositar-ja.firebaseapp.com',
     projectId: 'opositar-ja',
     storageBucket: 'opositar-ja.appspot.com',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abc123',
   };
   ```

7. **(Si tu OAuth Client ID es de otro proyecto Google Cloud)** añade los
   dominios de Firebase a los *Authorized origins* del OAuth Client:
   - `https://<TU-PROYECTO>.firebaseapp.com`
   - `https://<TU-PROYECTO>.web.app`

   Si todo está en el mismo proyecto, este paso se omite.

### Cómo funciona

- Cada usuario tiene un único documento Firestore: `users/{firebase_uid}`
  con la forma `{ perQuestion: {...}, exams: [...] }`.
- Al iniciar sesión, la app se suscribe al documento en tiempo real
  (`onSnapshot`). Cualquier cambio desde otro dispositivo se aplica
  instantáneamente y dispara el re-render.
- Los cambios locales se acumulan y se suben con un debounce de ~600 ms,
  para no saturar Firestore con escrituras por cada tecla.
- La fusión sigue **last-write-wins por pregunta** según el campo `lastAt`,
  y unión por `id` para el historial de simulacros.
- Si los SDK de Firebase fallan en cargar (sin red, bloqueado por CSP, …)
  la app cae con elegancia al modo local: nada se rompe, sólo se pierde la
  sincronización temporal.

### Cuotas

El plan gratuito de Firebase (Spark) ofrece:

- **20 000 escrituras** y **50 000 lecturas** por día en Firestore.
- 1 GiB de almacenamiento.

Un estudio intensivo de 200 preguntas al día genera ~200 escrituras
(después del debounce, en realidad muchas menos: una cada ~600 ms de
inactividad). Con 100 usuarios diarios el plan gratuito sobra.

## Examen cronometrado

- El simulacro se genera al azar: **una pregunta por cada uno de los 105
  temas**, mezcladas y servidas con cronómetro (≈ 95 min, escalado a la
  duración configurable).
- Corrección oficial: acierto +1, fallo −0,33, blanco 0. Nota final sobre 10.
- Las preguntas falladas en el examen pasan al *Repaso de falladas*
  automáticamente.
- El historial de simulacros se guarda en `localStorage`; los últimos 5 se
  listan en la pantalla de inicio del Examen.

## Próximos pasos

- Filtros por procedencia de pregunta (Bloque · Banco Carlota · Test Anterior
  · Test Arquitectos JA · Actualización Normativa).
- Lista dedicada de preguntas marcadas como *dudosa*.
- Examen personalizable: tipo "solo Específico", "solo Común", o por bloques.
- Modo oscuro como variante del sistema editorial.
- Indicador visual del estado de sincronización (cloud icon + última subida).

## Licencia

Pendiente de definir. El banco de preguntas procede de un compendio personal
del usuario; antes de redistribuir, conviene revisar las fuentes citadas en
cada pregunta.
