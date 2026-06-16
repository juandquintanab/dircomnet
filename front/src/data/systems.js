// Única fuente de datos del portal DircomNET.
// Nunca hardcodear gerencias, sistemas ni métricas en el JSX — todo vive aquí.

/* ─── Usuario en sesión (placeholder Fase 1, sin auth) ─── */
export const USUARIO = {
  nombre: 'Juan',
  iniciales: 'JD',
  saludo: 'Buenos días',
  subtitulo: 'Dirección de Comunicaciones · Empresas Polar',
};

/* ─── Navegación del sidebar (colapsable 240px ↔ 84px) ───
   El item activo se deriva de la ruta con useLocation, no de un flag. */
export const NAV_PORTAL = [
  { id: 'tablero', label: 'Tablero', icono: 'grid', ruta: '/portal' },
  { id: 'metricas', label: 'Métricas', icono: 'bar', ruta: '/portal/metricas' },
  { id: 'asistente', label: 'Asistente', icono: 'sparkles', ruta: '/portal/asistente' },
  { divider: true },
  { id: 'usuarios', label: 'Usuarios', icono: 'users', ruta: '/portal/usuarios' },
  { id: 'configuracion', label: 'Configuración', icono: 'settings', ruta: '/portal/configuracion' },
];

/* ─── Resumen de la franja del saludo (valores MVP) ─── */
export const RESUMEN = [
  { id: 'sistemas', valor: '6', label: 'Sistemas disponibles' },
  { id: 'gerencias', valor: '5', label: 'Gerencias' },
  { id: 'notificaciones', valor: '4', label: 'Notificaciones' },
  { id: 'tareas', valor: '2', label: 'Tareas pendientes' },
];

/* ─── Métricas globales · 90 días (valores MVP) ───
   `tono` controla el color del borde y el sparkline desde portal.css.
   `puntos` es la polyline del sparkline (viewBox 0 0 100 22). */
export const METRICAS_GLOBALES = [
  {
    id: 'cobertura',
    label: 'Cobertura positiva',
    valor: '86',
    unidad: '%',
    tono: 'blue',
    puntos: '0,16 14,14 28,11 42,13 56,8 70,7 84,4 100,5',
  },
  {
    id: 'respuesta',
    label: 'Tasa de respuesta',
    valor: '74',
    unidad: '%',
    tono: 'green',
    puntos: '0,18 14,15 28,12 42,11 56,8 70,7 84,4 100,3',
  },
  {
    id: 'pendientes',
    label: 'Pendientes',
    valor: '12',
    unidad: '',
    tono: 'yellow',
    puntos: '0,10 14,11 28,10 42,12 56,11 70,10 84,11 100,10',
  },
  {
    id: 'incidentes',
    label: 'Incidentes',
    valor: '1',
    unidad: '',
    tono: 'red',
    puntos: '0,4 14,6 28,9 42,8 56,12 70,14 84,15 100,18',
  },
];

/* ─── Gerencias y sistemas ───
   gerencia: { id, nombre, descripcion, inicial, pic (1–5), proximamente?, sistemas[] }
   sistema:  { id, codigo, nombre, descripcion, ruta, banner, icono, estado, estadoTono } */
export const GERENCIAS = [
  {
    id: 'medios-pagos',
    nombre: 'Medios Pagos',
    descripcion: 'Planificación de pauta, inversión publicitaria y tracking de campañas.',
    inicial: 'MP',
    pic: 1,
    sistemas: [
      {
        id: 'adm',
        codigo: 'ADM',
        nombre: 'Planes Administrativos',
        descripcion: 'Gestión y administración de planes de medios pagos.',
        ruta: '/adm',
        banner: 'navy',
        icono: 'grid',
        estado: 'Activo',
        estadoTono: 'ok',
      },
      {
        id: 'rad',
        codigo: 'RAD',
        nombre: 'Gestión de Planes de Radio',
        descripcion: 'Planificación y seguimiento de pautas en radio.',
        ruta: '/rad',
        banner: 'blue',
        icono: 'radio',
        estado: 'Activo',
        estadoTono: 'ok',
      },
      {
        id: 'inf',
        codigo: 'INF',
        nombre: 'Administrador de Influencers',
        descripcion: 'Base de datos y gestión de alianzas con influencers.',
        ruta: '/inf',
        banner: 'green',
        icono: 'users',
        estado: 'Activo',
        estadoTono: 'ok',
      },
    ],
  },
  {
    id: 'comunicaciones',
    nombre: 'Difusión y PR',
    descripcion: 'Prensa, medios, voceros y distribución de comunicados.',
    inicial: 'DP',
    pic: 2,
    sistemas: [
      {
        id: 'per',
        codigo: 'PER',
        nombre: 'Directorio de Periodistas',
        descripcion: 'Directorio y seguimiento de relaciones con periodistas.',
        ruta: '/per',
        banner: 'slate',
        icono: 'list',
        estado: 'Activo',
        estadoTono: 'ok',
      },
    ],
  },
  {
    id: 'identidad-marca',
    nombre: 'Identidad e Imagen de Marca',
    descripcion: 'Activos visuales, manuales, aprobaciones de arte y eventos de marca.',
    inicial: 'IM',
    pic: 3,
    proximamente: true,
    sistemas: [],
  },
  {
    id: 'asuntos-publicos',
    nombre: 'Asuntos Públicos',
    descripcion: 'Relaciones institucionales, stakeholders, gobierno y alianzas con propósito.',
    inicial: 'AP',
    pic: 4,
    proximamente: true,
    sistemas: [],
  },
  {
    id: 'estrategia-reputacion',
    nombre: 'Estrategia de Reputación',
    descripcion: 'Monitoreo, sentimiento, gestión de crisis y reportes ejecutivos.',
    inicial: 'ER',
    pic: 5,
    proximamente: true,
    sistemas: [],
  },
];
