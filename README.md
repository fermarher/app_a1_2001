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
├── components.jsx         ← primitivas: Logo, Icon, Pill, BarTrack, Sparkline…
├── screen-dashboard.jsx
├── screen-topics.jsx
├── screen-study.jsx
├── screen-exam.jsx
├── screen-review-stats.jsx
└── app.jsx                ← shell, sidebar/tab-bar, routing (hash)
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

## Estado actual

- Todos los contadores de progreso (`window.STATS`, accuracy por tema,
  `FAILED_QUESTIONS`) están **inicializados a cero**. La app muestra estados
  vacíos honestos hasta que exista una capa de persistencia.
- El examen cronometrado es un prototipo visual: muestra una pregunta real,
  pero todavía no implementa el flujo completo (sampling de 100 preguntas,
  temporizador, corrección con descuentos).
- No hay aún login ni perfil de usuario. La cabecera de sesión muestra
  "Sesión local".

## Próximos pasos

- Persistencia local (`localStorage`) para acumular progreso real.
- Flujo de examen completo: muestreo, cronómetro, navegador, corrección.
- Filtros por procedencia de pregunta (Bloque · Banco Carlota · Test Anterior
  · Test Arquitectos JA · Actualización Normativa).
- Marcado de "dudosa" persistente y listado dedicado.
- Modo oscuro como variante del sistema editorial.

## Licencia

Pendiente de definir. El banco de preguntas procede de un compendio personal
del usuario; antes de redistribuir, conviene revisar las fuentes citadas en
cada pregunta.
