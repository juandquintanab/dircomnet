const supabase = require('../config/supabaseClient')

// ── helpers ───────────────────────────────────────────────────────────────────

function notFound(msg = 'Registro no encontrado') {
  const e = new Error(msg)
  e.status = 404
  return e
}

function unwrap({ data, error }) {
  if (error) {
    if (error.code === 'PGRST116') throw notFound()
    throw error
  }
  return data
}

// ── participante select & mapper ──────────────────────────────────────────────

const PARTICIPANTE_SELECT = `
  id, comentario, created_at,
  personas(
    id, nombre, cedula, direccion, nota, frecuencia,
    tendencia, sentimiento_ep, influencia, contacto, respuesta, compromiso, engagement,
    correos(id, direccion, es_principal),
    telefonos(id, numero, es_principal),
    persona_medios!left(id, medios(id, nombre, tipo_medio))
  ),
  medios(id, nombre, tipo_medio),
  valores_participante(id, campo_lista_id, valor)
`

function mapParticipante(p) {
  const persona = p.personas
  return {
    id:         p.id,
    comentario: p.comentario,
    created_at: p.created_at,
    medio:      p.medios,
    valores:    p.valores_participante || [],
    persona: persona ? {
      id:             persona.id,
      nombre:         persona.nombre,
      cedula:         persona.cedula,
      direccion:      persona.direccion,
      nota:           persona.nota,
      frecuencia:     persona.frecuencia,
      tendencia:      persona.tendencia,
      sentimiento_ep: persona.sentimiento_ep,
      influencia:     persona.influencia,
      contacto:       persona.contacto,
      respuesta:      persona.respuesta,
      compromiso:     persona.compromiso,
      engagement:     persona.engagement,
      correos:        persona.correos || [],
      telefonos:      persona.telefonos || [],
      medios:         (persona.persona_medios || []).map((r) => ({ ...r.medios, rel_id: r.id })),
    } : null,
  }
}

async function getParticipanteById(id) {
  const { data, error } = await supabase
    .from('participantes_lista')
    .select(PARTICIPANTE_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return mapParticipante(data)
}

// ── personas ──────────────────────────────────────────────────────────────────

async function getAllPersonas({ buscar, frecuencia, page = 1, limit = 50 } = {}) {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let q = supabase
    .from('personas')
    .select(
      `id, nombre, frecuencia, influencia,
       correos(direccion),
       persona_medios!left(medios(id, nombre, tipo_medio)),
       persona_fuentes!left(fuentes(id, nombre))`,
      { count: 'exact' }
    )
    .order('nombre')
    .range(from, to)

  if (buscar?.trim())  q = q.ilike('nombre', `%${buscar.trim()}%`)
  if (frecuencia)      q = q.eq('frecuencia', frecuencia)

  const { data, error, count } = await q
  if (error) throw error

  const personas = (data || []).map((p) => ({
    id:         p.id,
    nombre:     p.nombre,
    frecuencia: p.frecuencia,
    influencia: p.influencia,
    correos:    [...new Set((p.correos || []).map((c) => c.direccion).filter(Boolean))],
    medios:     (p.persona_medios || []).map((r) => r.medios).filter(Boolean)
                  .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i),
    fuentes:    (p.persona_fuentes || []).map((r) => r.fuentes).filter(Boolean)
                  .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i),
  }))

  return { data: personas, total: count ?? 0, page: Number(page), limit: Number(limit) }
}

async function getPersonaById(id) {
  const { data: persona, error: errP } = await supabase
    .from('personas').select('*').eq('id', id).single()
  if (errP) {
    if (errP.code === 'PGRST116') throw notFound()
    throw errP
  }

  const [
    { data: correos },
    { data: telefonos },
    { data: redes },
    { data: medios },
    { data: historial },
    { data: stakeholders },
    { data: fuentes },
    { data: tiposPr },
  ] = await Promise.all([
    supabase.from('correos').select('*').eq('persona_id', id),
    supabase.from('telefonos').select('*').eq('persona_id', id),
    supabase.from('redes_sociales').select('*').eq('persona_id', id),
    supabase.from('persona_medios').select('id, medios(id, nombre, tipo_medio)').eq('persona_id', id),
    supabase.from('persona_medios_historial')
      .select('id, fecha_inicio, fecha_fin, medios(id, nombre, tipo_medio)')
      .eq('persona_id', id).order('fecha_fin', { ascending: false }),
    supabase.from('persona_stakeholders').select('stakeholders(id, nombre)').eq('persona_id', id),
    supabase.from('persona_fuentes').select('fuentes(id, nombre)').eq('persona_id', id),
    supabase.from('persona_tipos_pr').select('tipos_pr(id, nombre)').eq('persona_id', id),
  ])

  return {
    ...persona,
    correos:          correos || [],
    telefonos:        telefonos || [],
    redes_sociales:   redes || [],
    medios:           (medios || []).map((r) => ({ ...r.medios, rel_id: r.id })),
    historial_medios: (historial || []).map((r) => ({
      ...r.medios, fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin, rel_id: r.id,
    })),
    stakeholders:     (stakeholders || []).map((r) => r.stakeholders),
    fuentes:          (fuentes || []).map((r) => r.fuentes),
    tipos_pr:         (tiposPr || []).map((r) => r.tipos_pr),
  }
}

