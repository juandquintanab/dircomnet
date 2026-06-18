import { supabase } from '../../../lib/supabase'

// ── Influencers ──────────────────────────────────────────────────────────────
//
// La tabla `influencers` es plana solo en sus datos personales
// (id, nombre, sexo, ciudad, estado, pais, direccion, descripcion, comentarios).
// Todo lo demás vive en tablas relacionadas y se trae con embeds de PostgREST:
//   redes_sociales_influencer (plataforma, usuario, seguidores, tipo → tipos_influencer)
//   telefonos_influencer (numero) · correos_influencer (direccion)
//   influencer_tematicas → tematicas · influencer_categorias → categorias_influencer
//   influencer_marcas_ep → marcas (con estado + embajador)
//   influencer_marcas_comerciales → marcas_comerciales
//   influencer_marcas_competencia → marcas_competencia

const LIST_SELECT = `
  id, nombre, sexo, ciudad, estado, pais,
  redes_sociales_influencer ( plataforma, usuario, seguidores, tipos_influencer ( nombre ) ),
  influencer_categorias ( categorias_influencer ( nombre ) )
`

const DETAIL_SELECT = `
  *,
  redes_sociales_influencer ( id, plataforma, usuario, seguidores, tipo_id, tipos_influencer ( nombre ) ),
  telefonos_influencer ( id, numero ),
  correos_influencer ( id, direccion ),
  influencer_tematicas ( tematica_id, tematicas ( nombre ) ),
  influencer_categorias ( categoria_id, categorias_influencer ( nombre ) ),
  influencer_marcas_ep ( marca_id, estado, embajador, marcas ( nombre ) ),
  influencer_marcas_comerciales ( marca_comercial_id, marcas_comerciales ( nombre ) ),
  influencer_marcas_competencia ( marca_competencia_id, marcas_competencia ( nombre ) )
`

// Aplana la respuesta anidada de PostgREST a una forma cómoda para la UI.
const mapInfluencer = (row) => {
  if (!row) return row
  const redes = (row.redes_sociales_influencer || []).map((r) => ({
    id: r.id,
    plataforma: r.plataforma,
    usuario: r.usuario,
    seguidores: r.seguidores,
    tipo_id: r.tipo_id,
    tipo: r.tipos_influencer?.nombre ?? null,
  }))
  const seguidores = redes.reduce(
    (max, r) => (r.seguidores != null && r.seguidores > max ? r.seguidores : max),
    0,
  )
  const tipos = [...new Set(redes.map((r) => r.tipo).filter(Boolean))]
  const categorias = (row.influencer_categorias || [])
    .map((c) => c.categorias_influencer?.nombre)
    .filter(Boolean)
  return {
    ...row,
    redes,
    seguidores, // derivado: mayor número de seguidores entre sus redes
    tipos, // derivado: tipos distintos (Macro, Micro…) presentes en sus redes
    categorias,
    telefonos: (row.telefonos_influencer || []).map((t) => ({ id: t.id, numero: t.numero })),
    correos: (row.correos_influencer || []).map((c) => ({ id: c.id, direccion: c.direccion })),
    tematicas: (row.influencer_tematicas || [])
      .map((t) => t.tematicas?.nombre)
      .filter(Boolean),
    tematica_ids: (row.influencer_tematicas || []).map((t) => t.tematica_id),
    categoria_ids: (row.influencer_categorias || []).map((c) => c.categoria_id),
    marca_comercial_ids: (row.influencer_marcas_comerciales || []).map((m) => m.marca_comercial_id),
    marca_competencia_ids: (row.influencer_marcas_competencia || []).map((m) => m.marca_competencia_id),
    marcas_ep: (row.influencer_marcas_ep || []).map((m) => ({
      marca_id: m.marca_id,
      marca: m.marcas?.nombre ?? null,
      estado: m.estado,
      embajador: m.embajador,
    })),
    marcas_comerciales: (row.influencer_marcas_comerciales || [])
      .map((m) => m.marcas_comerciales?.nombre)
      .filter(Boolean),
    marcas_competencia: (row.influencer_marcas_competencia || [])
      .map((m) => m.marcas_competencia?.nombre)
      .filter(Boolean),
  }
}

