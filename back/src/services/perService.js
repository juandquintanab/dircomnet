const model = require('../models/perModel')

const FRECUENCIAS_VALIDAS = ['nula', 'baja', 'media', 'alta']
const TIPOS_LISTA         = ['convocatoria', 'gifting', 'gira', 'otra']
const ESTADOS_LISTA       = ['borrador', 'activa', 'cerrada', 'cancelada']
const ESTADOS_GIRA        = ['borrador', 'enviada', 'aprobada', 'rechazada', 'en_planificacion', 'ejecutada', 'cerrada']
const ORIGENES_CAMPO      = ['persona', 'personalizado']
const TIPOS_CAMPO         = ['texto', 'numero', 'fecha', 'booleano', 'select']

// ── helpers ───────────────────────────────────────────────────────────────────

function bad(msg) { return Object.assign(new Error(msg), { status: 400 }) }
function conflict(msg) { return Object.assign(new Error(msg), { status: 409 }) }

function validarCampos(campos) {
  for (const c of campos) {
    if (!c.nombre?.trim())                        throw bad('Todos los campos deben tener nombre')
    if (!ORIGENES_CAMPO.includes(c.origen))       throw bad(`origen inválido en campo "${c.nombre}"`)
    if (c.origen === 'persona' && !c.campo_persona)
      throw bad(`campo_persona requerido en "${c.nombre}"`)
    if (c.origen === 'personalizado') {
      if (!c.tipo_campo)                          throw bad(`tipo_campo requerido en campo "${c.nombre}"`)
      if (!TIPOS_CAMPO.includes(c.tipo_campo))    throw bad(`tipo_campo inválido en "${c.nombre}"`)
      if (c.tipo_campo === 'select' && !c.opciones?.length)
        throw bad(`El campo "${c.nombre}" es select y no tiene opciones`)
    }
  }
}

function buildPayloadPersona(body) {
  const {
    nombre, cedula, direccion, nota, frecuencia,
    tendencia, sentimiento_ep, influencia, contacto,
    respuesta, compromiso, engagement,
  } = body
  if (!nombre?.trim()) throw bad('El campo nombre es obligatorio')
  if (frecuencia && !FRECUENCIAS_VALIDAS.includes(frecuencia))
    throw bad(`Frecuencia inválida. Valores: ${FRECUENCIAS_VALIDAS.join(', ')}`)

  const num = (v) => (v != null ? Number(v) || null : null)
  return {
    nombre:         nombre.trim(),
    cedula:         cedula ?? null,
    direccion:      direccion ?? null,
    nota:           nota ?? null,
    frecuencia:     frecuencia ?? null,
    tendencia:      num(tendencia),
    sentimiento_ep: num(sentimiento_ep),
    influencia:     num(influencia),
    contacto:       num(contacto),
    respuesta:      num(respuesta),
    compromiso:     num(compromiso),
    engagement:     num(engagement),
  }
}

// ── personas ──────────────────────────────────────────────────────────────────

async function listarPersonas(query = {}) {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50))
  return model.getAllPersonas({ buscar: query.buscar, frecuencia: query.frecuencia, page, limit })
}

async function obtenerPersona(id) {
  return model.getPersonaById(id)
}

async function crearPersona(body) {
  const persona = await model.createPersona(buildPayloadPersona(body))
  const { correos = [], telefonos = [], redes_sociales = [], medios = [],
    stakeholders = [], fuentes = [], tipos_pr = [] } = body
  await model.sincronizarRelaciones(persona.id, { correos, telefonos, redes_sociales, medios, stakeholders, fuentes, tipos_pr })
  return model.getPersonaById(persona.id)
}

async function editarPersona(id, body) {
  await model.getPersonaById(id)
  const payload = { ...buildPayloadPersona(body), updated_at: new Date().toISOString() }
  await model.updatePersona(id, payload)
  const { correos = [], telefonos = [], redes_sociales = [], medios = [],
    stakeholders = [], fuentes = [], tipos_pr = [] } = body
  await model.sincronizarRelaciones(id, { correos, telefonos, redes_sociales, medios, stakeholders, fuentes, tipos_pr })
  return model.getPersonaById(id)
}

