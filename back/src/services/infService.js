const model = require('../models/infModel')

// ── utilidades ───────────────────────────────────────────────────────────────

function calcEstatus(fechaFin) {
  if (!fechaFin) return 'sin_fecha'
  const hoy = new Date().toISOString().split('T')[0]
  const en30 = new Date()
  en30.setDate(en30.getDate() + 30)
  const en30Str = en30.toISOString().split('T')[0]
  if (fechaFin < hoy) return 'vencido'
  if (fechaFin <= en30Str) return 'por_vencer'
  return 'activo'
}

function resumenFinanciero(contrato) {
  const totalPagado = (contrato.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
  return {
    monto_total: Number(contrato.monto_total),
    total_pagado: totalPagado,
    saldo_pendiente: Number(contrato.monto_total) - totalPagado,
  }
}

// ── influencers ───────────────────────────────────────────────────────────────

async function listarInfluencers(query = {}) {
  const filters = {}
  if (query.tipo) filters.tipo = query.tipo
  if (query.categoria) filters.categoria = query.categoria
  return model.getAllInfluencers(filters)
}

async function obtenerInfluencer(id) {
  return model.getInfluencerById(id)
}

async function obtenerContratosDeInfluencer(id) {
  const contratos = await model.getInfluencerContratos(id)
  return contratos.map((c) => ({ ...c, estatus: calcEstatus(c.fecha_fin) }))
}

async function obtenerCampanasDeInfluencer(id) {
  return model.getInfluencerCampanas(id)
}

async function crearInfluencer(data) {
  return model.createInfluencer(data)
}

async function editarInfluencer(id, data) {
  await model.getInfluencerById(id)
  return model.updateInfluencer(id, data)
}

async function eliminarInfluencer(id) {
  await model.getInfluencerById(id)
  return model.deleteInfluencer(id)
}

// ── marcas ────────────────────────────────────────────────────────────────────

async function listarMarcas() { return model.getAllMarcas() }

async function obtenerMarca(id) { return model.getMarcaById(id) }

async function crearMarca(data) { return model.createMarca(data) }

async function editarMarca(id, data) {
  await model.getMarcaById(id)
  return model.updateMarca(id, data)
}

async function eliminarMarca(id) {
  await model.getMarcaById(id)
  return model.deleteMarca(id)
}

// ── contratos ─────────────────────────────────────────────────────────────────

async function listarContratos(query = {}) {
  const hoy = new Date().toISOString().split('T')[0]
  const en30 = new Date()
  en30.setDate(en30.getDate() + 30)
  const en30Str = en30.toISOString().split('T')[0]

  let dateFilters = {}
  if (query.estatus === 'activo') {
    dateFilters.gte = hoy
  } else if (query.estatus === 'vencido') {
    dateFilters.lt = hoy
  } else if (query.estatus === 'por_vencer') {
    dateFilters.gte = hoy
    dateFilters.lte = en30Str
  }

  const contratos = await model.getAllContratos(dateFilters)
  return contratos.map((c) => ({ ...c, estatus: calcEstatus(c.fecha_fin) }))
}

async function obtenerContrato(id) {
  const contrato = await model.getContratoById(id)
  return {
    ...contrato,
    estatus: calcEstatus(contrato.fecha_fin),
    resumen_financiero: resumenFinanciero(contrato),
  }
}

async function crearContrato(data) { return model.createContrato(data) }

async function editarContrato(id, data) {
  await model.getContratoById(id)
  return model.updateContrato(id, data)
}

async function eliminarContrato(id) {
  await model.getContratoById(id)
  return model.deleteContrato(id)
}

// ── entregables ───────────────────────────────────────────────────────────────

async function crearEntregable(data) { return model.createEntregable(data) }

async function editarEntregable(id, data) {
  await model.getEntregableById(id)
  return model.updateEntregable(id, data)
}

async function eliminarEntregable(id) {
  await model.getEntregableById(id)
  return model.deleteEntregable(id)
}

// ── pagos ─────────────────────────────────────────────────────────────────────

async function crearPago(data) { return model.createPago(data) }

async function editarPago(id, data) {
  await model.getPagoById(id)
  return model.updatePago(id, data)
}

async function eliminarPago(id) {
  await model.getPagoById(id)
  return model.deletePago(id)
}

// ── campanas ──────────────────────────────────────────────────────────────────

async function listarCampanas() {
  const campanas = await model.getAllCampanas()
  return campanas.map((c) => ({
    ...c,
    estatus: calcEstatus(c.fecha_fin),
    num_influencers: (c.campanas_influencers || []).length,
  }))
}

async function obtenerCampana(id) { return model.getCampanaById(id) }

async function crearCampana(data) { return model.createCampana(data) }

async function editarCampana(id, data) {
  await model.getCampanaById(id)
  return model.updateCampana(id, data)
}

async function eliminarCampana(id) {
  await model.getCampanaById(id)
  return model.deleteCampana(id)
}

async function agregarInfluencerACampana(campanaId, body) {
  return model.addInfluencerACampana(campanaId, body.influencer_id, body.contrato_id || null)
}

async function quitarInfluencerDeCampana(campanaId, influencerId) {
  return model.removeInfluencerDeCampana(campanaId, influencerId)
}

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  listarInfluencers, obtenerInfluencer, obtenerContratosDeInfluencer, obtenerCampanasDeInfluencer,
  crearInfluencer, editarInfluencer, eliminarInfluencer,
  listarMarcas, obtenerMarca, crearMarca, editarMarca, eliminarMarca,
  listarContratos, obtenerContrato, crearContrato, editarContrato, eliminarContrato,
  crearEntregable, editarEntregable, eliminarEntregable,
  crearPago, editarPago, eliminarPago,
  listarCampanas, obtenerCampana, crearCampana, editarCampana, eliminarCampana,
  agregarInfluencerACampana, quitarInfluencerDeCampana,
}