export const getInfluencers = async () => {
  const { data, error } = await supabase
    .from('influencers')
    .select(LIST_SELECT)
    .order('nombre')
  if (error) throw error
  return (data || []).map(mapInfluencer)
}

export const getInfluencerById = async (id) => {
  const { data, error } = await supabase
    .from('influencers')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return mapInfluencer(data)
}

// ── Catálogos del módulo INF ─────────────────────────────────────────────────

export const getTiposInfluencer = async () => {
  const { data, error } = await supabase.from('tipos_influencer').select('*').order('nombre')
  if (error) throw error
  return data
}

export const getTematicas = async () => {
  const { data, error } = await supabase.from('tematicas').select('*').order('nombre')
  if (error) throw error
  return data
}

export const getCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias_influencer')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data
}

export const getMarcasComerciales = async () => {
  const { data, error } = await supabase.from('marcas_comerciales').select('*').order('nombre')
  if (error) throw error
  return data
}

export const getMarcasCompetencia = async () => {
  const { data, error } = await supabase.from('marcas_competencia').select('*').order('nombre')
  if (error) throw error
  return data
}

// Sincroniza las relaciones N:M de un influencer con un patrón borrar+insertar.
// `rel` ya viene normalizado desde el formulario.
export const sincronizarRelacionesInfluencer = async (influencerId, rel = {}) => {
  const ops = [
    {
      tabla: 'redes_sociales_influencer',
      filas: (rel.redes || []).map((r) => ({
        influencer_id: influencerId,
        plataforma: r.plataforma || null,
        usuario: r.usuario || null,
        seguidores: r.seguidores ?? null,
        tipo_id: r.tipo_id || null,
      })),
    },
    {
      tabla: 'telefonos_influencer',
      filas: (rel.telefonos || []).map((numero) => ({ influencer_id: influencerId, numero })),
    },
    {
      tabla: 'correos_influencer',
      filas: (rel.correos || []).map((direccion) => ({ influencer_id: influencerId, direccion })),
    },
    {
      tabla: 'influencer_tematicas',
      filas: (rel.tematica_ids || []).map((tematica_id) => ({
        influencer_id: influencerId,
        tematica_id,
      })),
    },
    {
      tabla: 'influencer_categorias',
      filas: (rel.categoria_ids || []).map((categoria_id) => ({
        influencer_id: influencerId,
        categoria_id,
      })),
    },
    {
      tabla: 'influencer_marcas_ep',
      filas: (rel.marcas_ep || []).map((m) => ({
        influencer_id: influencerId,
        marca_id: m.marca_id,
        estado: m.estado || null,
        embajador: !!m.embajador,
      })),
    },
    {
      tabla: 'influencer_marcas_comerciales',
      filas: (rel.marca_comercial_ids || []).map((marca_comercial_id) => ({
        influencer_id: influencerId,
        marca_comercial_id,
      })),
    },
    {
      tabla: 'influencer_marcas_competencia',
      filas: (rel.marca_competencia_ids || []).map((marca_competencia_id) => ({
        influencer_id: influencerId,
        marca_competencia_id,
      })),
    },
  ]

  for (const { tabla, filas } of ops) {
    const { error: delErr } = await supabase.from(tabla).delete().eq('influencer_id', influencerId)
    if (delErr) throw delErr
    if (filas.length) {
      const { error: insErr } = await supabase.from(tabla).insert(filas)
      if (insErr) throw insErr
    }
  }
}

