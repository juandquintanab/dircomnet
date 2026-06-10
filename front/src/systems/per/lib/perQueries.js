const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function _api(method, path, body) {
  const opts = { method, headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${API_URL}${path}`, opts)
  if (!res.ok) {
    let msg
    try { msg = (await res.json()).error } catch { msg = res.statusText }
    const err = new Error(msg || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) return null
  return res.json()
}

// ── Transformaciones ──────────────────────────────────────────────────────────

// Persona del listado: correos planos → objetos, medios plano → persona_medios Supabase-style
function mapPersonaListItem(p) {
  return {
    id:             p.id,
    nombre:         p.nombre,
    activo:         p.activo ?? true,
    frecuencia:     p.frecuencia,
    influencia:     p.influencia,
    tendencia:      p.tendencia,
    correos:        (p.correos ?? []).map((dir) => ({ direccion: dir })),
    persona_medios: (p.medios  ?? []).map((m)   => ({ medios: m })),
  }
}

// Persona detalle: relaciones planas → Supabase-style anidado (para PersonaForm y PersonaDetalle)
function mapPersonaDetail(p) {
  if (!p) return p
  return {
    ...p,
    persona_medios:       (p.medios       ?? []).map((m) => ({
      id:     m.rel_id,
      medios: { id: m.id, nombre: m.nombre, tipo_medio: m.tipo_medio },
    })),
    persona_stakeholders: (p.stakeholders ?? []).map((s) => ({ stakeholders: s })),
    persona_fuentes:      (p.fuentes      ?? []).map((f) => ({ fuentes:      f })),
    persona_tipos_pr:     (p.tipos_pr     ?? []).map((t) => ({ tipos_pr:     t })),
  }
}

// Participante del backend (keys: persona/medio/valores) → frontend (keys: personas/medios/valores_participante)
function mapParticipante(p) {
  if (!p) return p
  const { persona, medio, valores, ...rest } = p
  const { medios: personaMedios, ...personaRest } = persona ?? {}
  return {
    ...rest,
    personas: persona ? {
      ...personaRest,
      persona_medios: (personaMedios ?? []).map((m) => ({
        id:     m.rel_id,
        medios: { id: m.id, nombre: m.nombre, tipo_medio: m.tipo_medio },
      })),
    } : null,
    medios:              medio,
    valores_participante: valores ?? [],
  }
}

// Lista completa: aplica mapParticipante a cada participante
function mapListaResponse(lista) {
  if (!lista) return lista
  return {
    ...lista,
    participantes_lista: (lista.participantes_lista ?? []).map(mapParticipante),
  }
}

// Campo del backend → PlantillaForm (origen/campo_persona/nombre/obligatorio → tipo_campo/tipo_persona/etiqueta/requerido)
function mapCampoFromBackend(c) {
  const esPersona = c.origen === 'persona'
  return {
    id:           c.id,
    tipo_campo:   esPersona ? 'persona' : (c.tipo_campo === 'booleano' ? 'checkbox' : c.tipo_campo),
    tipo_persona: esPersona ? c.campo_persona : null,
    etiqueta:     c.nombre,
    requerido:    c.obligatorio ?? false,
    orden:        c.orden,
    opciones_campo: c.opciones_campo ?? [],
  }
}

// Campo del PlantillaForm → backend (tipo_campo/tipo_persona/etiqueta/requerido → origen/campo_persona/nombre/obligatorio)
function mapCampoToBackend(c, i) {
  const esPersona = c.tipo_campo === 'persona'
  return {
    nombre:        c.etiqueta ?? '',
    origen:        esPersona ? 'persona' : 'personalizado',
    campo_persona: esPersona ? (c.tipo_persona ?? null) : null,
    tipo_campo:    esPersona ? null : (c.tipo_campo === 'checkbox' ? 'booleano' : (c.tipo_campo ?? null)),
    obligatorio:   Boolean(c.requerido),
    orden:         Number.isInteger(c.orden) ? c.orden : i,
    opciones:      esPersona ? [] : (c.opciones ?? []),
  }
}

// Plantilla del backend: aplica mapCampoFromBackend a campos_plantilla
function mapPlantillaFromBackend(p) {
  if (!p) return p
  return { ...p, campos_plantilla: (p.campos_plantilla ?? []).map(mapCampoFromBackend) }
}

// ── Caches de módulo ──────────────────────────────────────────────────────────

// Payload de la última llamada createPersona / updatePersona para ser completado por sincronizarRelacionesPersona
let _lastPersonaPayload   = {}
// Payload de la última llamada createPlantilla / updatePlantilla para ser completado por sincronizarCamposPlantilla
let _lastPlantillaPayload = {}
// Lista activa (para upsertValorParticipante y removeParticipante que no reciben listaId)
let _currentListaId = null
let _currentLista   = null
// Gira activa (para removeContactoDeGira que no recibe giraId)
let _currentGiraId  = null

// ── Personas ──────────────────────────────────────────────────────────────────

export const getPersonas = async ({ buscar, frecuencia, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams()
  if (buscar?.trim())  params.set('buscar', buscar.trim())
  if (frecuencia)      params.set('frecuencia', frecuencia)
  params.set('page',  String(page))
  params.set('limit', String(limit))
  const res = await _api('GET', `/api/per/personas?${params}`)
  return {
    data:  (res.data ?? []).map(mapPersonaListItem),
    total: res.total ?? 0,
    page:  res.page  ?? page,
    limit: res.limit ?? limit,
  }
}

export const getPersonaById = async (id) => {
  const data = await _api('GET', `/api/per/personas/${id}`)
  return mapPersonaDetail(data)
}

// createPersona y updatePersona + sincronizarRelacionesPersona se ejecutan en secuencia
// desde PersonaForm. El payload base se cachea y la llamada real al backend se consolida
// en sincronizarRelacionesPersona para enviar todo en una sola petición PUT.

export const createPersona = async (payload) => {
  _lastPersonaPayload = payload
  // El POST crea la persona; las relaciones (vacías aquí) se sincronizan en sincronizarRelacionesPersona
  const data = await _api('POST', '/api/per/personas', payload)
  return mapPersonaDetail(data)
}

export const updatePersona = async (id, payload) => {
  // Solo cachea — la llamada real ocurre en sincronizarRelacionesPersona junto con las relaciones
  _lastPersonaPayload = { ...payload, _id: id }
}

export const inactivarPersona = async (id) => {
  await _api('PATCH', `/api/per/personas/${id}/inactivar`)
}

export const sincronizarRelacionesPersona = async (personaId, relaciones) => {
  const { _id, ...basePayload } = _lastPersonaPayload
  await _api('PUT', `/api/per/personas/${personaId}`, { ...basePayload, ...relaciones })
  _lastPersonaPayload = {}
}

// ── Catálogos ─────────────────────────────────────────────────────────────────

export const getMedios       = () => _api('GET', '/api/per/medios')
export const getStakeholders = () => _api('GET', '/api/per/stakeholders')
export const getFuentes      = () => _api('GET', '/api/per/fuentes')
export const getTiposPr      = () => _api('GET', '/api/per/tipos-pr')

// ── Plantillas ────────────────────────────────────────────────────────────────

export const getPlantillas = () => _api('GET', '/api/per/plantillas')

export const getPlantillaById = async (id) => {
  const data = await _api('GET', `/api/per/plantillas/${id}`)
  return mapPlantillaFromBackend(data)
}

// createPlantilla / updatePlantilla + sincronizarCamposPlantilla siguen el mismo patrón
// que create/updatePersona: el payload base se cachea y la llamada real al backend ocurre
// en sincronizarCamposPlantilla junto con los campos transformados.

export const createPlantilla = async (nombre, tipo_lista) => {
  _lastPlantillaPayload = { nombre, tipo_lista }
  return _api('POST', '/api/per/plantillas', { nombre, tipo_lista, campos: [] })
}

export const updatePlantilla = async (id, nombre, tipo_lista) => {
  _lastPlantillaPayload = { id, nombre, tipo_lista }
}

export const sincronizarCamposPlantilla = async (plantillaId, campos) => {
  const { id: _, ...base } = _lastPlantillaPayload
  await _api('PUT', `/api/per/plantillas/${plantillaId}`, {
    ...base,
    campos: campos.map(mapCampoToBackend),
  })
  _lastPlantillaPayload = {}
}

// ── Listas — conteo ───────────────────────────────────────────────────────────

export const getListasCountByPlantilla = async () => {
  const plantillas = await _api('GET', '/api/per/plantillas')
  const map = {}
  for (const p of (plantillas ?? [])) map[p.id] = p.total_listas ?? 0
  return map
}

// ── Listas ────────────────────────────────────────────────────────────────────

export const getListas = async ({ tipo, estado, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams()
  if (tipo)   params.set('tipo', tipo)
  if (estado) params.set('estado', estado)
  params.set('page',  String(page))
  params.set('limit', String(limit))
  return _api('GET', `/api/per/listas?${params}`)
}

export const getListaById = async (id) => {
  _currentListaId = id
  const data = await _api('GET', `/api/per/listas/${id}`)
  _currentLista = mapListaResponse(data)
  return _currentLista
}

export const updateListaEstado = async (id, estado) => {
  return _api('PATCH', `/api/per/listas/${id}/estado`, { estado })
}

export const createLista = async ({ nombre, plantilla_id }) => {
  return _api('POST', '/api/per/listas', { nombre, plantilla_id })
}

// ── Participantes ─────────────────────────────────────────────────────────────

export const addParticipante = async ({ lista_id, persona_id, medio_id, comentario }) => {
  const data = await _api('POST', `/api/per/listas/${lista_id}/participantes`, {
    persona_id,
    medio_id:   medio_id   || null,
    comentario: comentario || null,
  })
  return mapParticipante(data)
}

export const removeParticipante = async (participanteId) => {
  await _api('DELETE', `/api/per/listas/${_currentListaId}/participantes/${participanteId}`)
}

// upsertValorParticipante preserva medio_id y comentario del participante actual para que
// el PUT del backend no los sobreescriba con null.
export const upsertValorParticipante = async (participanteId, campoListaId, valor) => {
  const part = _currentLista?.participantes_lista?.find((p) => p.id === participanteId)
  await _api('PUT', `/api/per/listas/${_currentListaId}/participantes/${participanteId}`, {
    medio_id:   part?.medios?.id  ?? null,
    comentario: part?.comentario  ?? null,
    valores:    [{ campo_lista_id: campoListaId, valor }],
  })
}

// ── Giras ─────────────────────────────────────────────────────────────────────

export const getGiras = async ({ estado, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  params.set('page',  String(page))
  params.set('limit', String(limit))
  return _api('GET', `/api/per/giras?${params}`)
}

export const getGiraById = async (id) => {
  _currentGiraId = id
  return _api('GET', `/api/per/giras/${id}`)
}

export const updateGiraEstado = async (id, estado) => {
  return _api('PATCH', `/api/per/giras/${id}/estado`, { estado })
}

export const removeContactoDeGira = async (contactoId) => {
  await _api('DELETE', `/api/per/giras/${_currentGiraId}/contactos/${contactoId}`)
}