async function inactivarPersona(id) {
  await model.getPersonaById(id)
  return model.inactivarPersona(id)
}

// ── catálogos ─────────────────────────────────────────────────────────────────

async function listarMedios()       { return model.getMedios() }
async function listarStakeholders() { return model.getStakeholders() }
async function listarFuentes()      { return model.getFuentes() }
async function listarTiposPr()      { return model.getTiposPr() }

// ── plantillas ────────────────────────────────────────────────────────────────

async function listarPlantillas() { return model.getAllPlantillas() }

async function obtenerPlantilla(id) { return model.getPlantillaById(id) }

async function crearPlantilla(body) {
  const { nombre, tipo_lista, descripcion, campos = [] } = body
  if (!nombre?.trim())              throw bad('El nombre es obligatorio')
  if (!TIPOS_LISTA.includes(tipo_lista))
    throw bad(`tipo_lista inválido. Valores: ${TIPOS_LISTA.join(', ')}`)
  validarCampos(campos)
  const plantilla = await model.createPlantilla({
    nombre: nombre.trim(), tipo_lista, descripcion: descripcion ?? null,
  })
  await model.sincronizarCamposPlantilla(plantilla.id, campos)
  return model.getPlantillaById(plantilla.id)
}

async function editarPlantilla(id, body) {
  await model.getPlantillaById(id)
  const { nombre, tipo_lista, descripcion, activo, campos = [] } = body
  if (!nombre?.trim()) throw bad('El nombre es obligatorio')
  if (tipo_lista && !TIPOS_LISTA.includes(tipo_lista))
    throw bad(`tipo_lista inválido. Valores: ${TIPOS_LISTA.join(', ')}`)
  validarCampos(campos)
  const updates = { nombre: nombre.trim(), descripcion: descripcion ?? null }
  if (tipo_lista !== undefined) updates.tipo_lista = tipo_lista
  if (activo !== undefined)     updates.activo = Boolean(activo)
  await model.updatePlantilla(id, updates)
  await model.sincronizarCamposPlantilla(id, campos)
  return model.getPlantillaById(id)
}

// ── listas ────────────────────────────────────────────────────────────────────

async function listarListas(query = {}) {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50))
  return model.getAllListas({ tipo: query.tipo, estado: query.estado, page, limit })
}

async function obtenerLista(id) { return model.getListaById(id) }

async function crearLista(body) {
  const { nombre, plantilla_id, descripcion } = body
  if (!nombre?.trim())  throw bad('El nombre es obligatorio')
  if (!plantilla_id)    throw bad('La plantilla es obligatoria')
  const plantilla = await model.getPlantillaById(plantilla_id)
  if (!plantilla.activo) throw bad('Plantilla inactiva')
  const lista = await model.createLista({
    nombre: nombre.trim(), plantilla_id, descripcion: descripcion ?? null,
  })
  await model.copiarCamposDePlantillaALista(plantilla_id, lista.id)
  return model.getListaById(lista.id)
}

async function editarLista(id, body) {
  const lista = await model.getListaById(id)
  if (lista.estado === 'cerrada') throw conflict('No se puede editar una lista cerrada')
  const { nombre, descripcion } = body
  if (!nombre?.trim()) throw bad('El nombre es obligatorio')
  await model.updateLista(id, {
    nombre: nombre.trim(), descripcion: descripcion ?? null,
    updated_at: new Date().toISOString(),
  })
  return model.getListaById(id)
}

async function cambiarEstadoLista(id, estado) {
  if (!ESTADOS_LISTA.includes(estado))
    throw bad(`Estado inválido. Valores: ${ESTADOS_LISTA.join(', ')}`)
  const lista = await model.getListaById(id)
  if (lista.estado === 'cerrada')
    throw conflict('Una lista cerrada no puede cambiar de estado')
  await model.updateLista(id, { estado, updated_at: new Date().toISOString() })
  return { ok: true, estado }
}

