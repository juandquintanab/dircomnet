const supabase = require('../config/supabaseClient')

// ── helpers ─────────────────────────────────────────────────────────────────

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

// ── influencers ──────────────────────────────────────────────────────────────

async function getAllInfluencers({ tipo, categoria } = {}) {
  let q = supabase.from('influencers').select('*').order('nombre')
  if (tipo) q = q.eq('tipo', tipo)
  if (categoria) q = q.eq('categoria', categoria)
  const { data, error } = await q
  if (error) throw error
  return data
}

async function getInfluencerById(id) {
  return unwrap(await supabase.from('influencers').select('*').eq('id', id).single())
}

async function getInfluencerContratos(id) {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('influencer_id', id)
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

async function getInfluencerCampanas(id) {
  const { data, error } = await supabase
    .from('campanas_influencers')
    .select('contrato_id, campanas(id, nombre, fecha_inicio, fecha_fin, marcas(nombre))')
    .eq('influencer_id', id)
  if (error) throw error
  return (data || []).map((r) => ({ ...r.campanas, contrato_id: r.contrato_id }))
}

async function createInfluencer(data) {
  return unwrap(await supabase.from('influencers').insert(data).select().single())
}

async function updateInfluencer(id, data) {
  return unwrap(await supabase.from('influencers').update(data).eq('id', id).select().single())
}

async function deleteInfluencer(id) {
  const { error } = await supabase.from('influencers').delete().eq('id', id)
  if (error) throw error
}

// ── marcas ───────────────────────────────────────────────────────────────────

async function getAllMarcas() {
  const { data, error } = await supabase.from('marcas').select('*').order('nombre')
  if (error) throw error
  return data
}

async function getMarcaById(id) {
  return unwrap(await supabase.from('marcas').select('*').eq('id', id).single())
}

async function createMarca(data) {
  return unwrap(await supabase.from('marcas').insert(data).select().single())
}

async function updateMarca(id, data) {
  return unwrap(await supabase.from('marcas').update(data).eq('id', id).select().single())
}

async function deleteMarca(id) {
  const { error } = await supabase.from('marcas').delete().eq('id', id)
  if (error) throw error
}

// ── contratos ────────────────────────────────────────────────────────────────

async function getAllContratos(dateFilters = {}) {
  let q = supabase
    .from('contratos')
    .select('*, influencers(id, nombre)')
    .order('fecha_inicio', { ascending: false })
  if (dateFilters.gte) q = q.gte('fecha_fin', dateFilters.gte)
  if (dateFilters.lt)  q = q.lt('fecha_fin', dateFilters.lt)
  if (dateFilters.lte) q = q.lte('fecha_fin', dateFilters.lte)
  const { data, error } = await q
  if (error) throw error
  return data
}

async function getContratoById(id) {
  return unwrap(
    await supabase
      .from('contratos')
      .select('*, influencers(id, nombre), entregables(*), pagos(*)')
      .eq('id', id)
      .single(),
  )
}

async function createContrato(data) {
  return unwrap(await supabase.from('contratos').insert(data).select().single())
}

async function updateContrato(id, data) {
  return unwrap(await supabase.from('contratos').update(data).eq('id', id).select().single())
}

async function deleteContrato(id) {
  const { error } = await supabase.from('contratos').delete().eq('id', id)
  if (error) throw error
}

// ── entregables ───────────────────────────────────────────────────────────────

async function getEntregableById(id) {
  return unwrap(await supabase.from('entregables').select('*').eq('id', id).single())
}

async function createEntregable(data) {
  return unwrap(await supabase.from('entregables').insert(data).select().single())
}

async function updateEntregable(id, data) {
  return unwrap(await supabase.from('entregables').update(data).eq('id', id).select().single())
}

async function deleteEntregable(id) {
  const { error } = await supabase.from('entregables').delete().eq('id', id)
  if (error) throw error
}

// ── pagos ─────────────────────────────────────────────────────────────────────

async function getPagoById(id) {
  return unwrap(await supabase.from('pagos').select('*').eq('id', id).single())
}

async function createPago(data) {
  return unwrap(await supabase.from('pagos').insert(data).select().single())
}

async function updatePago(id, data) {
  return unwrap(await supabase.from('pagos').update(data).eq('id', id).select().single())
}

async function deletePago(id) {
  const { error } = await supabase.from('pagos').delete().eq('id', id)
  if (error) throw error
}

// ── campanas ──────────────────────────────────────────────────────────────────

async function getAllCampanas() {
  const { data, error } = await supabase
    .from('campanas')
    .select('*, marcas(id, nombre), campanas_influencers(influencer_id)')
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

async function getCampanaById(id) {
  return unwrap(
    await supabase
      .from('campanas')
      .select('*, marcas(id, nombre), campanas_influencers(influencer_id, contrato_id, influencers(id, nombre, tipo))')
      .eq('id', id)
      .single(),
  )
}

async function createCampana(data) {
  return unwrap(await supabase.from('campanas').insert(data).select().single())
}

async function updateCampana(id, data) {
  return unwrap(await supabase.from('campanas').update(data).eq('id', id).select().single())
}

async function deleteCampana(id) {
  const { error } = await supabase.from('campanas').delete().eq('id', id)
  if (error) throw error
}

async function addInfluencerACampana(campanaId, influencerId, contratoId) {
  const payload = { campana_id: campanaId, influencer_id: influencerId }
  if (contratoId) payload.contrato_id = contratoId
  return unwrap(await supabase.from('campanas_influencers').insert(payload).select().single())
}

async function removeInfluencerDeCampana(campanaId, influencerId) {
  const { error } = await supabase
    .from('campanas_influencers')
    .delete()
    .eq('campana_id', campanaId)
    .eq('influencer_id', influencerId)
  if (error) throw error
}

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getAllInfluencers, getInfluencerById, getInfluencerContratos, getInfluencerCampanas,
  createInfluencer, updateInfluencer, deleteInfluencer,
  getAllMarcas, getMarcaById, createMarca, updateMarca, deleteMarca,
  getAllContratos, getContratoById, createContrato, updateContrato, deleteContrato,
  getEntregableById, createEntregable, updateEntregable, deleteEntregable,
  getPagoById, createPago, updatePago, deletePago,
  getAllCampanas, getCampanaById, createCampana, updateCampana, deleteCampana,
  addInfluencerACampana, removeInfluencerDeCampana,
}
