// =============================================================================
// Centro de Mando Digital LinkTIC — Datos de ejemplo
// Source: /assets/index-xQVWxsuZ.js (Vite bundle, 1.4MB)
// Extracted: 2026-06-03
// =============================================================================

// =============================================================================
// 1. NAVIGATION / SIDEBAR
// =============================================================================

// Icon names reference the original lucide-react icon components:
//   Wj = Vote (ballot box), $j = ShieldCheck, QR = Scale, tO = UserRound,
//   fc = Newspaper, zj = Share2, kp = Globe2
export const sidebarItems = [
  { path: "/elecciones", label: "Elecciones Presidenciales 2026", icon: "Vote", badge: "HOT" },
  { path: "/testigos", label: "Testigos Electorales", icon: "ShieldCheck" },
  { path: "/legitimidad", label: "Legitimidad y Transparencia", icon: "Scale" },
  { path: "/quiroz", label: "Cristian Quiroz", icon: "UserRound" },
  { path: "/medios", label: "Conversación en Medios", icon: "Newspaper" },
  { path: "/social", label: "Conversación en Redes", icon: "Share2", badge: "LIVE" },
  { path: "/mapa", label: "Mapa Global", icon: "Globe2", badge: "NEW" },
  { path: "/admin", label: "Administración", icon: "Settings" },
];

// Routes (wouter hash router):
// "/" and "/elecciones" => same component (mP)
// "/testigos" => Vue
// "/legitimidad" => $ue
// "/quiroz" => Yue
// "/medios" => Que
// "/social" => rfe
// "/mapa" => ade
// fallback => 404

// =============================================================================
// 2. COLOR SCHEME / THEME TOKENS
// =============================================================================

export const colors = {
  primary: "hsl(213, 85%, 55%)",       // Blue — informativa, institucional, convocatoria
  accent: "hsl(42, 90%, 52%)",          // Gold — emocional, impacto, liderazgo
  success: "hsl(160, 60%, 45%)",        // Green — institucional, formacion, proactividad
  danger: "hsl(0, 72%, 55%)",           // Red — urgencia, contranarativa
  purple: "hsl(280, 65%, 60%)",         // Purple — emocional, tecnologia

  // Platform colors
  instagram: "#E1306C",
  facebook: "#1877f2",
  x: "#fff",
  tiktok: "#69C9D0",

  // Sentiment colors
  positivo: "#4ade80",
  negativo: "#f87171",
  neutral: "#888",

  // Background tones (from CSS)
  cardBg: "hsl(222, 30%, 12%)",
  surfaceBg: "hsl(222, 40%, 9%)",
  borderColor: "hsl(222, 30%, 18%)",
};

// Narrative arc type -> color mapping
export const narrativeTypeColors: Record<string, string> = {
  informativa: colors.primary,
  emocional: colors.purple,
  movilizadora: colors.accent,
  institucional: colors.success,
  convocatoria: colors.primary,
  impacto: colors.accent,
  legitimacion: colors.success,
  demostracion: colors.primary,
  proactividad: colors.success,
  contranarativa: colors.danger,
  liderazgo: colors.accent,
  cercania: colors.success,
  posicionamiento: colors.primary,
  formacion: colors.success,
  urgencia: colors.danger,
  humanizacion: colors.purple,
};

// News category -> color mapping
export const newsCategoryColors: Record<string, string> = {
  institucional: colors.primary,
  auditoria: colors.primary,
  tecnologia: colors.purple,
  testigos: colors.success,
  desinformacion: colors.danger,
  exterior: colors.accent,
  convocatoria: colors.primary,
  internacional: colors.success,
  reconocimiento: colors.accent,
  innovacion: colors.purple,
  capacitacion: colors.success,
  indice: colors.accent,
  veeduria: colors.primary,
  debate: colors.purple,
  declaracion: colors.primary,
  defensa: colors.danger,
  anuncio: colors.success,
  respuesta: colors.accent,
  entrevista: colors.purple,
  fact_check: colors.danger,
};

// =============================================================================
// 3. SOCIAL URLS (LinkTIC — cuentas de ejemplo)
// =============================================================================

export const socialUrls = {
  facebook: "https://web.facebook.com/linktic",
  instagram: "https://www.instagram.com/linktic/",
  tiktok: "https://www.tiktok.com/@linktic",
  x: "https://x.com/LinkTIC",
};

// =============================================================================
// 5. NARRATIVE DATA (gancho + arco) — per topic
// =============================================================================

export const narrativaTestigos = {
  gancho: "Más de 142.000 colombianos y observadores internacionales velan porque tu voto sea respetado. Los testigos electorales son los guardianes de la democracia.",
  tipoConversacion: "Institucional + Movilizadora + De confianza",
  mensajeClave: "Ser testigo electoral es el acto más directo de defensa de la democracia. LinkTIC forma, acredita y despliega la red de vigilancia más grande de la historia electoral colombiana.",
  arco: [
    { fase: "Convocatoria", mensaje: "¿Quieres ser testigo electoral? Te decimos cómo.", tipo: "convocatoria" },
    { fase: "Formación", mensaje: "Los testigos de LinkTIC son los más capacitados del país.", tipo: "institucional" },
    { fase: "Despliegue", mensaje: "142.800 ojos vigilando cada mesa de votación.", tipo: "impacto" },
    { fase: "Confianza", mensaje: "Con testigos en cada mesa, el resultado es inobjetable.", tipo: "legitimacion" },
  ],
};

