export const GERENCIAS = [
  {
    id: 'medios-pagos',
    nombre: 'Medios Pagos',
    sistemas: [
      {
        id: 'adm',
        codigo: 'ADM',
        nombre: 'Planes Administrativos',
        descripcion: 'Gestión y administración de planes de medios pagos.',
        ruta: '/adm',
        icono: 'grid',
      },
      {
        id: 'rad',
        codigo: 'RAD',
        nombre: 'Gestión de Planes de Radio',
        descripcion: 'Planificación y seguimiento de pautas en radio.',
        ruta: '/rad',
        icono: 'radio',
      },
      {
        id: 'inf',
        codigo: 'INF',
        nombre: 'Administrador de Influencers',
        descripcion: 'Base de datos y gestión de alianzas con influencers.',
        ruta: '/inf',
        icono: 'users',
      },
    ],
  },
  {
    id: 'comunicaciones',
    nombre: 'Difusión y PR',
    sistemas: [
      {
        id: 'per',
        codigo: 'PER',
        nombre: 'Gestión de Periodistas',
        descripcion: 'Directorio y seguimiento de relaciones con periodistas.',
        ruta: '/per',
        icono: 'list',
      },
    ],
  },
];
