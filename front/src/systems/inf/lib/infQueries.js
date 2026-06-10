import { supabase } from '../../../lib/supabase'

// ── Influencers ──────────────────────────────────────────────────────────────

export const getInfluencers = async ({ tipo, categoria } = {}) => {
  let query = supabase.from('influencers').select('*').order('nombre')
  if (tipo) query = query.eq('tipo', tipo)
  if (categoria) query = query.eq('categoria', categoria)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getInfluencerById = async (id) => {
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
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

export const createInfluencer = async (data) => {
  const { data: row, error } = await supabase
    .from('influencers')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export const updateInfluencer = async (id, data) => {
  const { data: row, error } = await supabase
    .from('influencers')
    .update(data)
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