// =============================================================================
// 6. PILARES (strategy pillars) — per topic
// =============================================================================

export const pilaresTestigos = [
  { pilar: "Formación y capacitación", descripcion: "Cursos virtuales y presenciales de LinkTIC para testigos en todo el país.", icono: "🎓", color: "hsl(213,85%,55%)" },
  { pilar: "Acreditación oficial", descripcion: "Proceso de acreditación transparente con 98.430 testigos ya habilitados.", icono: "✅", color: "hsl(42,90%,52%)" },
  { pilar: "Red internacional", descripcion: "12 países y organismos como OEA, Carter Center y Misión UE observan las elecciones.", icono: "🌍", color: "hsl(160,60%,45%)" },
  { pilar: "Cobertura total", descripcion: "Los 32 departamentos y 1.122 municipios de Colombia cubiertos por la red de testigos.", icono: "📍", color: "hsl(280,65%,60%)" },
];

// =============================================================================
// 7. NEWS ARTICLES — per topic
// =============================================================================

export const noticiasTestigos = [
  { titulo: "LinkTIC lanza segunda convocatoria de testigos electorales departamentales", medio: "El Colombiano", fecha: "02 Jun 2026", url: "#", categoria: "convocatoria" },
  { titulo: "Misión de observación de la OEA confirma 12 integrantes para Colombia 2026", medio: "El Espectador", fecha: "01 Jun 2026", url: "#", categoria: "internacional" },
  { titulo: "Centro Carter felicita a LinkTIC por la transparencia en el proceso de acreditación", medio: "Semana", fecha: "31 May 2026", url: "#", categoria: "reconocimiento" },
  { titulo: "Testigos electorales digitales: cómo reportar irregularidades desde el celular", medio: "La Silla Vacía", fecha: "30 May 2026", url: "#", categoria: "innovacion" },
  { titulo: "MOE Colombia capacita a 8.000 nuevos testigos electorales para el 25 de mayo", medio: "RCN Radio", fecha: "29 May 2026", url: "#", categoria: "capacitacion" },
];

// =============================================================================
// 8. CONTENT IDEAS (organic) — per topic, per platform
// =============================================================================

export const contenidoTestigos = {
  instagram: [
    { formato: "Reels 45s", idea: "«Ser testigo electoral en 3 pasos» — video animado con música motivadora", tipo: "convocatoria" },
    { formato: "Carrusel educativo", idea: "«Mitos y verdades sobre los testigos electorales» — 8 slides desmintiendo desinformación", tipo: "educativo" },
    { formato: "Story countdown", idea: "Cuenta regresiva para el cierre de inscripciones con sticker de preguntas", tipo: "urgencia" },
    { formato: "Foto + copy", idea: "Galería de testigos de diferentes regiones con su testimonio personal", tipo: "humanizacion" },
  ],
  facebook: [
    { formato: "Facebook Live", idea: "Sesión de preguntas y respuestas con el equipo de testigos electorales de LinkTIC", tipo: "interaccion" },
    { formato: "Video testimonial", idea: "«Mi primera experiencia como testigo electoral» — historias reales de testigos 2022", tipo: "testimonial" },
    { formato: "Evento virtual", idea: "Capacitación gratuita para testigos electorales transmitida en vivo por FB", tipo: "formacion" },
    { formato: "Infografía compartible", idea: "Mapa de Colombia con el número de testigos por departamento", tipo: "datos" },
  ],
  x: [
    { formato: "Hilo con datos", idea: "HILO: Los números de la red de testigos más grande de Colombia en 2026 🗺️🧵", tipo: "datos" },
    { formato: "Convocatoria directa", idea: "¿Eres de Bogotá, Medellín o Cali? Necesitamos testigos. Inscríbete en [link] #TestigosElectorales", tipo: "convocatoria" },
    { formato: "Reconocimiento", idea: "Retweet + destacar a testigos que comparten su experiencia con el hashtag", tipo: "comunidad" },
    { formato: "Update en tiempo real", idea: "Contador en vivo de testigos acreditados el día de las elecciones", tipo: "tiempo_real" },
  ],
  tiktok: [
    { formato: "Video POV", idea: "«POV: Eres testigo electoral por primera vez» — día completo de elecciones", tipo: "inmersivo" },
    { formato: "Dueto con ciudadanos", idea: "Responder a la pregunta ¿Para qué sirven los testigos? con la respuesta oficial de LinkTIC", tipo: "educativo" },
    { formato: "Challenge", idea: "#SoyTestigoElectoral — reto viral para que testigos compartan por qué se inscribieron", tipo: "viral" },
    { formato: "Mini documental", idea: "3 partes: formación, despliegue y jornada electoral desde la perspectiva de un testigo", tipo: "narrativo" },
  ],
};