async function agregarParticipante(listaId, body) {
  const lista = await model.getListaById(listaId)
  if (lista.estado === 'cerrada')
    throw conflict('No se pueden agregar participantes a una lista cerrada')
  const { persona_id, medio_id, comentario, valores = [] } = body
  if (!persona_id) throw bad('persona_id es obligatorio')
  return model.addParticipante(listaId, {
    persona_id, medio_id: medio_id ?? null, comentario: comentario ?? null, valores,
  })
}

async function editarParticipante(listaId, pid, body) {
  const lista = await model.getListaById(listaId)
  if (lista.estado === 'cerrada') throw conflict('Lista cerrada')
  const { medio_id, comentario, valores = [] } = body
  await model.updateParticipante(pid, {
    medio_id: medio_id ?? null, comentario: comentario ?? null,
  })
  if (valores.length) await model.upsertValoresParticipante(pid, valores)
  return model.getParticipanteById(pid)
}

async function quitarParticipante(listaId, pid) {
  const lista = await model.getListaById(listaId)
  if (lista.estado === 'cerrada')
    throw conflict('No se pueden quitar participantes de una lista cerrada')
  return model.removeParticipante(pid)
}

// ── giras ─────────────────────────────────────────────────────────────────────

async function listarGiras(query = {}) {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50))
  return model.getAllGiras({ estado: query.estado, page, limit })
}

async function obtenerGira(id) { return model.getGiraById(id) }

async function crearGira(body) {
  const { nombre, marca, campana, descripcion, fecha_inicio, fecha_fin } = body
  if (!nombre?.trim()) throw bad('El nombre es obligatorio')
  return model.createGira({
    nombre:      nombre.trim(),
    marca:       marca ?? null,
    campana:     campana ?? null,
    descripcion: descripcion ?? null,
    fecha_inicio: fecha_inicio ?? null,
    fecha_fin:   fecha_fin ?? null,
  })
}

async function editarGira(id, body) {
  await model.getGiraById(id)
  const { nombre, marca, campana, descripcion, fecha_inicio, fecha_fin } = body
  if (!nombre?.trim()) throw bad('El nombre es obligatorio')
  return model.updateGira(id, {
    nombre:      nombre.trim(),
    marca:       marca ?? null,
    campana:     campana ?? null,
    descripcion: descripcion ?? null,
    fecha_inicio: fecha_inicio ?? null,
    fecha_fin:   fecha_fin ?? null,
    updated_at:  new Date().toISOString(),
  })
}

async function cambiarEstadoGira(id, estado) {
  if (!ESTADOS_GIRA.includes(estado))
    throw bad(`Estado inválido. Valores: ${ESTADOS_GIRA.join(', ')}`)
  await model.getGiraById(id)
  return model.updateGira(id, { estado, updated_at: new Date().toISOString() })
}

async function agregarContactoAGira(giraId, body) {
  await model.getGiraById(giraId)
  const { persona_id, justificacion, estado } = body
  if (!persona_id) throw bad('persona_id es obligatorio')
  return model.addContactoAGira(giraId, {
    persona_id, justificacion: justificacion ?? null, estado: estado ?? null,
  })
}

async function quitarContactoDeGira(giraId, cid) {
  await model.getGiraById(giraId)
  return model.removeContactoDeGira(cid)
}

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  listarPersonas, obtenerPersona, crearPersona, editarPersona, inactivarPersona,
  listarMedios, listarStakeholders, listarFuentes, listarTiposPr,
  listarPlantillas, obtenerPlantilla, crearPlantilla, editarPlantilla,
  listarListas, obtenerLista, crearLista, editarLista, cambiarEstadoLista,
  agregarParticipante, editarParticipante, quitarParticipante,
  listarGiras, obtenerGira, crearGira, editarGira, cambiarEstadoGira,
  agregarContactoAGira, quitarContactoDeGira,
}