export const getInfluencerContratos = async (id) => {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('influencer_id', id)
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

export const getInfluencerCampanas = async (id) => {
  const { data, error } = await supabase
    .from('campanas_influencers')
    .select('contrato_id, campanas(id, nombre, fecha_inicio, fecha_fin, marcas(nombre))')
    .eq('influencer_id', id)
  if (error) throw error
  return (data || []).map((r) => ({ ...r.campanas, contrato_id: r.contrato_id }))
}

// Solo columnas reales de la tabla `influencers` (datos personales).
const BASE_COLS = ['nombre', 'sexo', 'ciudad', 'estado', 'pais', 'direccion', 'descripcion', 'comentarios']
const soloBase = (data) =>
  Object.fromEntries(Object.entries(data).filter(([k]) => BASE_COLS.includes(k)))

export const createInfluencer = async (data) => {
  const { data: row, error } = await supabase
    .from('influencers')
    .insert(soloBase(data))
    .select()
    .single()
  if (error) throw error
  return row
}

export const updateInfluencer = async (id, data) => {
  const { data: row, error } = await supabase
    .from('influencers')
    .update(soloBase(data))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

// ── Marcas ───────────────────────────────────────────────────────────────────

export const getMarcas = async () => {
  const { data, error } = await supabase.from('marcas').select('*').order('nombre')
  if (error) throw error
  return data
}

export const createMarca = async (data) => {
  const { data: row, error } = await supabase
    .from('marcas')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export const updateMarca = async (id, data) => {
  const { data: row, error } = await supabase
    .from('marcas')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

// ── Contratos ────────────────────────────────────────────────────────────────

export const getContratos = async () => {
  const { data, error } = await supabase
    .from('contratos')
    .select('*, influencers(id, nombre)')
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

export const getContratoById = async (id) => {
  const { data, error } = await supabase
    .from('contratos')
    .select('*, influencers(id, nombre), entregables(*), pagos(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createContrato = async (data) => {
  const { data: row, error } = await supabase
    .from('contratos')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export const updateContrato = async (id, data) => {
  const { data: row, error } = await supabase
    .from('contratos')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

// ── Entregables ───────────────────────────────────────────────────────────────

export const getEntregableById = async (id) => {
  const { data, error } = await supabase
    .from('entregables')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createEntregable = async (data) => {
  const { data: row, error } = await supabase
    .from('entregables')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export const updateEntregable = async (id, data) => {
  const { data: row, error } = await supabase
    .from('entregables')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export const deleteEntregable = async (id) => {
  const { error } = await supabase.from('entregables').delete().eq('id', id)
  if (error) throw error
}

// ── Pagos ────────────────────────────────────────────────────────────────────

export const getPagoById = async (id) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createPago = async (data) => {
  const { data: row, error } = await supabase
    .from('pagos')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export const updatePago = async (id, data) => {
  const { data: row, error } = await supabase
    .from('pagos')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export const deletePago = async (id) => {
  const { error } = await supabase.from('pagos').delete().eq('id', id)
  if (error) throw error
}

// ── Campañas ─────────────────────────────────────────────────────────────────

export const getCampanas = async () => {
  const { data, error } = await supabase
    .from('campanas')
    .select('*, marcas(id, nombre), campanas_influencers(influencer_id)')
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

export const getCampanaById = async (id) => {
  const { data, error } = await supabase
    .from('campanas')
    .select('*, marcas(id, nombre), campanas_influencers(influencer_id, contrato_id, influencers(id, nombre, tipo))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createCampana = async (data) => {
  const { data: row, error } = await supabase
    .from('campanas')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export const updateCampana = async (id, data) => {
  const { data: row, error } = await supabase
    .from('campanas')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export const addInfluencerACampana = async (campanaId, influencerId, contratoId = null) => {
  const payload = { campana_id: campanaId, influencer_id: influencerId }
  if (contratoId) payload.contrato_id = contratoId
  const { data, error } = await supabase
    .from('campanas_influencers')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const removeInfluencerDeCampana = async (campanaId, influencerId) => {
  const { error } = await supabase
    .from('campanas_influencers')
    .delete()
    .eq('campana_id', campanaId)
    .eq('influencer_id', influencerId)
  if (error) throw error
}