// =============================================================================
// 9. SOCIAL CONVERSATION DATA — per topic (platform-level metrics)
// =============================================================================

export const conversacionTestigos = {
  instagram: { menciones: 8_200, sentimiento: 74, topHashtags: ["#TestigosElectorales", "#LinkTIC", "#Elecciones2026"], volumePeak: "Martes–Jueves 17h–19h" },
  facebook: { menciones: 12_400, sentimiento: 70, topHashtags: ["#TestigosElectorales2026", "#VeedoriaElectoral"], volumePeak: "Martes 10h–12h" },
  x: { menciones: 19_800, sentimiento: 65, topHashtags: ["#TestigosElectorales", "#LinkTIC", "#DemocraciaCO"], volumePeak: "Lunes–Miércoles 8h–10h" },
  tiktok: { menciones: 43_000, sentimiento: 78, topHashtags: ["#TestigoElectoral", "#ColombiaVota", "#Elecciones2026CO"], volumePeak: "Jueves–Sábado 19h–21h" },
};

// =============================================================================
// 10. PAID ADVERTISING IDEAS (pauta) — per topic
// =============================================================================

export const pautaTestigos = [
  { formato: "Video 20s convocatoria", objetivo: "Inscripción testigos", plataforma: ["Facebook", "Instagram"], cta: "Inscríbete ahora → linktic.com", segmento: "18–45 años, activos políticamente", presupuesto: "Captacion" },
  { formato: "Video storytelling", objetivo: "Elevar percepción positiva", plataforma: ["TikTok"], cta: "Sé parte del cambio", segmento: "Gen Z 18–24 años", presupuesto: "Branding" },
  { formato: "Banner remarketing", objetivo: "Retargeting inscritos", plataforma: ["Instagram"], cta: "Completa tu acreditación", segmento: "Usuarios que visitaron formulario", presupuesto: "Conversion" },
];

// =============================================================================
// 16. COUNTRIES DATA (27 countries — social narrative monitoring)
// =============================================================================