async function createPersona(payload) {
  return unwrap(await supabase.from('personas').insert(payload).select().single())
}

async function updatePersona(id, payload) {
  return unwrap(
    await supabase.from('personas').update(payload).eq('id', id).select().single()
  )
}

async function inactivarPersona(id) {
  const { error } = await supabase
    .from('personas')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── relaciones de persona ─────────────────────────────────────────────────────

async function sincronizarRelaciones(
  personaId,
  { correos = [], telefonos = [], redes_sociales = [], medios = [], stakeholders = [], fuentes = [], tipos_pr = [] }
) {
  await Promise.all([
    supabase.from('correos').delete().eq('persona_id', personaId),
    supabase.from('telefonos').delete().eq('persona_id', personaId),
    supabase.from('redes_sociales').delete().eq('persona_id', personaId),
    supabase.from('persona_medios').delete().eq('persona_id', personaId),
    supabase.from('persona_stakeholders').delete().eq('persona_id', personaId),
    supabase.from('persona_fuentes').delete().eq('persona_id', personaId),
    supabase.from('persona_tipos_pr').delete().eq('persona_id', personaId),
  ])

  const ops = []
  if (correos.length)
    ops.push(supabase.from('correos').insert(correos.map((c) => ({ ...c, persona_id: personaId }))))
  if (telefonos.length)
    ops.push(supabase.from('telefonos').insert(telefonos.map((t) => ({ ...t, persona_id: personaId }))))
  if (redes_sociales.length)
    ops.push(supabase.from('redes_sociales').insert(redes_sociales.map((r) => ({
      plataforma: r.plataforma, usuario: r.usuario, persona_id: personaId,
    }))))
  if (medios.length)
    ops.push(supabase.from('persona_medios').insert(medios.map((m) => ({
      medio_id: m.id ?? m, persona_id: personaId,
    }))))
  if (stakeholders.length)
    ops.push(supabase.from('persona_stakeholders').insert(stakeholders.map((s) => ({
      stakeholder_id: s.id ?? s, persona_id: personaId,
    }))))
  if (fuentes.length)
    ops.push(supabase.from('persona_fuentes').insert(fuentes.map((f) => ({
      fuente_id: f.id ?? f, persona_id: personaId,
    }))))
  if (tipos_pr.length)
    ops.push(supabase.from('persona_tipos_pr').insert(tipos_pr.map((t) => ({
      tipo_pr_id: t.id ?? t, persona_id: personaId,
    }))))

  await Promise.all(ops)
}

// ── catálogos ─────────────────────────────────────────────────────────────────

async function getMedios() {
  const { data, error } = await supabase
    .from('medios').select('id, nombre, tipo_medio').eq('activo', true).order('nombre')
  if (error) throw error
  return data
}

async function getStakeholders() {
  const { data, error } = await supabase.from('stakeholders').select('id, nombre').order('nombre')
  if (error) throw error
  return data
}

async function getFuentes() {
  const { data, error } = await supabase.from('fuentes').select('id, nombre').order('nombre')
  if (error) throw error
  return data
}

async function getTiposPr() {
  const { data, error } = await supabase.from('tipos_pr').select('id, nombre').order('nombre')
  if (error) throw error
  return data
}

// ── plantillas ────────────────────────────────────────────────────────────────

async function getAllPlantillas() {
  const { data, error } = await supabase
    .from('plantillas_lista')
    .select('id, nombre, tipo_lista, descripcion, activo, created_at, listas(id)')
    .order('nombre')
  if (error) throw error
  return (data || []).map((p) => ({
    id:           p.id,
    nombre:       p.nombre,
    tipo_lista:   p.tipo_lista,
    descripcion:  p.descripcion,
    activo:       p.activo,
    created_at:   p.created_at,
    total_listas: (p.listas || []).length,
  }))
}

async function getPlantillaById(id) {
  const { data: plantilla, error: errP } = await supabase
    .from('plantillas_lista').select('*').eq('id', id).single()
  if (errP) {
    if (errP.code === 'PGRST116') throw notFound()
    throw errP
  }

  const { data: campos, error: errC } = await supabase
    .from('campos_plantilla')
    .select('id, nombre, origen, campo_persona, tipo_campo, obligatorio, orden, opciones_campo(id, valor)')
    .eq('plantilla_id', id)
    .order('orden')
  if (errC) throw errC

  return { ...plantilla, campos_plantilla: campos || [] }
}

async function createPlantilla(payload) {
  return unwrap(await supabase.from('plantillas_lista').insert(payload).select().single())
}

async function updatePlantilla(id, payload) {
  return unwrap(
    await supabase.from('plantillas_lista').update(payload).eq('id', id).select().single()
  )
}

async function sincronizarCamposPlantilla(plantillaId, campos) {
  // Borrar opciones antes que campos para evitar FK error
  const { data: camposExistentes } = await supabase
    .from('campos_plantilla').select('id').eq('plantilla_id', plantillaId)
  if (camposExistentes?.length) {
    const ids = camposExistentes.map((c) => c.id)
    await supabase.from('opciones_campo').delete().in('campo_id', ids)
  }
  await supabase.from('campos_plantilla').delete().eq('plantilla_id', plantillaId)

  if (!campos?.length) return

  const { data: insertados, error } = await supabase
    .from('campos_plantilla')
    .insert(
      campos.map((c, i) => ({
        plantilla_id:  plantillaId,
        nombre:        c.nombre,
        origen:        c.origen,
        campo_persona: c.campo_persona ?? null,
        tipo_campo:    c.tipo_campo ?? null,
        obligatorio:   Boolean(c.obligatorio),
        orden:         Number.isInteger(c.orden) ? c.orden : i,
      }))
    )
    .select()
  if (error) throw error

  const opciones = []
  insertados.forEach((campo, i) => {
    if (campo.tipo_campo === 'select' && campos[i]?.opciones?.length) {
      campos[i].opciones.forEach((op) => {
        opciones.push({ campo_id: campo.id, valor: typeof op === 'string' ? op : op.valor })
      })
    }
  })
  if (opciones.length) {
    const { error: errOp } = await supabase.from('opciones_campo').insert(opciones)
    if (errOp) throw errOp
  }
}

// ── listas ────────────────────────────────────────────────────────────────────

async function getAllListas({ tipo, estado, page = 1, limit = 50 } = {}) {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let plantillaIds = null
  if (tipo) {
    const { data: plantillas } = await supabase
      .from('plantillas_lista').select('id').eq('tipo_lista', tipo)
    plantillaIds = (plantillas || []).map((p) => p.id)
    if (!plantillaIds.length)
      return { data: [], total: 0, page: Number(page), limit: Number(limit) }
  }

  let q = supabase
    .from('listas')
    .select(
      'id, nombre, estado, descripcion, created_at, updated_at, plantillas_lista(id, nombre, tipo_lista), participantes_lista(id)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (estado)       q = q.eq('estado', estado)
  if (plantillaIds) q = q.in('plantilla_id', plantillaIds)

  const { data, error, count } = await q
  if (error) throw error
  return { data: data || [], total: count ?? 0, page: Number(page), limit: Number(limit) }
}

async function getListaById(listaId) {
  const { data: lista, error: errL } = await supabase
    .from('listas')
    .select('id, nombre, estado, descripcion, created_at, updated_at, plantillas_lista(id, nombre, tipo_lista)')
    .eq('id', listaId)
    .single()
  if (errL) {
    if (errL.code === 'PGRST116') throw notFound()
    throw errL
  }

  const [
    { data: campos, error: errC },
    { data: participantes, error: errP },
  ] = await Promise.all([
    supabase
      .from('campos_lista')
      .select('id, nombre, origen, campo_persona, tipo_campo, obligatorio, orden, opciones_campo_lista(id, valor)')
      .eq('lista_id', listaId)
      .order('orden'),
    supabase
      .from('participantes_lista')
      .select(PARTICIPANTE_SELECT)
      .eq('lista_id', listaId)
      .order('created_at'),
  ])

  if (errC) throw errC
  if (errP) throw errP

  return {
    ...lista,
    campos_lista:        campos || [],
    participantes_lista: (participantes || []).map(mapParticipante),
  }
}

async function createLista(payload) {
  return unwrap(await supabase.from('listas').insert(payload).select().single())
}

async function updateLista(id, payload) {
  return unwrap(
    await supabase.from('listas').update(payload).eq('id', id).select().single()
  )
}

async function copiarCamposDePlantillaALista(plantillaId, listaId) {
  const { data: campos, error } = await supabase
    .from('campos_plantilla')
    .select('*, opciones_campo(*)')
    .eq('plantilla_id', plantillaId)
    .order('orden')
  if (error) throw error
  if (!campos?.length) return

  const { data: insertados, error: errC } = await supabase
    .from('campos_lista')
    .insert(
      campos.map((c) => ({
        lista_id:      listaId,
        nombre:        c.nombre,
        origen:        c.origen,
        campo_persona: c.campo_persona,
        tipo_campo:    c.tipo_campo,
        obligatorio:   c.obligatorio,
        orden:         c.orden,
      }))
    )
    .select()
  if (errC) throw errC

  const opciones = []
  insertados.forEach((campo, i) => {
    if (campo.tipo_campo === 'select' && campos[i]?.opciones_campo?.length) {
      campos[i].opciones_campo.forEach((op) => {
        opciones.push({ campo_lista_id: campo.id, valor: op.valor })
      })
    }
  })
  if (opciones.length) {
    const { error: errOp } = await supabase.from('opciones_campo_lista').insert(opciones)
    if (errOp) throw errOp
  }
}

// ── participantes ─────────────────────────────────────────────────────────────

async function addParticipante(listaId, { persona_id, medio_id, comentario, valores = [] }) {
  // Validar campos obligatorios personalizados de la lista
  const { data: obligatorios, error: errO } = await supabase
    .from('campos_lista')
    .select('id, nombre')
    .eq('lista_id', listaId)
    .eq('origen', 'personalizado')
    .eq('obligatorio', true)
  if (errO) throw errO

  if (obligatorios?.length) {
    const provistos = new Set((valores || []).map((v) => v.campo_lista_id))
    const faltantes = obligatorios.filter((c) => !provistos.has(c.id))
    if (faltantes.length) {
      const err = new Error(`Campos obligatorios sin valor: ${faltantes.map((c) => c.nombre).join(', ')}`)
      err.status = 400
      throw err
    }
  }

  const { data: participante, error: errIns } = await supabase
    .from('participantes_lista')
    .insert({ lista_id: listaId, persona_id, medio_id: medio_id || null, comentario: comentario || null })
    .select()
    .single()
  if (errIns) throw errIns

  if (valores.length) {
    const { error: errV } = await supabase.from('valores_participante').insert(
      valores.map((v) => ({
        participante_id: participante.id,
        campo_lista_id:  v.campo_lista_id,
        valor:           v.valor ?? null,
      }))
    )
    if (errV) throw errV
  }

  return getParticipanteById(participante.id)
}

async function updateParticipante(id, payload) {
  const { error } = await supabase.from('participantes_lista').update(payload).eq('id', id)
  if (error) throw error
}

async function removeParticipante(id) {
  const { error } = await supabase.from('participantes_lista').delete().eq('id', id)
  if (error) throw error
}

async function upsertValoresParticipante(participanteId, valores) {
  for (const v of valores) {
    const { error } = await supabase
      .from('valores_participante')
      .upsert(
        { participante_id: Number(participanteId), campo_lista_id: v.campo_lista_id, valor: v.valor ?? null },
        { onConflict: 'participante_id,campo_lista_id' }
      )
    if (error) throw error
  }
}

// ── giras ─────────────────────────────────────────────────────────────────────

async function getAllGiras({ estado, page = 1, limit = 50 } = {}) {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let q = supabase
    .from('giras')
    .select('*, gira_contactos(id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (estado) q = q.eq('estado', estado)

  const { data, error, count } = await q
  if (error) throw error
  return { data: data || [], total: count ?? 0, page: Number(page), limit: Number(limit) }
}

async function getGiraById(id) {
  return unwrap(
    await supabase
      .from('giras')
      .select(`
        *,
        gira_contactos(
          id, justificacion, estado,
          personas(id, nombre, cedula, persona_medios(medios(id, nombre, tipo_medio)))
        )
      `)
      .eq('id', id)
      .single()
  )
}

async function createGira(payload) {
  return unwrap(await supabase.from('giras').insert(payload).select().single())
}

async function updateGira(id, payload) {
  return unwrap(
    await supabase.from('giras').update(payload).eq('id', id).select().single()
  )
}

async function addContactoAGira(giraId, payload) {
  return unwrap(
    await supabase
      .from('gira_contactos')
      .insert({ gira_id: giraId, ...payload })
      .select()
      .single()
  )
}

async function removeContactoDeGira(id) {
  const { error } = await supabase.from('gira_contactos').delete().eq('id', id)
  if (error) throw error
}

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getAllPersonas, getPersonaById, createPersona, updatePersona, inactivarPersona,
  sincronizarRelaciones,
  getMedios, getStakeholders, getFuentes, getTiposPr,
  getAllPlantillas, getPlantillaById, createPlantilla, updatePlantilla,
  sincronizarCamposPlantilla,
  getAllListas, getListaById, createLista, updateLista,
  copiarCamposDePlantillaALista,
  addParticipante, updateParticipante, removeParticipante,
  upsertValoresParticipante, getParticipanteById,
  getAllGiras, getGiraById, createGira, updateGira,
  addContactoAGira, removeContactoDeGira,
}