export const countriesData = [
  {
    id: "CO", pais: "Colombia", emoji: "🇨🇴", lat: 4.5, lng: -74.3,
    tema: "Elecciones Presidenciales 2026 — LinkTIC",
    keywords: ["LinkTIC Colombia", "Elecciones2026", "CristianQuiroz", "VotoColombia", "TestigosElectorales"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 64, neutral: 24, negativo: 12 },
    volumen: 187_400,
    plataformaDominante: "TikTok",
    plataformas: { X: 52_000, Instagram: 38_000, Facebook: 41_000, TikTok: 56_400 },
    resumen: "Alta conversación sobre el proceso electoral presidencial. LinkTIC lidera el debate sobre transparencia y participación. Cristian Quiroz concentra menciones mediáticas positivas. Tendencia de movilización ciudadana creciente en todas las plataformas.",
    tendencia: "sube",
    pctCambio: 18.4,
    topHashtags: ["#Elecciones2026", "#LinkTIC", "#VotoColombia", "#25Mayo", "#DemocraciaCO"],
    updateTime: "hace 3 min",
  },
  {
    id: "US", pais: "Estados Unidos", emoji: "🇺🇸", lat: 38.9, lng: -77,
    tema: "Diáspora colombiana y voto en el exterior",
    keywords: ["VotoColombia", "ColombiansAbroad", "Elecciones2026", "DiasporaVota"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 58, neutral: 31, negativo: 11 },
    volumen: 34_200,
    plataformaDominante: "Instagram",
    plataformas: { X: 9_800, Instagram: 14_200, Facebook: 7_400, TikTok: 2_800 },
    resumen: "La diáspora colombiana en Miami, Nueva York y Houston debate activamente el voto en el exterior. Fuerte movilización de comunidades en Instagram. El consulado amplió horarios de inscripción al censo.",
    tendencia: "sube",
    pctCambio: 12.1,
    topHashtags: ["#ColombianosEnElExterior", "#VotoColombia", "#DiasporaVota", "#Elecciones2026"],
    updateTime: "hace 7 min",
  },
  {
    id: "ES", pais: "España", emoji: "🇪🇸", lat: 40.4, lng: -3.7,
    tema: "Misión UE y comunidad colombiana en Madrid",
    keywords: ["MisionUE", "ColombiaEspaña", "TestigosElectorales", "Democracia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 72, neutral: 21, negativo: 7 },
    volumen: 28_700,
    plataformaDominante: "X",
    plataformas: { X: 12_400, Instagram: 8_900, Facebook: 6_200, TikTok: 1_200 },
    resumen: "España alberga la mayor comunidad colombiana en Europa. La Misión de Observación Electoral de la UE generó cobertura positiva. Los medios españoles destacan la solidez institucional de LinkTIC.",
    tendencia: "sube",
    pctCambio: 9.3,
    topHashtags: ["#ColombiaEnEspaña", "#MisionUE", "#Elecciones2026", "#LinkTIC"],
    updateTime: "hace 11 min",
  },
  {
    id: "MX", pais: "México", emoji: "🇲🇽", lat: 19.4, lng: -99.1,
    tema: "Comparativa electoral latinoamericana",
    keywords: ["EleccionesLatam", "Democracia", "MisionOEA", "LinkTIC"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 44, neutral: 41, negativo: 15 },
    volumen: 21_500,
    plataformaDominante: "X",
    plataformas: { X: 9_800, Instagram: 5_400, Facebook: 4_800, TikTok: 1_500 },
    resumen: "Analistas políticos mexicanos comparan el modelo electoral colombiano con procesos regionales. La OEA despachó misión de observación. Conversación técnica sobre software electoral domina el debate.",
    tendencia: "estable",
    pctCambio: 1.2,
    topHashtags: ["#DemocraciaLatam", "#EleccionesLatam", "#OEA", "#Colombia2026"],
    updateTime: "hace 15 min",
  },
  {
    id: "AR", pais: "Argentina", emoji: "🇦🇷", lat: -34.6, lng: -58.4,
    tema: "Referente regional — UNASUR observa el proceso",
    keywords: ["UNASUR", "ArgentinaColombia", "Democracia", "ObservacionElectoral"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 61, neutral: 28, negativo: 11 },
    volumen: 18_900,
    plataformaDominante: "Instagram",
    plataformas: { X: 7_200, Instagram: 8_100, Facebook: 2_800, TikTok: 800 },
    resumen: "Politólogos argentinos señalan a LinkTIC como referente de independencia institucional en la región. La delegación UNASUR asistirá como observadora. Fuerte interés académico en el modelo de transparencia.",
    tendencia: "sube",
    pctCambio: 7.8,
    topHashtags: ["#UNASUR", "#ColombiaDemocrática", "#Elecciones2026", "#ObservacionElectoral"],
    updateTime: "hace 9 min",
  },
  {
    id: "VE", pais: "Venezuela", emoji: "🇻🇪", lat: 10.5, lng: -66.9,
    tema: "Contraste electoral Venezuela–Colombia",
    keywords: ["VenezuelaColombia", "DiasporaVenezolana", "DemocraciaReal", "Elecciones"],
    sentimiento: "mixto",
    sentimientoPct: { positivo: 38, neutral: 22, negativo: 40 },
    volumen: 24_600,
    plataformaDominante: "X",
    plataformas: { X: 14_200, Instagram: 6_400, Facebook: 3_200, TikTok: 800 },
    resumen: "El proceso colombiano genera debate intenso en Venezuela. Sectores opositores lo usan como contraste. Venezolanos con residencia en Colombia analizan opciones de participación. Alta polarización en X.",
    tendencia: "sube",
    pctCambio: 31.2,
    topHashtags: ["#ColombiaVota", "#DemocraciaReal", "#Venezuela", "#Elecciones2026"],
    updateTime: "hace 5 min",
  },
  {
    id: "BR", pais: "Brasil", emoji: "🇧🇷", lat: -15.8, lng: -47.9,
    tema: "Integración electoral regional — TSE y LinkTIC",
    keywords: ["TSEBrasil", "LinkTIC", "CooperacionElectoral", "Latam"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 55, neutral: 35, negativo: 10 },
    volumen: 15_400,
    plataformaDominante: "Facebook",
    plataformas: { X: 4_800, Instagram: 4_200, Facebook: 5_200, TikTok: 1_200 },
    resumen: "El Tribunal Superior Electoral de Brasil intercambió experiencias con el LinkTIC sobre sistemas de escrutinio. Medios brasileños cubren el proceso como caso de estudio de democracia latinoamericana funcional.",
    tendencia: "estable",
    pctCambio: 2.4,
    topHashtags: ["#DemocraciaLatam", "#TSEBrasil", "#LinkTIC", "#Eleicoes"],
    updateTime: "hace 22 min",
  },
  {
    id: "CL", pais: "Chile", emoji: "🇨🇱", lat: -33.5, lng: -70.6,
    tema: "Benchmarking UNIORE — transparencia electoral",
    keywords: ["UNIORE", "SERVELChile", "TransparenciaElectoral", "Colombia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 67, neutral: 27, negativo: 6 },
    volumen: 12_800,
    plataformaDominante: "X",
    plataformas: { X: 5_600, Instagram: 3_800, Facebook: 2_800, TikTok: 600 },
    resumen: "SERVEL Chile mantiene acuerdo de cooperación con el LinkTIC. Expertos en sistemas electorales destacan los avances en cadena de custodia del voto colombiano. Cobertura académica y especializada.",
    tendencia: "estable",
    pctCambio: 3.1,
    topHashtags: ["#UNIORE", "#TransparenciaElectoral", "#Chile", "#LinkTIC"],
    updateTime: "hace 18 min",
  },
  {
    id: "FR", pais: "Francia", emoji: "🇫🇷", lat: 48.9, lng: 2.3,
    tema: "Misión UE y comunidad colombiana en París",
    keywords: ["MisionUE", "ColombiaParis", "EleccionesColombia", "Democracia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 69, neutral: 24, negativo: 7 },
    volumen: 11_200,
    plataformaDominante: "Instagram",
    plataformas: { X: 4_200, Instagram: 5_100, Facebook: 1_500, TikTok: 400 },
    resumen: "Francia lidera la delegación de la Misión de Observación de la UE. Comunidad colombiana en París organiza jornadas de inscripción electoral. Cobertura positiva de Le Monde sobre la institucionalidad de LinkTIC.",
    tendencia: "sube",
    pctCambio: 5.9,
    topHashtags: ["#ColombieFrance", "#MissionUE", "#Elecciones2026", "#DiasporaColombia"],
    updateTime: "hace 14 min",
  },
  {
    id: "DE", pais: "Alemania", emoji: "🇩🇪", lat: 52.5, lng: 13.4,
    tema: "Estándares OCDE y democracia colombiana",
    keywords: ["OCDEDemocracia", "Alemania", "Elecciones", "EstandaresElectorales"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 71, neutral: 25, negativo: 4 },
    volumen: 9_800,
    plataformaDominante: "X",
    plataformas: { X: 4_800, Instagram: 2_600, Facebook: 1_900, TikTok: 500 },
    resumen: "Fundaciones alemanas Konrad Adenauer y Friedrich Ebert acompañan el proceso electoral colombiano. Medios como Frankfurter Allgemeine destacan la solidez técnica del sistema. Alta cobertura académica.",
    tendencia: "estable",
    pctCambio: 1.8,
    topHashtags: ["#Kolumbien", "#DemokratieLatam", "#OCDE", "#Elecciones2026"],
    updateTime: "hace 31 min",
  },
  {
    id: "CA", pais: "Canadá", emoji: "🇨🇦", lat: 45.4, lng: -75.7,
    tema: "Carter Center y voto en el exterior — comunidad colombiana",
    keywords: ["CarterCenter", "ColombiansInCanada", "VotoExterior", "Democracia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 63, neutral: 30, negativo: 7 },
    volumen: 8_400,
    plataformaDominante: "Instagram",
    plataformas: { X: 2_800, Instagram: 3_900, Facebook: 1_400, TikTok: 300 },
    resumen: "El Carter Center coordina observación desde Canadá con énfasis en inclusión de comunidades rurales y afrodescendientes. Colombianos en Toronto y Vancouver activos en redes sobre voto en el exterior.",
    tendencia: "sube",
    pctCambio: 6.4,
    topHashtags: ["#CarterCenter", "#ColombiansInCanada", "#Elecciones2026", "#VotoColombia"],
    updateTime: "hace 26 min",
  },
  {
    id: "PE", pais: "Perú", emoji: "🇵🇪", lat: -12, lng: -77,
    tema: "Benchmarking ONPE-LinkTIC y cooperación técnica",
    keywords: ["ONPE", "LinkTIC", "CooperacionElectoral", "Latam"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 48, neutral: 38, negativo: 14 },
    volumen: 7_600,
    plataformaDominante: "Facebook",
    plataformas: { X: 2_400, Instagram: 2_100, Facebook: 2_800, TikTok: 300 },
    resumen: "La ONPE peruana estudia el modelo de software electoral colombiano. Debate académico sobre implementación de tecnología en el voto. La crisis política interna opaca la cobertura del proceso colombiano.",
    tendencia: "estable",
    pctCambio: 0.8,
    topHashtags: ["#ONPE", "#Elecciones", "#CooperacionElectoral", "#Colombia"],
    updateTime: "hace 40 min",
  },
  {
    id: "EC", pais: "Ecuador", emoji: "🇪🇨", lat: -0.2, lng: -78.5,
    tema: "LinkTIC Ecuador y proceso presidencial colombiano",
    keywords: ["LinkTICEcuador", "Colombia", "Elecciones", "DemocraciaAndina"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 57, neutral: 32, negativo: 11 },
    volumen: 9_200,
    plataformaDominante: "X",
    plataformas: { X: 4_200, Instagram: 2_600, Facebook: 1_900, TikTok: 500 },
    resumen: "Ecuador vive su propia coyuntura electoral y mira con atención el modelo colombiano. LinkTIC Ecuador solicitó cooperación técnica. Fuertes lazos fronterizos generan interés en la diáspora colombiana en Quito.",
    tendencia: "sube",
    pctCambio: 8.7,
    topHashtags: ["#LinkTICEcuador", "#DemocraciaAndina", "#Elecciones2026", "#ColombiaCuenta"],
    updateTime: "hace 12 min",
  },
  {
    id: "BO", pais: "Bolivia", emoji: "🇧🇴", lat: -16.5, lng: -68.1,
    tema: "UNIORE y observación andina",
    keywords: ["UNIORE", "Democracia", "Bolivia", "ObservadorElectoral"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 42, neutral: 45, negativo: 13 },
    volumen: 4_800,
    plataformaDominante: "Facebook",
    plataformas: { X: 1_400, Instagram: 1_200, Facebook: 1_900, TikTok: 300 },
    resumen: "Bolivia participa en el bloque UNIORE de observación electoral. Medios bolivianos cubren el proceso colombiano en el contexto de la democracia andina. Baja intensidad pero conversación técnica.",
    tendencia: "estable",
    pctCambio: -0.4,
    topHashtags: ["#UNIORE", "#DemocraciaAndina", "#Bolivia", "#Elecciones"],
    updateTime: "hace 52 min",
  },
  {
    id: "PY", pais: "Paraguay", emoji: "🇵🇾", lat: -25.3, lng: -57.6,
    tema: "UNASUR observa desde Paraguay",
    keywords: ["UNASUR", "Paraguay", "DemocraciaLatam", "ObservacionElectoral"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 46, neutral: 40, negativo: 14 },
    volumen: 3_200,
    plataformaDominante: "Facebook",
    plataformas: { X: 900, Instagram: 800, Facebook: 1_300, TikTok: 200 },
    resumen: "Participación técnica de Paraguay en la misión UNASUR. Cobertura modesta centrada en el aspecto regional de la observación electoral andina.",
    tendencia: "estable",
    pctCambio: 0.2,
    topHashtags: ["#UNASUR", "#ObservacionElectoral", "#Paraguay", "#Democracia"],
    updateTime: "hace 1h 10min",
  },
  {
    id: "UY", pais: "Uruguay", emoji: "🇺🇾", lat: -34.9, lng: -56.2,
    tema: "Modelo democrático uruguayo y referencias a LinkTIC",
    keywords: ["Uruguay", "DemocraciaLatam", "LinkTIC", "Transparencia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 74, neutral: 21, negativo: 5 },
    volumen: 5_600,
    plataformaDominante: "X",
    plataformas: { X: 2_800, Instagram: 1_400, Facebook: 1_100, TikTok: 300 },
    resumen: "Uruguay, referente democrático regional, celebra los avances institucionales de LinkTIC Colombia. Politólogos uruguayos destacan la independencia del organismo. Cobertura académica y editorial positiva.",
    tendencia: "estable",
    pctCambio: 2.6,
    topHashtags: ["#Uruguay", "#DemocraciaLatam", "#LinkTIC", "#Transparencia"],
    updateTime: "hace 38 min",
  },
  {
    id: "GB", pais: "Reino Unido", emoji: "🇬🇧", lat: 51.5, lng: -0.1,
    tema: "Misión UE y cobertura BBC sobre Colombia",
    keywords: ["BBCMundo", "Colombia", "Elecciones", "LatinAmerica"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 60, neutral: 33, negativo: 7 },
    volumen: 8_900,
    plataformaDominante: "X",
    plataformas: { X: 4_600, Instagram: 2_400, Facebook: 1_500, TikTok: 400 },
    resumen: "BBC Mundo y The Guardian cubren las elecciones colombianas como un test clave para la democracia latinoamericana. Comunidad colombiana en Londres organiza eventos en consulado. Misión UE incluye observadores británicos.",
    tendencia: "sube",
    pctCambio: 4.2,
    topHashtags: ["#Colombia2026", "#LatinAmerica", "#BBCMundo", "#Elecciones"],
    updateTime: "hace 20 min",
  },
  {
    id: "IT", pais: "Italia", emoji: "🇮🇹", lat: 41.9, lng: 12.5,
    tema: "Diáspora colombiana Italia — voto exterior",
    keywords: ["ColombiaItalia", "VotoExterior", "Elecciones2026", "DiasporaColombia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 65, neutral: 28, negativo: 7 },
    volumen: 6_200,
    plataformaDominante: "Instagram",
    plataformas: { X: 1_800, Instagram: 3_200, Facebook: 1_000, TikTok: 200 },
    resumen: "Importante comunidad colombiana en Roma y Milán movilizada por el voto en el exterior. Consulado colombiano en Roma reporta alta demanda de inscripción. Instagram lidera la conversación de la diáspora italiana.",
    tendencia: "sube",
    pctCambio: 9.1,
    topHashtags: ["#ColombiaEnItalia", "#VotoExterior", "#Elecciones2026", "#DiasporaCO"],
    updateTime: "hace 28 min",
  },
  {
    id: "JP", pais: "Japón", emoji: "🇯🇵", lat: 35.7, lng: 139.7,
    tema: "Tecnología electoral — observadores asiáticos",
    keywords: ["TecnologiaElectoral", "Japon", "Colombia", "SoftwareVotacion"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 52, neutral: 42, negativo: 6 },
    volumen: 3_800,
    plataformaDominante: "X",
    plataformas: { X: 2_100, Instagram: 900, Facebook: 600, TikTok: 200 },
    resumen: "Delegación técnica japonesa interesada en el sistema de software electoral de Colombia. Enfoque académico y tecnológico. Medios especializados japoneses cubren el proceso como caso de modernización democrática.",
    tendencia: "estable",
    pctCambio: 1.4,
    topHashtags: ["#EleccionTech", "#Colombia", "#Democracia", "#Smartmatic"],
    updateTime: "hace 45 min",
  },
  {
    id: "AU", pais: "Australia", emoji: "🇦🇺", lat: -35.3, lng: 149.1,
    tema: "AEC intercambio y colombianos en Sydney",
    keywords: ["AustraliaElectoral", "ColombiaSydney", "VotoExterior", "DiasporaCO"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 61, neutral: 32, negativo: 7 },
    volumen: 4_200,
    plataformaDominante: "Instagram",
    plataformas: { X: 1_200, Instagram: 2_100, Facebook: 700, TikTok: 200 },
    resumen: "La Australian Electoral Commission compartió mejores prácticas con el LinkTIC. Colombianos en Sydney y Melbourne activos en redes para coordinar voto exterior. Cobertura positiva de medios multiculturales.",
    tendencia: "estable",
    pctCambio: 2.1,
    topHashtags: ["#ColombiansInAustralia", "#VotoExterior", "#Elecciones2026", "#AEC"],
    updateTime: "hace 55 min",
  },
  {
    id: "CN", pais: "China", emoji: "🇨🇳", lat: 39.9, lng: 116.4,
    tema: "Cobertura Xinhua — relaciones Colombia-China",
    keywords: ["Xinhua", "ChinaColombia", "Relaciones", "EleccionesLatam"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 38, neutral: 55, negativo: 7 },
    volumen: 5_100,
    plataformaDominante: "X",
    plataformas: { X: 3_200, Instagram: 800, Facebook: 900, TikTok: 200 },
    resumen: "Agencia Xinhua cubre las elecciones colombianas en el contexto de las relaciones bilaterales. Énfasis en estabilidad institucional y perspectivas económicas post-electoral. Narrativa de negocios e inversión.",
    tendencia: "estable",
    pctCambio: 0.6,
    topHashtags: ["#Xinhua", "#ChinaColombia", "#LatinAmerica", "#Elecciones2026"],
    updateTime: "hace 1h",
  },
  {
    id: "PA", pais: "Panamá", emoji: "🇵🇦", lat: 8.9, lng: -79.5,
    tema: "Zona libre y diáspora colombiana",
    keywords: ["Panama", "DiasporaCO", "VotoExterior", "Colombia"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 58, neutral: 34, negativo: 8 },
    volumen: 7_800,
    plataformaDominante: "Instagram",
    plataformas: { X: 2_200, Instagram: 3_600, Facebook: 1_700, TikTok: 300 },
    resumen: "Panamá alberga importante colonia colombiana activa en el proceso electoral. La proximidad geográfica y los lazos comerciales mantienen alta la conversación. Consulado en Ciudad de Panamá con alta demanda.",
    tendencia: "sube",
    pctCambio: 6.8,
    topHashtags: ["#ColombiaEnPanama", "#VotoExterior", "#Elecciones2026", "#DiasporaVota"],
    updateTime: "hace 16 min",
  },
  {
    id: "CR", pais: "Costa Rica", emoji: "🇨🇷", lat: 9.9, lng: -84.1,
    tema: "TSE Costa Rica — cooperación democrática",
    keywords: ["TSECostaRica", "DemocraciaLatam", "LinkTIC", "CooperacionElectoral"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 70, neutral: 24, negativo: 6 },
    volumen: 6_400,
    plataformaDominante: "X",
    plataformas: { X: 3_100, Instagram: 1_800, Facebook: 1_300, TikTok: 200 },
    resumen: "El TSE de Costa Rica, referente centroamericano, celebra el avance institucional de LinkTIC Colombia. Conversación técnica entre organismos electorales. Alta valoración de la independencia institucional.",
    tendencia: "estable",
    pctCambio: 3.4,
    topHashtags: ["#TSECostaRica", "#DemocraciaLatam", "#LinkTIC", "#CooperacionElectoral"],
    updateTime: "hace 42 min",
  },
  {
    id: "DO", pais: "Rep. Dominicana", emoji: "🇩🇴", lat: 18.5, lng: -69.9,
    tema: "JCE y modelo caribeno observan a Colombia",
    keywords: ["JCEDominicana", "Caribe", "Democracia", "Elecciones"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 55, neutral: 36, negativo: 9 },
    volumen: 5_200,
    plataformaDominante: "Instagram",
    plataformas: { X: 1_800, Instagram: 2_400, Facebook: 800, TikTok: 200 },
    resumen: "La JCE dominicana envía observadores al proceso colombiano. Comunidad colombiana en Santo Domingo activa en redes. Interés en el modelo de software electoral y transparencia de resultados.",
    tendencia: "estable",
    pctCambio: 2.8,
    topHashtags: ["#JCE", "#Elecciones", "#Colombia2026", "#DemocraciaCaribe"],
    updateTime: "hace 48 min",
  },
  {
    id: "ZA", pais: "Sudáfrica", emoji: "🇿🇦", lat: -25.7, lng: 28.2,
    tema: "IEC y observación africana",
    keywords: ["IECSudafrica", "ObservacionElectoral", "Africa", "Colombia"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 45, neutral: 47, negativo: 8 },
    volumen: 2_800,
    plataformaDominante: "X",
    plataformas: { X: 1_600, Instagram: 600, Facebook: 500, TikTok: 100 },
    resumen: "La Comisión Electoral Independiente de Sudáfrica participa en intercambio de experiencias. Cobertura técnica moderada centrada en procesos comparados de consolidación democrática.",
    tendencia: "estable",
    pctCambio: 0.3,
    topHashtags: ["#IEC", "#EleccionesLatam", "#DemocraciaComparada", "#Colombia"],
    updateTime: "hace 1h 20min",
  },
  {
    id: "KR", pais: "Corea del Sur", emoji: "🇰🇷", lat: 37.6, lng: 127,
    tema: "NEC Corea — tecnología electoral avanzada",
    keywords: ["NECCorea", "TechElectoral", "Colombia", "SoftwareVotacion"],
    sentimiento: "positivo",
    sentimientoPct: { positivo: 60, neutral: 36, negativo: 4 },
    volumen: 3_400,
    plataformaDominante: "X",
    plataformas: { X: 2_000, Instagram: 800, Facebook: 500, TikTok: 100 },
    resumen: "La NEC de Corea del Sur comparte tecnología de e-voting con el LinkTIC Colombia. Acuerdo de cooperación técnica para modernización electoral. Medios especializados coreanos destacan el avance.",
    tendencia: "sube",
    pctCambio: 5.2,
    topHashtags: ["#NECKorea", "#TechElectoral", "#Colombia", "#EsVoting"],
    updateTime: "hace 50 min",
  },
  {
    id: "IN", pais: "India", emoji: "🇮🇳", lat: 28.6, lng: 77.2,
    tema: "ECI India — elecciones democráticas más grandes del mundo",
    keywords: ["ECIIndia", "Democracia", "Elecciones", "Colombia"],
    sentimiento: "neutral",
    sentimientoPct: { positivo: 48, neutral: 45, negativo: 7 },
    volumen: 4_600,
    plataformaDominante: "X",
    plataformas: { X: 2_800, Instagram: 1_000, Facebook: 600, TikTok: 200 },
    resumen: "La Comisión Electoral de India y el LinkTIC Colombia establecen diálogo de buenas prácticas. India aporta escala y logística; Colombia, transparencia tecnológica. Cobertura técnica especializada.",
    tendencia: "estable",
    pctCambio: 1.1,
    topHashtags: ["#ECIIndia", "#DemocraciaGlobal", "#Colombia", "#EleccionesComparadas"],
    updateTime: "hace 1h 5min",
  },
];

// Testigos page tabs
export const testigosTabs = [
  { key: "overview", label: "🌍 Mapa Global" },
  { key: "narrativa", label: "📖 Narrativa" },
  { key: "pilares", label: "🏛️ Pilares" },
  { key: "noticias", label: "📰 Noticias" },
  { key: "contenido", label: "🎨 Ideas de Contenido" },
  { key: "conversacion", label: "💬 Conversación en Redes" },
  { key: "pauta", label: "📣 Ideas para Pauta" },
];

// =============================================================================
// 18. PAGE HEADER METADATA (badges + titles + descriptions)
// =============================================================================

export const pageHeaders = {
  testigos: {
    badges: [
      { text: "TESTIGOS", color: "hsl(213, 85%, 55%)" },
      { text: "RED GLOBAL", color: "hsl(42, 90%, 52%)" },
    ],
    title: "Testigos Electorales",
    description: "Red nacional e internacional de observadores electorales del Centro de Mando Digital LinkTIC.",
  },
  medios: {
    badges: [
      { text: "MEDIOS", color: "hsl(213, 85%, 55%)" },
      { text: "COBERTURA", color: "hsl(160, 60%, 45%)" },
    ],
    title: "Conversación en Medios",
    description: "Monitoreo de cobertura en prensa, radio, televisión y medios digitales.",
  },
  social: {
    badges: [
      { text: "EN VIVO", color: "hsl(160, 60%, 45%)", live: true },
      { text: "4 PLATAFORMAS", color: "hsl(213, 85%, 55%)" },
    ],
    title: "Conversación en Redes Sociales",
    description: "Monitoreo en tiempo real de Instagram, Facebook, X y TikTok.",
  },
};

// =============================================================================
// 19. CONVENIENCE: Grouped data per topic (for easy page-level imports)
// =============================================================================

export const topicData = {
  testigos: {
    narrativa: narrativaTestigos,
    pilares: pilaresTestigos,
    noticias: noticiasTestigos,
    contenido: contenidoTestigos,
    conversacion: conversacionTestigos,
    pauta: pautaTestigos,
  },
};
